class SalaryBonus < ApplicationRecord
  self.table_name = "salary_bonuses"
  
  belongs_to :job_department, foreign_key: :job_id
  has_many :payrolls, dependent: :destroy

  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :bonus, numericality: { greater_than_or_equal_to: 0 }
end
