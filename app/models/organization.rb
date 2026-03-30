class Organization < ApplicationRecord
  has_many :users, dependent: :destroy
  has_many :projects, dependent: :destroy
  has_many :work_sessions, dependent: :destroy
  has_many :daily_summaries, dependent: :destroy
  has_many :job_departments, dependent: :destroy

  validates :name, presence: true, uniqueness: true
end
