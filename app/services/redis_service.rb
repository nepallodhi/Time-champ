class RedisService
  class << self
    def connection
      @connection ||= Redis.new(url: redis_url)
    end

    def redis_url
      ENV.fetch("REDIS_URL") { "redis://localhost:6379/1" }
    end

    # Presence tracking keys
    def online_users_key(organization_id = nil)
      if organization_id
        "online_users:#{organization_id}"
      else
        "online_users"
      end
    end

    # Session cache keys
    def session_key(session_id)
      "session:#{session_id}"
    end

    # Rate limiting keys (used by Rack::Attack)
    def rate_limit_key(identifier, period)
      "rate_limit:#{identifier}:#{period}"
    end
  end
end
