class IdleDetectionJob
  include Sidekiq::Job

  # Configure retry: 3 times with exponential backoff (default behavior)
  sidekiq_options retry: 3, backtrace: true, dead: false

  def perform
    # Idempotent: Check user status before processing to avoid duplicate alerts
    # Users with active sessions who haven't had activity in 5 minutes
    threshold = 5.minutes.ago
    WorkSession.active.where("last_activity_at < ?", threshold).find_each do |session|
      user = session.user
      # Idempotent: Skip if already marked as idle (prevents duplicate processing)
      next if user.idle?

      # Idempotent: Check if alert already exists for this user within the threshold window
      next if Alert.exists?(user: user, alert_type: "idle", created_at: threshold..Time.current)

      user.idle!
      Alert.create!(
        user: user,
        alert_type: "idle",
        message: "User #{user.name} has been idle for more than 5 minutes"
      )

      # Broadcast INACTIVE_ALERT to organization channel
      ActionCable.server.broadcast(
        "organization_#{user.organization_id}",
        {
          type: "INACTIVE_ALERT",
          user_id: user.id,
          user_name: user.name,
          session_id: session.id,
          message: "User #{user.name} has been idle for more than 5 minutes",
          idle_duration_seconds: (Time.current - session.last_activity_at).to_i
        }
      )
    end
  end
end
