class Api::V1::ScreenshotsController < ApplicationController
  include Authenticatable

  def create
    # Get session_id from route params (when nested under sessions) or request body
    session_id = params[:session_id] || params.dig(:screenshot, :session_id)
    session = current_user.work_sessions.find(session_id)

    unless session.status == "active"
      return render json: { error: "Cannot capture screenshot for a stopped session" }, status: :forbidden
    end

    screenshot = Screenshot.new(
      session_id: session.id,
      user_id: current_user.id,
      timestamp: params[:timestamp] || Time.current
    )

    if screenshot.save
      render json: { status: "success", screenshot: { id: screenshot.id, timestamp: screenshot.timestamp } }, status: :created
    else
      render json: { errors: screenshot.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def index
    # List screenshots for the current user
    screenshots = current_user.screenshots
                              .includes(:session)
                              .order(timestamp: :desc)

    # Filter by date if provided
    if params[:date].present?
      date = Date.parse(params[:date])
      screenshots = screenshots.where(timestamp: date.all_day)
    end

    # Filter by session_id if provided
    screenshots = screenshots.where(session_id: params[:session_id]) if params[:session_id].present?

    render json: {
      screenshots: screenshots.map do |s|
        {
          id: s.id,
          session_id: s.session_id,
          user_id: s.user_id,
          timestamp: s.timestamp,
          created_at: s.created_at,
          file_path: s.file_path,
          image_url: s.file_path.present? ? "/api/v1/screenshots/#{s.id}/image" : nil
        }
      end
    }, status: :ok
  end

  def show
     # screenshot = current_user.screenshots.find(params[:id])
     screenshot = Screenshot.find(params[:id])
    render json: {
      screenshot: {
        id: screenshot.id,
        session_id: screenshot.session_id,
        user_id: screenshot.user_id,
        timestamp: screenshot.timestamp,
        created_at: screenshot.created_at,
        file_path: screenshot.file_path,
        image_url: screenshot.file_path.present? ? "/api/v1/screenshots/#{screenshot.id}/image" : nil
      }
    }, status: :ok
  end

  def image
     # screenshot = current_user.screenshots.find(params[:id])
     screenshot = Screenshot.find(params[:id])
    unless screenshot.file_path.present?
      return render json: { error: "Screenshot file not found" }, status: :not_found
    end

    # Handle both absolute paths and relative paths
    file_path = if screenshot.file_path.start_with?("/")
      screenshot.file_path
    else
      Rails.root.join(screenshot.file_path).to_s
    end

    unless File.exist?(file_path)
      return render json: { error: "Screenshot file does not exist" }, status: :not_found
    end

    # Send the image file
    send_file file_path,
      type: "image/png",
      disposition: "inline",
      filename: File.basename(file_path)
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Screenshot not found" }, status: :not_found
  rescue StandardError => e
    Rails.logger.error "Error serving screenshot: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    render json: { error: "Failed to serve screenshot" }, status: :internal_server_error
  end
end
