class JwtService
  SECRET_KEY = ENV.fetch("JWT_SECRET") { Rails.application.credentials.secret_key_base }
  REFRESH_SECRET_KEY = ENV.fetch("JWT_REFRESH_SECRET") { Rails.application.credentials.secret_key_base + "_refresh" }

  def self.encode(payload, exp = 24.hours.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET_KEY)
  end

  def self.encode_refresh(payload, exp = 7.days.from_now)
    payload[:exp] = exp.to_i
    payload[:type] = "refresh"
    JWT.encode(payload, REFRESH_SECRET_KEY)
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY)[0]
    HashWithIndifferentAccess.new decoded
  rescue JWT::DecodeError
    nil
  end

  def self.decode_refresh(token)
    decoded = JWT.decode(token, REFRESH_SECRET_KEY)[0]
    HashWithIndifferentAccess.new decoded
  rescue JWT::DecodeError
    nil
  end
end
