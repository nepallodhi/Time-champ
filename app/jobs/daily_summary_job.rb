require "sidekiq-scheduler"

class DailySummaryJob
  include Sidekiq::Job

  # Configure retry: 3 times with exponential backoff (default behavior)
  sidekiq_options retry: 3, backtrace: true, dead: false

  def perform
    # Idempotent: Process each organization independently
    # If job fails partway, retry will continue from where it left off
    Organization.find_each do |org|
      process_organization(org)
    end
  end

  private

  def process_organization(org)
    yesterday = Date.yesterday
    org.users.find_each do |user|
      # Idempotent: find_or_initialize_by ensures we can safely retry
      sessions = user.work_sessions.where(start_time: yesterday.all_day)
      next if sessions.empty?

      total_work = sessions.sum { |s| (s.end_time || Time.current) - s.start_time }.to_i
      active = sessions.sum(:total_active_seconds)
      idle = sessions.sum(:total_idle_seconds)

      productivity = total_work > 0 ? (active.to_f / total_work).round(2) : 0.0

      # Idempotent operation: upsert ensures no duplicates
      DailySummary.find_or_initialize_by(user: user, date: yesterday).tap do |s|
        s.organization = org
        s.total_work_seconds = total_work
        s.active_seconds = active
        s.idle_seconds = idle
        s.productivity_score = productivity
        s.save!
      end
    end
  end
end
