class WorkSession < ApplicationRecord
  belongs_to :organization
  belongs_to :user
  has_many :screenshots, foreign_key: :session_id, dependent: :destroy
  has_many :activity_logs, foreign_key: :session_id, dependent: :destroy
  has_many :activity_minutes, dependent: :destroy

  validates :start_time, presence: true
  validates :total_active_seconds, :total_idle_seconds, :total_keyboard_events, :total_mouse_events, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :status, inclusion: { in: %w[active stopped] }
  # validate :only_one_active_session_per_user, on: :create
  validate :cannot_update_stopped_session, on: :update

  scope :active, -> { where(status: "active") }

  # Broadcast after commit to ensure data is persisted
  after_commit :broadcast_session_start, on: :create, if: -> { status == "active" }
  after_commit :broadcast_session_update, on: :update, if: -> { saved_change_to_last_activity_at? || saved_change_to_total_active_seconds? || saved_change_to_total_idle_seconds? }
  after_commit :broadcast_session_stop, on: :update, if: -> { saved_change_to_status? && status == "stopped" }
  after_commit :update_today_daily_summary, on: :update, if: -> { saved_change_to_status? && status == "stopped" }

  # Cache session in Redis after commit
  after_commit :cache_session, if: -> { persisted? }
  after_destroy :invalidate_session_cache

  def stop!
    return self if status == "stopped"

    # Temporarily skip the validation that prevents updating stopped sessions
    # since we're explicitly stopping an active session
    self.status = "stopped"
    self.end_time = Time.current

    # Save with validation, but the cannot_update_stopped_session validation
    # should allow this since status_was != "stopped"
    save!
    self
  end

  private

  def broadcast_session_start
    # USER_ONLINE is already handled by OrganizationChannel#subscribed via presence_track
    # But we also broadcast session start event
    ActionCable.server.broadcast(
      "organization_#{organization_id}",
      {
        type: "USER_ONLINE",
        user_id: user_id,
        user_name: user.name,
        session_id: id,
        start_time: start_time
      }
    )
  end

  def broadcast_session_update
    # Broadcast SESSION_UPDATE when activity is logged
    return unless status == "active"

    ActionCable.server.broadcast(
      "organization_#{organization_id}",
      {
        type: "SESSION_UPDATE",
        user_id: user_id,
        session_id: id,
        last_activity_at: last_activity_at,
        total_active_seconds: total_active_seconds,
        total_idle_seconds: total_idle_seconds
      }
    )
  end

  def broadcast_session_stop
    # Broadcast SESSION_STOPPED when session stops
    # Note: We don't broadcast USER_OFFLINE here because the user is still logged in
    # USER_OFFLINE should only be sent when the user actually logs out or disconnects
    ActionCable.server.broadcast(
      "organization_#{organization_id}",
      {
        type: "SESSION_STOPPED",
        user_id: user_id,
        user_name: user.name,
        session_id: id,
        total_active_seconds: total_active_seconds,
        total_idle_seconds: total_idle_seconds,
        end_time: end_time
      }
    )

    # Also broadcast to user's personal channel
    ActionCable.server.broadcast(
      "user_#{user_id}",
      {
        type: "SESSION_STATE",
        session: nil
      }
    )
  end

  def cache_session
    SessionCacheService.cache(self)
  end

  def invalidate_session_cache
    SessionCacheService.delete(id)
  end

  def update_today_daily_summary
    # Update or create today's daily summary when a session stops
    return unless status == "stopped" && end_time.present?

    today = Date.current
    sessions_today = user.work_sessions.where(start_time: today.all_day)

    # Calculate totals from all sessions today
    total_work = sessions_today.sum { |s|
      if s.end_time.present?
        (s.end_time - s.start_time).to_i
      else
        0
      end
    }

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

    # Calculate productivity based on 8 hours per day
    # 1 hour = 12.5% (1/8 * 100)
    # Accumulates across multiple sessions in a day
    hours_per_day = 8
    seconds_per_day = hours_per_day * 3600
    productivity = (active.to_f / seconds_per_day * 100).round(2)
    # Cap at 100%
    productivity = [ productivity, 100.0 ].min

    # Update or create today's summary
    DailySummary.find_or_initialize_by(user: user, date: today).tap do |summary|
      summary.organization = organization
      summary.total_work_seconds = total_work
      summary.active_seconds = active
      summary.idle_seconds = idle
      summary.productivity_score = productivity
      summary.save!
    end
  rescue StandardError => e
    Rails.logger.error "Failed to update daily summary: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    # Don't fail the transaction if daily summary update fails
  end

  # def only_one_active_session_per_user
  #   if user.work_sessions.active.exists?
  #     errors.add(:base, "User already has an active session")
  #   end
  # end

  def cannot_update_stopped_session
    # Allow stopping an active session (transition from active to stopped)
    return if status_was == "active" && status == "stopped"

    if status_was == "stopped" && status_changed?
      errors.add(:base, "Cannot restart a stopped session")
    elsif status_was == "stopped"
      # Allow some updates if needed? The requirement says "Cannot update stopped session"
      # But technically we might want to update totals one last time?
      # Actually, activity logs should only be sent while active.
      errors.add(:base, "Cannot update a stopped session") unless end_time_changed?
    end
  end
end
