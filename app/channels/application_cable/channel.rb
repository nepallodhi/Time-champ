module ApplicationCable
  class Channel < ActionCable::Channel::Base
    # Add logging for subscription lifecycle
    def subscribed
      Rails.logger.info "ActionCable: Channel subscription started for #{self.class.name}"
      super if defined?(super)
    rescue => e
      Rails.logger.error "ActionCable: Error in subscribed callback: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      raise
    end

    def unsubscribed
      Rails.logger.info "ActionCable: Channel unsubscribed from #{self.class.name}"
      super if defined?(super)
    rescue => e
      Rails.logger.error "ActionCable: Error in unsubscribed callback: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
    end
  end
end
