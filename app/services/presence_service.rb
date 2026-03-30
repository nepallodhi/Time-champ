class PresenceService
  # Use Redis for presence tracking with key: online_users:{organization_id}
  
  def self.update(user, status)
    redis = RedisService.connection
    key = RedisService.online_users_key(user.organization_id)

    if status == :online
      redis.sadd(key, user.id)
      # Set expiration to prevent stale data (24 hours)
      redis.expire(key, 24.hours.to_i)
    else
      redis.srem(key, user.id)
    end

    user.update(status: status, last_seen: Time.current)
  end

  def self.online_users(organization_id)
    redis = RedisService.connection
    user_ids = redis.smembers(RedisService.online_users_key(organization_id))
    user_ids.map(&:to_i)
  end

  def self.is_online?(user)
    redis = RedisService.connection
    redis.sismember(RedisService.online_users_key(user.organization_id), user.id)
  end

  def self.count_online(organization_id)
    redis = RedisService.connection
    redis.scard(RedisService.online_users_key(organization_id))
  end
end

