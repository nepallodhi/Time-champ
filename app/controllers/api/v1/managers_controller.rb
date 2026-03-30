class Api::V1::ManagersController < ApplicationController
  include Authenticatable
  before_action :set_manager, only: [ :add_employee, :remove_employee ]
  before_action :authorize_manager_or_admin, only: [ :add_employee, :remove_employee ]
  before_action :authorize_admin_only, only: [ :index ]

  # GET /api/v1/managers?organization_id=123
  def index
    # Get organization_id from params or use current user's organization
    organization_id = if params[:organization_id].present?
      org_id = params[:organization_id].to_i
      # Admins can view managers from any organization
      org_id > 0 ? org_id : current_user.organization_id
    else
      current_user.organization_id
    end

    # Find organization
    organization = Organization.find_by(id: organization_id)
    unless organization
      return render json: { error: "Organization not found" }, status: :not_found
    end

    # Get all managers in the organization
    managers = organization.users.where(role: "manager").order(:name)

    # Include team member count for each manager
    managers_data = managers.map do |manager|
      team_count = manager.team_members.where(role: "employee").count
      
      {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        status: manager.status,
        last_seen: manager.last_seen,
        organization_id: manager.organization_id,
        functional_unit: manager.functional_unit,
        team_members_count: team_count,
        created_at: manager.created_at,
        updated_at: manager.updated_at
      }
    end

    render json: {
      organization: {
        id: organization.id,
        name: organization.name
      },
      managers: managers_data,
      total_count: managers_data.size
    }
  end

  # POST /api/v1/managers/:id/employees
  def add_employee
    employee = current_user.organization.users.find_by(id: params[:employee_id], role: "employee")
    
    unless employee
      return render json: { error: "Employee not found" }, status: :not_found
    end

    # Verify manager belongs to same organization
    unless @manager.organization_id == current_user.organization_id
      return render json: { error: "Manager not found" }, status: :not_found
    end

    # Only allow if current user is the manager or an admin
    unless current_user.id == @manager.id || current_user.role == "admin"
      return render json: { error: "Unauthorized" }, status: :forbidden
    end

    employee.manager_id = @manager.id
    if employee.save
      render json: {
        id: employee.id,
        email: employee.email,
        name: employee.name,
        role: employee.role,
        status: employee.status,
        manager_id: employee.manager_id,
        organization_id: employee.organization_id,
        created_at: employee.created_at
      }
    else
      render json: { errors: employee.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/managers/:id/employees/:employee_id
  def remove_employee
    employee = current_user.organization.users.find_by(id: params[:employee_id], role: "employee")
    
    unless employee
      return render json: { error: "Employee not found" }, status: :not_found
    end

    # Verify employee belongs to this manager
    unless employee.manager_id == @manager.id
      return render json: { error: "Employee is not assigned to this manager" }, status: :unprocessable_entity
    end

    # Only allow if current user is the manager or an admin
    unless current_user.id == @manager.id || current_user.role == "admin"
      return render json: { error: "Unauthorized" }, status: :forbidden
    end

    employee.manager_id = nil
    if employee.save
      head :no_content
    else
      render json: { errors: employee.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_manager
    @manager = current_user.organization.users.find_by(id: params[:id], role: "manager")
    unless @manager
      render json: { error: "Manager not found" }, status: :not_found
    end
  end

  def authorize_manager_or_admin
    unless current_user.role.in?([ "admin", "manager" ])
      render json: { error: "Unauthorized" }, status: :forbidden
    end
  end

  def authorize_admin_only
    unless current_user.role == "admin"
      render json: { error: "Only admins can view manager lists" }, status: :forbidden
    end
  end
end
