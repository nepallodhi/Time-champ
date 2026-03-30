class Rack::Attack
  # Use Redis for rate limiting storage
  Rack::Attack.cache.store = ActiveSupport::Cache::RedisCacheStore.new(
    url: ENV.fetch("REDIS_URL") { "redis://localhost:6379/1" },
    namespace: "rack:attack"
  )

  # Allow requests from localhost in development
  safelist("allow-localhost") do |req|
    req.ip == "127.0.0.1" || req.ip == "::1" if Rails.env.development?
  end

  # Throttle authentication endpoints
  throttle("auth/ip", limit: 5, period: 1.minute) do |req|
    if req.path.match?(%r{^/api/v1/auth/(login|register)}) && req.post?
      req.ip
    end
  end

  # Throttle activity ingestion per user
  throttle("activity/user", limit: 200, period: 1.minute) do |req|
    if req.path.match?(%r{^/api/v1/sessions/\d+/activity}) && req.post?
      # Extract user ID from JWT token
      auth_header = req.get_header("HTTP_AUTHORIZATION")
      if auth_header&.start_with?("Bearer ")
        token = auth_header.split(" ").last
        begin
          payload = JwtService.decode(token)
          payload["user_id"] if payload
        rescue
          nil
        end
      end
    end
  end

  # General API rate limit per user
  throttle("api/user", limit: 100, period: 1.minute) do |req|
    if req.path.start_with?("/api/v1/")
      auth_header = req.get_header("HTTP_AUTHORIZATION")
      if auth_header&.start_with?("Bearer ")
        token = auth_header.split(" ").last
        begin
          payload = JwtService.decode(token)
          payload["user_id"] if payload
        rescue
          nil
        end
      end
    end
  end

  # Response when throttled
  self.throttled_responder = lambda do |env|
    retry_after = env["rack.attack.match_data"][:period]
    [
      429,
      {
        "Content-Type" => "application/json",
        "Retry-After" => retry_after.to_s
      },
      [ { error: "Rate limit exceeded. Please try again later." }.to_json ]
    ]
  end
end
