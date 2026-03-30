class Project < ApplicationRecord
  belongs_to :organization
  has_many :project_assignments, dependent: :destroy
  has_many :assigned_users, through: :project_assignments, source: :user

  validates :name, presence: true
end
