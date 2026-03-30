class JobDepartment < ApplicationRecord
  belongs_to :organization
  has_many :salary_bonuses, class_name: "SalaryBonus", foreign_key: "job_id", dependent: :destroy
  has_many :payrolls, dependent: :destroy
  has_many :users, through: :qualifications

  validates :job_dept, presence: true
  validates :name, presence: true
end
