class Api::V1::ProjectsController < ApplicationController
  include Authenticatable
  before_action :set_project, only: [ :show, :update, :destroy, :assign_user, :unassign_user ]

  def index
    projects = current_user.organization.projects.includes(:assigned_users)
    render json: projects.map { |p| project_response(p) }
  end

  def show
    render json: project_response(@project)
  end

  def create
    project = current_user.organization.projects.new(project_params)
    project.created_by = current_user.id

    if project.save
      render json: project_response(project), status: :created
    else
      render json: { errors: project.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    if @project.update(project_params)
      render json: project_response(@project)
    else
      render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @project.destroy
    head :no_content
  end

  # POST /api/v1/projects/:id/assign_user
  # Accepts either user_id (single) or user_ids (array) for backward compatibility
  def assign_user
    # Support both single user_id and array of user_ids
    user_ids = if params[:user_ids].present?
      params[:user_ids]
    elsif params[:user_id].present?
      [params[:user_id]]
    else
      return render json: { error: "user_id or user_ids parameter is required" }, status: :bad_request
    end

    # Ensure user_ids is an array
    user_ids = [user_ids] unless user_ids.is_a?(Array)
    user_ids = user_ids.map(&:to_i).uniq

    # Find all users in the organization
    users = current_user.organization.users.where(id: user_ids)
    
    # Check if all users were found
    if users.count != user_ids.count
      found_ids = users.pluck(:id)
      missing_ids = user_ids - found_ids
      return render json: { error: "Users not found: #{missing_ids.join(', ')}" }, status: :not_found
    end

    # Filter out users already assigned to this project
    already_assigned = @project.assigned_users.where(id: user_ids).pluck(:id)
    new_user_ids = user_ids - already_assigned

    if new_user_ids.empty?
      return render json: { 
        error: "All selected users are already assigned to this project",
        already_assigned: already_assigned
      }, status: :unprocessable_entity
    end

    # Create project assignments for new users
    new_users = users.where(id: new_user_ids)
    
    # Save all assignments in a transaction
    begin
      ActiveRecord::Base.transaction do
        new_user_ids.each do |user_id|
          assignment = @project.project_assignments.build(user_id: user_id)
          unless assignment.save
            raise ActiveRecord::RecordInvalid.new(assignment)
          end
        end
      end
      
      render json: {
        message: "#{new_users.count} user(s) assigned to project successfully",
        project: project_response(@project.reload),
        assigned_users: new_users.map { |u|
          {
            id: u.id,
            name: u.name,
            email: u.email
          }
        },
        already_assigned: already_assigned
      }
    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: [e.record.errors.full_messages].flatten }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/projects/:id/unassign_user
  def unassign_user
    user = current_user.organization.users.find(params[:user_id])
    
    unless user
      return render json: { error: "User not found" }, status: :not_found
    end

    assignment = @project.project_assignments.find_by(user: user)
    if assignment
      assignment.destroy
      render json: {
        message: "User unassigned from project successfully",
        project: project_response(@project.reload)
      }
    else
      render json: { error: "User is not assigned to this project" }, status: :not_found
    end
  end

  # GET /api/v1/projects/available_employees
  def available_employees
    # Get all employees in the organization
    all_employees = current_user.organization.users.where(role: 'employee')
    
    # Get all assigned user IDs
    assigned_user_ids = ProjectAssignment.joins(:project)
      .where(projects: { organization_id: current_user.organization_id })
      .pluck(:user_id)
      .uniq
    
    # Filter to get only available employees (not assigned to any project)
    available_employees = all_employees.where.not(id: assigned_user_ids)
    
    # If manager, filter to only their team members
    if current_user.role == 'manager'
      available_employees = available_employees.where(manager_id: current_user.id)
    end
    
    render json: available_employees.map { |u|
      {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        manager_id: u.manager_id
      }
    }
  end

  private

  def set_project
    @project = current_user.organization.projects.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Project not found" }, status: :not_found
  end

  def project_params
    params.require(:project).permit(:name, :description)
  end

  def project_response(project)
    {
      id: project.id,
      name: project.name,
      description: project.description,
      organization_id: project.organization_id,
      created_by: project.created_by,
      created_at: project.created_at,
      updated_at: project.updated_at,
      assigned_users: project.assigned_users.map { |u|
        {
          id: u.id,
          name: u.name,
          email: u.email
        }
      }
    }
  end
end
