class AttendanceRecord < ApplicationRecord
  belongs_to :user
  belongs_to :organization

  validates :date, presence: true
  validates :user_id, uniqueness: { scope: :date }

  scope :for_date, ->(date) { where(date: date) }
  scope :for_date_range, ->(start_date, end_date) { where(date: start_date..end_date) }

  def total_seconds
    active_seconds + idle_seconds
  end

  def active_percentage
    total_seconds > 0 ? (active_seconds.to_f / total_seconds * 100).round(2) : 0.0
  end
end
