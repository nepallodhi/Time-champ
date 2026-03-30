class Payroll < ApplicationRecord
  belongs_to :user
  belongs_to :job_department, foreign_key: :job_id
  belongs_to :salary_bonus, foreign_key: :salary_id
  belongs_to :leave, foreign_key: :leave_id, optional: true

  validates :date, presence: true
  validates :total_amount, presence: true, numericality: { greater_than_or_equal_to: 0 }

  scope :by_date, ->(date) { where(date: date) }
  scope :by_user, ->(user_id) { where(user_id: user_id) }
end
