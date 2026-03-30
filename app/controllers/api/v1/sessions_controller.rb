class Api::V1::SessionsController < ApplicationController
  include Authenticatable

  def start
    # Get user_id from params (defaults to current_user if not provided)
    target_user_id = params[:user_id] || current_user.id

    # Find the target user
    target_user = if target_user_id == current_user.id
      current_user
    else
      # Only admins and managers can start sessions for other users
      unless current_user.role == "admin" || current_user.role == "manager"
        return render json: { error: "You can only start sessions for yourself" }, status: :forbidden
      end

      # Managers can only start sessions for their team members
      if current_user.role == "manager"
        target_user = current_user.organization.users.find_by(id: target_user_id, manager_id: current_user.id)
        unless target_user
          return render json: { error: "You can only start sessions for employees in your team" }, status: :forbidden
        end
      else
        # Admin can start for any user in the organization
        target_user = current_user.organization.users.find_by(id: target_user_id)
        unless target_user
          return render json: { error: "User not found" }, status: :not_found
        end
      end

      target_user
    end

    # Check if user already has an active session
    existing_session = target_user.work_sessions.active.last

    if existing_session
      # User already has an active session, return it
      Rails.logger.info "User #{target_user.id} already has active session #{existing_session.id}, returning existing session"

      render json: {
        session_id: existing_session.id,
        session: session_response(existing_session)
      }, status: :ok
    else
      # Create new session
      session = target_user.work_sessions.new(
        organization: target_user.organization,
        start_time: Time.current,
        status: "active",
        last_activity_at: Time.current
      )

      if session.save
        # USER_ONLINE and session start will be broadcast via after_commit callback in WorkSession model
        # This ensures broadcast happens after database commit
        Rails.logger.info "ActionCable: Session created, broadcast will happen after commit"

        render json: {
          session_id: session.id,
          session: session_response(session)
        }, status: :created
      else
        render json: { errors: session.errors.full_messages }, status: :unprocessable_entity
      end
    end
  end

  def stop
    session = current_user.work_sessions.find(params[:id])

    # Check if session is already stopped
    if session.status == "stopped"
      return render json: { session: session_response(session) }
    end

    begin
      session.stop!
      # Reload to get updated attributes
      session.reload

      # Update today's daily summary synchronously to ensure it's available immediately
      # The after_commit callback will also run, but this ensures it's done before response
      begin
        today = Date.current
        sessions_today = current_user.work_sessions.where(start_time: today.all_day)

        # Calculate active and idle seconds, handling sessions without activity logs
        active = 0
        idle = 0

        sessions_today.each do |s|
          session_active = s.total_active_seconds || 0
          session_idle = s.total_idle_seconds || 0
          session_total = session_active + session_idle

          # If session has no activity logs but has duration, use session duration as active time
          if session_total == 0 && s.start_time && s.end_time
            session_duration = (s.end_time - s.start_time).to_i
            session_active = session_duration
          elsif session_total == 0 && s.start_time && s.status == "active"
            # For active sessions without activity logs, calculate from start_time to now
            session_duration = (Time.current - s.start_time).to_i
            session_active = session_duration
          end

          active += session_active
          idle += session_idle
        end

        total_work = sessions_today.sum { |s|
          s.end_time.present? ? (s.end_time - s.start_time).to_i : 0
        }

        # Calculate productivity based on 8 hours per day
        hours_per_day = 8
        seconds_per_day = hours_per_day * 3600
        productivity = (active.to_f / seconds_per_day * 100).round(2)
        productivity = [ productivity, 100.0 ].min

        DailySummary.find_or_initialize_by(user: current_user, date: today).tap do |summary|
          summary.organization = current_user.organization
          summary.total_work_seconds = total_work
          summary.active_seconds = active
          summary.idle_seconds = idle
          summary.productivity_score = productivity
          summary.save!
        end
      rescue StandardError => e
        Rails.logger.error "Failed to update daily summary in controller: #{e.message}"
        # Continue even if daily summary update fails
      end

      # USER_OFFLINE and session stop will be broadcast via after_commit callback in WorkSession model
      # This ensures broadcast happens after database commit
      Rails.logger.info "ActionCable: Session stopped, broadcast will happen after commit"

      render json: { session: session_response(session) }
    rescue ActiveRecord::RecordInvalid => e
      Rails.logger.error "Failed to stop session: #{e.message}"
      render json: { errors: session.errors.full_messages }, status: :unprocessable_entity
    rescue ActiveRecord::StaleObjectError
      render json: { error: "Session update conflict. Please try again." }, status: :conflict
    rescue StandardError => e
      Rails.logger.error "Error stopping session: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: "Failed to stop session: #{e.message}" }, status: :internal_server_error
    end
  end

  def active
    # Try to get from cache first, then fallback to database
    # Order by ID desc to get the most recent one
    session = current_user.work_sessions.where(status: "active").order(id: :desc).first

    if session
      # Refresh cache if session exists
      # SessionCacheService.refresh(session) # Commented out as we don't know if this service exists/works
      render json: { session: session_response(session) }
    else
      # Check if there's a recently created session that might not be marked active yet (edge case)
      recent_session = current_user.work_sessions.order(created_at: :desc).first
      if recent_session && recent_session.end_time.nil? && recent_session.created_at > 5.minutes.ago
         # Recover this session as active
         recent_session.update(status: "active")
         render json: { session: session_response(recent_session) }
      else
        render json: { session: nil }, status: :ok # Return 200 with null session, not 404
      end
    end
  end

  def index
    # Get all work sessions for the current user
    sessions = current_user.work_sessions.order(created_at: :desc)
    render json: { sessions: sessions.map { |s| session_response(s) } }
  end

  private

  def session_response(session)
    {
      id: session.id,
      user_id: session.user_id,
      start_time: session.start_time,
      end_time: session.end_time,
      last_activity_at: session.last_activity_at,
      total_active_seconds: session.total_active_seconds,
      total_idle_seconds: session.total_idle_seconds,
      status: session.status
    }
  end
end
