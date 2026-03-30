class Api::V1::ActivitiesController < ApplicationController
  include Authenticatable

  def create
    session = current_user.work_sessions.find(params[:id])

    unless session.status == "active"
      return render json: { error: "Cannot log activity for a stopped session" }, status: :forbidden
    end

    activity_log = ActivityLog.new(
      session_id: session.id,
      activity_type: params[:activity_type],
      duration_seconds: params[:duration_seconds],
      timestamp: params[:timestamp] || Time.current,
      app_name: params[:app_name],
      url: params[:url]
    )

    # Use optimistic locking to update session totals with retries
    retries = 0
    begin
      if activity_log.save
        update_session_totals(session, activity_log)
        # SESSION_UPDATE will be broadcast via after_commit callback in WorkSession model
        # This ensures broadcast happens after database commit
        render json: { status: "success" }, status: :created
      else
        render json: { errors: activity_log.errors.full_messages }, status: :unprocessable_entity
      end
    rescue ActiveRecord::StaleObjectError
      if (retries += 1) < 3
        session.reload
        retry
      else
        render json: { error: "Concurrency conflict after 3 retries" }, status: :conflict
      end
    end
  end

  private

  def update_session_totals(session, log)
    if log.activity_type == "active"
      session.total_active_seconds += log.duration_seconds
    else
      session.total_idle_seconds += log.duration_seconds
    end
    session.last_activity_at = log.timestamp
    session.save!
  end
end
