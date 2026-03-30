class SessionCacheService
  # Use Redis for session caching with key: session:{id}
  CACHE_TTL = 1.hour.to_i

  def self.cache(session)
    return unless session

    redis = RedisService.connection
    key = RedisService.session_key(session.id)
    
    session_data = {
      id: session.id,
      user_id: session.user_id,
      organization_id: session.organization_id,
      start_time: session.start_time.iso8601,
      end_time: session.end_time&.iso8601,
      status: session.status,
      total_active_seconds: session.total_active_seconds,
      total_idle_seconds: session.total_idle_seconds,
      last_activity_at: session.last_activity_at&.iso8601,
      cached_at: Time.current.iso8601
    }

    redis.setex(key, CACHE_TTL, session_data.to_json)
  end

  def self.get(session_id)
    redis = RedisService.connection
    key = RedisService.session_key(session_id)
    
    cached = redis.get(key)
    return nil unless cached

    JSON.parse(cached, symbolize_names: true)
  rescue JSON::ParserError
    nil
  end

  def self.delete(session_id)
    redis = RedisService.connection
    key = RedisService.session_key(session_id)
    redis.del(key)
  end

  def self.exists?(session_id)
    redis = RedisService.connection
    key = RedisService.session_key(session_id)
    redis.exists?(key)
  end

  def self.refresh(session)
    cache(session)
  end
end
