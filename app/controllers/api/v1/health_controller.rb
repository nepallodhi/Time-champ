class Api::V1::HealthController < ApplicationController
  skip_before_action :authenticate_user!, raise: false

  def show
    health_data = {
      status: "ok",
      timestamp: Time.current.iso8601,
      database: check_database,
      redis: check_redis,
      sidekiq: check_sidekiq,
      uptime: uptime_seconds
    }

    # Overall status is 'ok' only if all components are healthy
    overall_status = health_data.values_at(:database, :redis, :sidekiq).all? { |c| c[:status] == "ok" }
    health_data[:status] = overall_status ? "ok" : "degraded"

    status_code = overall_status ? :ok : :service_unavailable
    render json: health_data, status: status_code
  end

  private

  def check_database
    ActiveRecord::Base.connection.execute("SELECT 1")
    {
      status: "ok",
      message: "Database connection successful",
      pool_size: ActiveRecord::Base.connection_pool.size,
      active_connections: ActiveRecord::Base.connection_pool.connections.count
    }
  rescue => e
    {
      status: "error",
      message: "Database connection failed: #{e.message}"
    }
  end

  def check_redis
    RedisService.connection.ping
    {
      status: "ok",
      message: "Redis connection successful"
    }
  rescue => e
    {
      status: "error",
      message: "Redis connection failed: #{e.message}"
    }
  end

  def check_sidekiq
    require "sidekiq/api"
    stats = Sidekiq::Stats.new
    {
      status: "ok",
      processed: stats.processed,
      failed: stats.failed,
      enqueued: stats.enqueued,
      scheduled: stats.scheduled_size,
      retry: stats.retry_size,
      dead: stats.dead_size,
      workers: stats.workers_size,
      processes: stats.processes_size
    }
  rescue LoadError => e
    {
      status: "warning",
      message: "Sidekiq not available: #{e.message}"
    }
  rescue => e
    {
      status: "error",
      message: "Sidekiq stats unavailable: #{e.message}"
    }
  end

  def uptime_seconds
    # Calculate uptime based on when the Rails process started
    Process.clock_gettime(Process::CLOCK_MONOTONIC).to_i
  end
end
