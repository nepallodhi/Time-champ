class OvertimeAlertJob
  include Sidekiq::Job

  # Configure retry: 3 times with exponential backoff (default behavior)
  sidekiq_options retry: 3, backtrace: true, dead: false

  def perform
    today = Date.today
    nine_hours_in_seconds = 9.hours.to_i # 32400 seconds

    # Find all users with active sessions today
    User.joins(:work_sessions)
        .where(work_sessions: { start_time: today.all_day, status: "active" })
        .distinct
        .find_each do |user|
      # Calculate total work seconds for the day across all sessions
      total_work_seconds = calculate_total_work_seconds(user, today)

      # Check if total work exceeds 9 hours
      if total_work_seconds > nine_hours_in_seconds
        # Idempotent: Skip if alert already exists for today (prevents duplicate alerts)
        next if Alert.exists?(user: user, alert_type: "overtime", created_at: today.all_day)

        hours_worked = (total_work_seconds / 3600.0).round(2)
        active_session = user.work_sessions.active.where(start_time: today.all_day).last

        # Store alert record
        alert = Alert.create!(
          user: user,
          alert_type: "overtime",
          message: "User #{user.name} has worked #{hours_worked} hours today (exceeds 9 hours)"
        )

        # Emit WebSocket alert
        ActionCable.server.broadcast(
          "organization_#{user.organization_id}",
          {
            type: "OVERTIME_ALERT",
            user_id: user.id,
            user_name: user.name,
            session_id: active_session&.id,
            hours_worked: hours_worked,
            total_work_seconds: total_work_seconds,
            alert_id: alert.id,
            message: "User #{user.name} has worked #{hours_worked} hours today (exceeds 9 hours)"
          }
        )
      end
    end
  end

  private

  def calculate_total_work_seconds(user, date)
    # Get all sessions for the day (active and stopped)
    sessions = user.work_sessions.where(start_time: date.all_day)

    # Calculate total work time: sum of (end_time - start_time) for stopped sessions
    # and (current_time - start_time) for active sessions
    sessions.sum do |session|
      if session.status == "stopped" && session.end_time
        (session.end_time - session.start_time).to_i
      elsif session.status == "active"
        (Time.current - session.start_time).to_i
      else
        0
      end
    end
  end
end
