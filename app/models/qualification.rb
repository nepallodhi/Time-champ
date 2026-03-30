class Qualification < ApplicationRecord
  belongs_to :user
  belongs_to :job_department, foreign_key: :job_id, optional: true

  validates :position, presence: true
  validates :date_in, presence: true
end
