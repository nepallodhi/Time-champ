class Leave < ApplicationRecord
  self.table_name = "leaves"
  
  belongs_to :user
  has_many :payrolls, dependent: :nullify

  validates :date, presence: true
  validates :status, inclusion: { in: %w[pending approved rejected cancelled] }

  scope :approved, -> { where(status: "approved") }
  scope :pending, -> { where(status: "pending") }
end
