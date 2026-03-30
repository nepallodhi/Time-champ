class Alert < ApplicationRecord
  belongs_to :user

  validates :alert_type, presence: true
  validates :message, presence: true
end
