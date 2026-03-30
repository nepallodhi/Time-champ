module Authenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!
  end

  private

  def authenticate_user!
    header = request.headers["Authorization"]
    
    unless header.present?
      return render json: { errors: "Authorization header is missing" }, status: :unauthorized
    end
    
    # Extract token from "Bearer TOKEN" format
    token = header.split(" ").last if header
    
    unless token.present?
      return render json: { errors: "Authorization token is missing" }, status: :unauthorized
    end
    
    begin
      @decoded = JwtService.decode(token)
      unless @decoded && @decoded[:user_id]
        return render json: { errors: "Invalid token: missing user_id" }, status: :unauthorized
      end
      @current_user = User.find(@decoded[:user_id])
    rescue ActiveRecord::RecordNotFound => e
      render json: { errors: "User not found: #{e.message}" }, status: :unauthorized
    rescue JWT::DecodeError => e
      render json: { errors: "Invalid or expired token: #{e.message}" }, status: :unauthorized
    rescue => e
      Rails.logger.error "Authentication error: #{e.class} - #{e.message}"
      render json: { errors: "Authentication failed: #{e.message}" }, status: :unauthorized
    end

    unless @current_user
      render json: { errors: "Unauthorized" }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end
end
