class ActivityLog < ApplicationRecord
  self.primary_key = :id # Note: Partitioned table has composite primary key (id, timestamp) in DB
  # But Rails ActiveRecord doesn't support composite PKs natively without gems or extra config.
  # For simple logging, we treat it as read-heavy or write-only.

  belongs_to :work_session, foreign_key: :session_id

  validates :session_id, :activity_type, :duration_seconds, :timestamp, presence: true
end
