class Screenshot < ApplicationRecord
  belongs_to :session, class_name: "WorkSession", foreign_key: "session_id"
  belongs_to :user

  validates :session_id, :user_id, :timestamp, presence: true

  # Generate the full image URL for this screenshot
  # Uses ENV variable or defaults to localhost for development
  def image_url
    return nil unless file_path.present?
    base_url = ENV.fetch("API_BASE_URL", "http://localhost:3000")
    "#{base_url}/api/v1/screenshots/#{id}/image"
  end
end
