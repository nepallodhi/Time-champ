module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
      Rails.logger.info "ActionCable: Connection established for user #{current_user.id}"
    end

    # Override to add logging for incoming messages
    def receive(data)
      Rails.logger.debug "ActionCable: Received message: #{data.inspect}"
      super
    rescue => e
      Rails.logger.error "ActionCable: Error processing message: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      raise
    end

    private

    def find_verified_user
      # Try to get token from query parameter first, then from Authorization header
      token = request.params[:token] || extract_token_from_header
      
      unless token
        Rails.logger.warn "ActionCable: No token provided in connection request"
        reject_unauthorized_connection
        return
      end

      decoded = JwtService.decode(token)
      unless decoded
        Rails.logger.warn "ActionCable: Invalid or expired JWT token"
        reject_unauthorized_connection
        return
      end

      user = User.find_by(id: decoded[:user_id])
      unless user
        Rails.logger.warn "ActionCable: User not found for user_id: #{decoded[:user_id]}"
        reject_unauthorized_connection
        return
      end

      Rails.logger.info "ActionCable: User #{user.id} (#{user.email}) connected successfully"
      user
    end

    def extract_token_from_header
      auth_header = request.headers["Authorization"] || request.headers["HTTP_AUTHORIZATION"]
      return nil unless auth_header
      
      # Support both "Bearer TOKEN" and just "TOKEN" formats
      if auth_header.start_with?("Bearer ")
        auth_header.split(" ").last
      else
        auth_header
      end
    end
  end
end
