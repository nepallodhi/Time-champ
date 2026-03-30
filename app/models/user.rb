class User < ApplicationRecord
  has_secure_password

  belongs_to :organization
  belongs_to :manager, class_name: "User", optional: true
  has_many :team_members, class_name: "User", foreign_key: "manager_id", dependent: :nullify
  
  has_many :work_sessions, dependent: :destroy
  has_many :daily_summaries, dependent: :destroy
  has_many :attendance_records, dependent: :destroy
  has_many :alerts, dependent: :destroy
  has_many :qualifications, dependent: :destroy
  has_many :leaves, class_name: "Leave", dependent: :destroy
  has_many :payrolls, dependent: :destroy
  has_many :screenshots, dependent: :destroy
  has_many :project_assignments, dependent: :destroy
  has_many :assigned_projects, through: :project_assignments, source: :project

  validates :email, presence: true, uniqueness: { scope: :organization_id }
  validates :name, presence: true
  validates :role, inclusion: { in: %w[admin manager employee] }

  enum :status, { offline: "offline", online: "online", idle: "idle" }, default: "offline"

  # Broadcast status changes via ActionCable
  after_commit :broadcast_status_change, if: :saved_change_to_status?

  private

  def broadcast_status_change
    ActionCable.server.broadcast(
      "organization_#{organization_id}",
      {
        type: "USER_#{status.upcase}",
        user_id: id,
        user_name: name
      }
    )
  end
end
