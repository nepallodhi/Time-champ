Rails.application.configure do
  # Enable Lograge for structured logging
  config.lograge.enabled = true

  # Use JSON formatter
  config.lograge.formatter = Lograge::Formatters::Json.new

  # Custom fields to include in logs
  config.lograge.custom_options = lambda do |event|
    # Handle Action Cable events differently (they don't have headers/params like controller events)
    if event.payload[:headers].nil?
      {
        time: Time.current.iso8601,
        user_id: event.payload[:user_id],
        organization_id: event.payload[:organization_id]
      }
    else
      {
        time: Time.current.iso8601,
        request_id: event.payload[:headers]["action_dispatch.request_id"],
        user_id: event.payload[:user_id],
        organization_id: event.payload[:organization_id],
        ip: event.payload[:ip],
        params: event.payload[:params]&.except("controller", "action", "format") || {}
      }
    end
  end

  # Subscribe to controller events to add user/org context
  ActiveSupport::Notifications.subscribe "process_action.action_controller" do |*args|
    event = ActiveSupport::Notifications::Event.new(*args)

    # Extract user info from request if available
    if event.payload[:headers]
      auth_header = event.payload[:headers]["HTTP_AUTHORIZATION"]
      if auth_header&.start_with?("Bearer ")
        token = auth_header.split(" ").last
        begin
          payload = JwtService.decode(token)
          if payload
            user = User.find_by(id: payload["user_id"])
            event.payload[:user_id] = user&.id
            event.payload[:organization_id] = user&.organization_id
          end
        rescue
          # Ignore JWT decode errors in logging
        end
      end
    end

    # Add IP address
    event.payload[:ip] = event.payload[:remote_ip]
  end
end
