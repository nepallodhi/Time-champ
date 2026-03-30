class Api::V1::AlertsController < ApplicationController
  include Authenticatable
  before_action :set_alert, only: [ :show, :resolve ]

  def index
    # Admins and managers can see all alerts in their organization
    # Employees can only see their own alerts
    alerts = if current_user.role.in?([ "admin", "manager" ])
               current_user.organization.users.joins(:alerts).select("alerts.*")
    else
               current_user.alerts
    end

    # Optional filtering by resolved status
    alerts = alerts.where(resolved_at: nil) if params[:unresolved] == "true"

    render json: alerts.order(created_at: :desc)
  end

  def show
    render json: @alert
  end

  def resolve
    if @alert.resolved_at.present?
      render json: { error: "Alert already resolved" }, status: :unprocessable_entity
    else
      @alert.update!(resolved_at: Time.current)

      # Broadcast resolution to organization channel
      ActionCable.server.broadcast(
        "organization_#{current_user.organization_id}",
        {
          type: "alert_resolved",
          alert_id: @alert.id,
          user_id: @alert.user_id,
          resolved_at: @alert.resolved_at
        }
      )

      render json: @alert
    end
  end

  private

  def set_alert
    # Ensure user can only access alerts within their organization
    alert_scope = if current_user.role.in?([ "admin", "manager" ])
                    Alert.joins(:user).where(users: { organization_id: current_user.organization_id })
    else
                    current_user.alerts
    end

    @alert = alert_scope.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Alert not found" }, status: :not_found
  end
end
