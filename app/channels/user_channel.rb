class UserChannel < ApplicationCable::Channel
  def subscribed
    channel_name = "user_#{current_user.id}"
    Rails.logger.info "ActionCable: User #{current_user.id} subscribing to UserChannel: #{channel_name}"
    stream_from channel_name
    Rails.logger.info "ActionCable: Successfully subscribed to UserChannel: #{channel_name}"
    
    # Send confirmation message
    transmit({
      type: "subscription_confirmed",
      channel: "UserChannel",
      channel_name: channel_name,
      user_id: current_user.id
    })
    
    # Send current session state on reconnect
    send_session_state
  end

  def unsubscribed
    stop_all_streams
  end

  private

  def send_session_state
    session = current_user.work_sessions.active.last
    if session
      transmit({
        type: "SESSION_STATE",
        session: {
          id: session.id,
          start_time: session.start_time,
          last_activity_at: session.last_activity_at,
          total_active_seconds: session.total_active_seconds,
          total_idle_seconds: session.total_idle_seconds,
          status: session.status
        }
      })
    else
      transmit({
        type: "SESSION_STATE",
        session: nil
      })
    end
  end
end
