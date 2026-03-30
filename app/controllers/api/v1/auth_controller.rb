class Api::V1::AuthController < ApplicationController
  skip_before_action :authenticate_user!, only: [ :login, :register, :refresh ], raise: false

  def register
    # Only allow admin role registration
    role = params[:user]&.dig(:role) || params[:role]
    unless role == "admin"
      return render json: { errors: ["Only admin accounts can be created through registration"] }, status: :forbidden
    end

    organization = Organization.find_or_create_by!(name: params[:organization_name]) do |o|
      o.plan_type = "trial"
    end

    user = organization.users.new(user_params)
    # Force admin role
    user.role = "admin"
    
    if user.save
      access_token = JwtService.encode(user_id: user.id, exp: 24.hours.from_now)
      refresh_token = JwtService.encode_refresh(user_id: user.id, exp: 7.days.from_now)
      render json: { 
        # access_token: access_token,
        refresh_token: refresh_token,
        token: access_token, # Keep for backward compatibility
        user: user_response(user),
        organization_name: organization.name
      }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def login
    user = User.find_by(email: params[:email])
    if user&.authenticate(params[:password])
      # Check in for attendance tracking
      AttendanceService.check_in(user)
      # Update user status to online
      user.update(status: :online, last_seen: Time.current)
      
      access_token = JwtService.encode(user_id: user.id, exp: 24.hours.from_now)
      refresh_token = JwtService.encode_refresh(user_id: user.id, exp: 7.days.from_now)
      
      render json: { 
        access_token: access_token, 
        refresh_token: refresh_token,
        token: access_token, # Keep for backward compatibility
        user: user_response(user) 
      }, status: :ok
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def refresh
    refresh_token = params[:refresh_token]
    
    unless refresh_token.present?
      return render json: { error: "Refresh token is required" }, status: :bad_request
    end

    decoded = JwtService.decode_refresh(refresh_token)
    
    unless decoded && decoded[:user_id] && decoded[:type] == "refresh"
      return render json: { error: "Invalid or expired refresh token" }, status: :unauthorized
    end

    user = User.find_by(id: decoded[:user_id])
    
    unless user
      return render json: { error: "User not found" }, status: :unauthorized
    end

    # Generate new access token
    access_token = JwtService.encode(user_id: user.id, exp: 24.hours.from_now)
    
    # Optionally generate new refresh token (rotate refresh token)
    new_refresh_token = JwtService.encode_refresh(user_id: user.id, exp: 7.days.from_now)
    
    render json: { 
      access_token: access_token,
      refresh_token: new_refresh_token,
      token: access_token, # Keep for backward compatibility
      user: user_response(user)
    }, status: :ok
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :name, :role, :functional_unit, :is_owner)
  end

  def user_response(user)
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization_id: user.organization_id,
      functional_unit: user.functional_unit,
      is_owner: user.is_owner
    }
  end
end
