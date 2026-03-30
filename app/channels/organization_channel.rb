class OrganizationChannel < ApplicationCable::Channel
  def subscribed
    begin
      Rails.logger.info "ActionCable: OrganizationChannel#subscribed called for user #{current_user&.id}"
      Rails.logger.info "ActionCable: Params received: #{params.inspect}"
      
      # Accept organization_id parameter if provided, otherwise use current_user's organization
      # requested_org_id = params[:organization_id]&.to_i
      requested_org_id = params["organization_id"]&.to_i
      user_org_id = current_user.organization_id
      
      Rails.logger.info "ActionCable: Requested org_id: #{requested_org_id.inspect}, User org_id: #{user_org_id}"
      
      # Validate: user can only subscribe to their own organization
      if requested_org_id && requested_org_id != user_org_id
        error_message = {
          type: "subscription_rejected",
          reason: "organization_id_mismatch",
          message: "You can only subscribe to your own organization",
          details: {
            requested_organization_id: requested_org_id,
            user_organization_id: user_org_id,
            user_id: current_user.id
          }
        }
        Rails.logger.warn "ActionCable: User #{current_user.id} attempted to subscribe to organization #{requested_org_id}, but belongs to organization #{user_org_id}"
        
        # Broadcast error to user's personal channel so they can see it in Postman
        ActionCable.server.broadcast("user_#{current_user.id}", error_message)
        
        # Also try to transmit before rejecting (might not work, but worth trying)
        begin
          transmit(error_message)
        rescue => e
          Rails.logger.warn "ActionCable: Could not transmit error message: #{e.message}"
        end
        
        # Reject with reason (if supported)
        reject(reason: error_message)
        return
      end
      
      channel_name = "organization_#{user_org_id}"
      Rails.logger.info "ActionCable: User #{current_user.id} subscribing to channel: #{channel_name}"
      stream_from channel_name
      Rails.logger.info "ActionCable: Successfully subscribed to channel: #{channel_name}"
      
      # Send confirmation message
      transmit({
        type: "subscription_confirmed",
        channel: "OrganizationChannel",
        channel_name: channel_name,
        organization_id: user_org_id,
        user_id: current_user.id
      })
      
      # Track presence and broadcast USER_ONLINE
      presence_track(:online)
    rescue StandardError => e
      error_message = {
        type: "subscription_error",
        reason: "internal_error",
        message: "An error occurred while subscribing to the channel",
        error: e.message,
        details: {
          user_id: current_user&.id,
          error_class: e.class.name
        }
      }
      Rails.logger.error "ActionCable: Subscription error for user #{current_user&.id}: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      
      # Broadcast error to user's personal channel
      if current_user&.id
        ActionCable.server.broadcast("user_#{current_user.id}", error_message)
      end
      
      # Try to transmit before rejecting
      begin
        transmit(error_message)
        reject
      rescue => transmit_error
        Rails.logger.warn "ActionCable: Could not transmit error message: #{transmit_error.message}"
      end
      
      # reject(reason: error_message)
    end
  end

  def unsubscribed
    Rails.logger.info "ActionCable: User #{current_user.id} unsubscribing from organization channel"
    presence_track(:offline)
  end

  private

  def presence_track(status)
    PresenceService.update(current_user, status)
    ActionCable.server.broadcast "organization_#{current_user.organization_id}", {
      type: "USER_#{status.to_s.upcase}",
      user_id: current_user.id
    }
  end
end
