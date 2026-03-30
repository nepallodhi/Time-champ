class Api::V1::DashboardController < ApplicationController
  include Authenticatable

  def statistics
    if current_user.role == "manager" || current_user.role == "admin"
      render_manager_statistics
    else
      render json: { error: "Unauthorized" }, status: :forbidden
    end
  end

  private

  def render_manager_statistics
    organization = current_user.organization
    
    # Get team members (employees under this manager)
    # For admins, show all employees; for managers, show only their team
    team_members = if current_user.role == "admin"
      organization.users.where(role: "employee")
    else
      current_user.team_members.where(role: "employee")
    end
    
    # Employees count
    employees_count = team_members.count
    
    # Team productivity - average productivity from today's daily summaries
    today = Date.current
    today_summaries = DailySummary.where(user: team_members, date: today)
    
    team_productivity = if today_summaries.any?
      # Calculate average productivity from today's summaries
      productivity_scores = today_summaries.pluck(:productivity_score).compact
      if productivity_scores.any?
        (productivity_scores.sum.to_f / productivity_scores.size).round(2)
      else
        0.0
      end
    else
      # If no summaries for today, calculate from active work sessions
      active_sessions = WorkSession.active
                                   .where(user: team_members, organization: organization)
      
      if active_sessions.any?
        # Calculate productivity from active sessions
        total_active = active_sessions.sum(:total_active_seconds) || 0
        total_idle = active_sessions.sum(:total_idle_seconds) || 0
        total_seconds = total_active + total_idle
        
        if total_seconds > 0
          ((total_active.to_f / total_seconds) * 100).round(2)
        else
          0.0
        end
      else
        0.0
      end
    end
    
    # Project count - projects in organization
    # For managers, filter to projects assigned to their team members
    project_count = if current_user.role == "admin"
      organization.projects.count
    else
      # Projects assigned to team members
      project_ids = ProjectAssignment.where(user: team_members).pluck(:project_id).uniq
      organization.projects.where(id: project_ids).count
    end
    
    # Active projects - count projects assigned to team members (sessions no longer have projects)
    active_projects_count = if current_user.role == "admin"
      # Count all projects in organization
      organization.projects.count
    else
      # Count projects assigned to team members
      team_project_ids = ProjectAssignment.where(user: team_members).pluck(:project_id).uniq
      organization.projects.where(id: team_project_ids).count
    end
    
    render json: {
      employees_count: employees_count,
      team_productivity: team_productivity,
      project_count: project_count,
      active_projects: active_projects_count
    }
  end
end
