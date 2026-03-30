class ActivityMinute < ApplicationRecord
  belongs_to :work_session

  validates :minute_timestamp, presence: true
  validates :active_seconds, :idle_seconds, :keyboard_events, :mouse_events, 
            numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  # window_titles is stored as JSONB - no need for serialize, PostgreSQL handles it natively

  scope :for_date, ->(date) { where(minute_timestamp: date.beginning_of_day..date.end_of_day) }
  scope :for_session, ->(session_id) { where(work_session_id: session_id) }
  scope :ordered, -> { order(:minute_timestamp) }
end
