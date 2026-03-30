# config/initializers/sidekiq.rb
Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/1") }

  # Load sidekiq-scheduler configuration
  schedule_file = Rails.root.join("config/sidekiq.yml")
  if File.exist?(schedule_file)
    Sidekiq.schedule = YAML.load_file(schedule_file)
  end

  # Auto cleanup: Periodic cleanup of old jobs
  config.on(:startup) do
    Thread.new do
      loop do
        sleep 1.hour
        begin
          # Clean up dead jobs older than 30 days
          dead_set = Sidekiq::DeadSet.new
          cutoff_time = 30.days.ago
          dead_set.each do |job|
            if job.created_at && job.created_at < cutoff_time
              dead_set.delete(job)
            end
          end

          # Clean up retry jobs older than 7 days (jobs that failed and are retrying)
          retry_set = Sidekiq::RetrySet.new
          retry_cutoff = 7.days.ago
          retry_set.each do |job|
            if job.created_at && job.created_at < retry_cutoff
              retry_set.delete(job)
            end
          end

          Rails.logger.info "Sidekiq cleanup completed: Dead jobs and old retries cleaned"
        rescue => e
          Rails.logger.error "Sidekiq cleanup error: #{e.message}"
          Rails.logger.error e.backtrace.join("\n")
        end
      end
    end
  end
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/1") }
end
