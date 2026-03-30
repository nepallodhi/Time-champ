class DailySummary < ApplicationRecord
  belongs_to :organization
  belongs_to :user

  validates :date, presence: true
  validates :user_id, uniqueness: { scope: :date }
end
