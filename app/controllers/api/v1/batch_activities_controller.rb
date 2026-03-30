require "base64"
require "securerandom"

class Api::V1::BatchActivitiesController < ApplicationController
  include Authenticatable

  # GET /api/v1/sessions/:id/batch_activity
  def show
    # Find the session for current user
    session = current_user.work_sessions.find_by(id: params[:id])

    unless session
      return render json: { error: "Session not found" }, status: :not_found
    end

    # Get optional date filter
    date_filter = if params[:date].present?
      begin
        Date.parse(params[:date])
      rescue ArgumentError
        return render json: { error: "Invalid date format. Use YYYY-MM-DD" }, status: :bad_request
      end
    end

    # Get activity minutes for this session
    activity_minutes_query = session.activity_minutes.order(:minute_timestamp)

    if date_filter
      activity_minutes_query = activity_minutes_query.where(
        "minute_timestamp >= ? AND minute_timestamp < ?",
        date_filter.beginning_of_day,
        date_filter.end_of_day
      )
    end

    activity_minutes = activity_minutes_query

    # Get screenshots for this session
    screenshots_query = session.screenshots.order(:timestamp)

    if date_filter
      screenshots_query = screenshots_query.where(
        "timestamp >= ? AND timestamp < ?",
        date_filter.beginning_of_day,
        date_filter.end_of_day
      )
    end

    screenshots = screenshots_query

    # Format as aggregatedData (same format as POST request)
    aggregated_data = activity_minutes.map do |minute|
      {
        id: minute.id,
        fullTimestamp: minute.minute_timestamp.iso8601,
        activeSeconds: minute.active_seconds || 0,
        idleSeconds: minute.idle_seconds || 0,
        keyboardEvents: minute.keyboard_events || 0,
        mouseEvents: minute.mouse_events || 0,
        activeWindowTitle: minute.active_window_title,
        windowTitles: minute.window_titles || {},
        projectId: minute.project_id,
        taskId: minute.task_id,
        projectName: minute.project_name,
        taskName: minute.task_name,
        activeUrl: minute.active_url,
        status: minute.status || "Active",
        screenshotPath: minute.screenshot_path
      }
    end

    # Format screenshots
    screenshots_data = screenshots.map do |screenshot|
      {
        id: screenshot.id,
        timestamp: screenshot.timestamp.iso8601,
        sessionId: screenshot.session_id,
        userId: screenshot.user_id,
        filePath: screenshot.file_path,
        imageUrl: screenshot.image_url
      }
    end

    # Calculate summary totals
    summary = {
      userId: session.user.email,
      totalActiveSeconds: session.total_active_seconds || 0,
      totalIdleSeconds: session.total_idle_seconds || 0,
      totalKeyboardEvents: session.total_keyboard_events || 0,
      totalMouseEvents: session.total_mouse_events || 0,
      screenshots: screenshots_data
    }

    # Calculate hourly activity aggregation
    hourly_activity_map = {}

    activity_minutes.each do |minute|
      # Group by hour (format "HH:00")
      hour_key = minute.minute_timestamp.strftime("%H:00")

      hourly_activity_map[hour_key] ||= {
        active_seconds: 0,
        idle_seconds: 0,
        window_titles: {}
      }

      hourly_activity_map[hour_key][:active_seconds] += (minute.active_seconds || 0)
      hourly_activity_map[hour_key][:idle_seconds] += (minute.idle_seconds || 0)

      # Aggregate window titles for finding top app
      minute_titles = minute.window_titles || {}
      minute_titles.each do |title, duration|
        hourly_activity_map[hour_key][:window_titles][title] ||= 0
        hourly_activity_map[hour_key][:window_titles][title] += duration.to_i
      end
    end

    # Format hourly activity array
    hourly_activity = hourly_activity_map.map do |hour, data|
      total_seconds = data[:active_seconds] + data[:idle_seconds]
      productivity_percentage = total_seconds > 0 ? ((data[:active_seconds].to_f / total_seconds) * 100).round(1) : 0.0

      # Find top app (most time spent)
      top_app = data[:window_titles].max_by { |_, duration| duration }&.first || "Unknown"

      {
        hour: hour,
        activeSeconds: data[:active_seconds],
        idleSeconds: data[:idle_seconds],
        productivity_percentage: productivity_percentage,
        topApp: top_app
      }
    end.sort_by { |h| h[:hour] }

    render json: {
      sessionId: session.id,
      timestamp: session.last_activity_at&.iso8601 || session.start_time.iso8601,
      totalMinutes: aggregated_data.size,
      aggregatedData: aggregated_data,
      hourlyActivity: hourly_activity,
      summary: summary
    }
  end

  # POST /api/v1/sessions/:id/batch_activity
  def create
    # Get session ID from route params or payload
    session_id = params[:id] || params[:sessionId] || params[:batch]&.dig(:sessionId)

    # Find the active session for current user
    session = if session_id.present?
      # Try to find by ID (handle both string and integer)
      current_user.work_sessions.find_by(id: session_id.to_i)
    else
      # Fallback: get current active session
      current_user.work_sessions.active.first
    end

    unless session&.status == "active"
      return render json: { error: "Cannot log activity for a stopped session" }, status: :forbidden
    end

    # Parse batch payload - handle both nested and flat structures
    batch_data = if params[:batch].present?
      params[:batch]
    elsif params[:aggregatedData].present?
      params
    else
      params
    end

    # Handle different payload structures:
    # 1. aggregatedData array (preferred)
    # 2. items array (alternative format)
    # 3. Empty array if neither is present (will only update summary)
    aggregated_data = batch_data[:aggregatedData] || batch_data["aggregatedData"] ||
                      batch_data[:items] || batch_data["items"] || []
    summary = batch_data[:summary] || batch_data["summary"] || {}

    begin
    ActiveRecord::Base.transaction do
      # Group aggregated data by 5-minute intervals
      grouped_by_interval = aggregated_data.group_by do |minute_data|
        # Handle both symbol and string keys
        data = minute_data.is_a?(Hash) ? minute_data.with_indifferent_access : minute_data

        minute_timestamp = parse_timestamp(data[:fullTimestamp] || data["fullTimestamp"] || data[:minute] || data["minute"])

        # Round down to nearest 5-minute interval (300 seconds)
        # This creates intervals: 00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
        Time.at((minute_timestamp.to_i / 300) * 300).utc
      end

      # Process each 5-minute interval
      grouped_by_interval.each do |interval_start, minutes|
        # Find or create activity minute record for this 5-minute interval
        activity_minute = session.activity_minutes.find_or_initialize_by(
          minute_timestamp: interval_start
        )

        # Aggregate metrics by summing all minutes in this interval
        total_active = minutes.sum do |m|
          data = m.is_a?(Hash) ? m.with_indifferent_access : m
          data[:activeSeconds] || data["activeSeconds"] || 0
        end

        total_idle = minutes.sum do |m|
          data = m.is_a?(Hash) ? m.with_indifferent_access : m
          data[:idleSeconds] || data["idleSeconds"] || 0
        end

        total_keyboard = minutes.sum do |m|
          data = m.is_a?(Hash) ? m.with_indifferent_access : m
          data[:keyboardEvents] || data["keyboardEvents"] || 0
        end

        total_mouse = minutes.sum do |m|
          data = m.is_a?(Hash) ? m.with_indifferent_access : m
          data[:mouseEvents] || data["mouseEvents"] || 0
        end

        # Merge window titles from all minutes
        all_window_titles = {}
        minutes.each do |m|
          data = m.is_a?(Hash) ? m.with_indifferent_access : m
          window_titles = data[:windowTitles] || data["windowTitles"] || {}
          window_titles.each do |title, seconds|
            all_window_titles[title] = (all_window_titles[title] || 0) + seconds.to_i
          end
        end

        # Use the last minute's values for string fields
        last_minute = minutes.last
        last_data = last_minute.is_a?(Hash) ? last_minute.with_indifferent_access : last_minute

        # Update or set the aggregated values
        activity_minute.assign_attributes(
          active_seconds: (activity_minute.active_seconds || 0) + total_active,
          idle_seconds: (activity_minute.idle_seconds || 0) + total_idle,
          keyboard_events: (activity_minute.keyboard_events || 0) + total_keyboard,
          mouse_events: (activity_minute.mouse_events || 0) + total_mouse,
          active_window_title: last_data[:activeWindowTitle] || last_data["activeWindowTitle"],
          project_id: last_data[:projectId] || last_data["projectId"],
          task_id: last_data[:taskId] || last_data["taskId"],
          project_name: last_data[:projectName] || last_data["projectName"],
          task_name: last_data[:taskName] || last_data["taskName"],
          window_titles: all_window_titles,
          active_url: last_data[:activeUrl] || last_data["activeUrl"],
          status: last_data[:status] || last_data["status"] || "Active",
          screenshot_path: last_data[:screenshotPath] || last_data["screenshotPath"]
        )

        activity_minute.save!

        # Process screenshot if present in the last minute's data
        screenshot_data = last_data[:screenshot] || last_data["screenshot"]
        if screenshot_data.present?
          save_base64_screenshot(session, screenshot_data, interval_start)
        end
      end

        # Update work_session totals from summary (cumulative)
        if summary.present?
          summary_data = summary.is_a?(Hash) ? summary.with_indifferent_access : summary

          # Add new batch totals to existing session totals
          batch_active = (summary_data[:totalActiveSeconds] || summary_data["totalActiveSeconds"] || 0).to_i
          batch_idle = (summary_data[:totalIdleSeconds] || summary_data["totalIdleSeconds"] || 0).to_i

          session.total_active_seconds = (session.total_active_seconds || 0) + batch_active
          session.total_idle_seconds = (session.total_idle_seconds || 0) + batch_idle

          # Add keyboard/mouse events if present in summary
          batch_keyboard = (summary_data[:totalKeyboardEvents] || summary_data["totalKeyboardEvents"] || 0).to_i
          batch_mouse = (summary_data[:totalMouseEvents] || summary_data["totalMouseEvents"] || 0).to_i

          session.total_keyboard_events = (session.total_keyboard_events || 0) + batch_keyboard
          session.total_mouse_events = (session.total_mouse_events || 0) + batch_mouse

          # Update last activity timestamp and end_time
          session.last_activity_at = parse_timestamp(batch_data[:timestamp] || batch_data["timestamp"]) || Time.current
          session.end_time = session.last_activity_at
          session.save!
        end

        # Handle screenshots from summary or top-level screenshots parameter
        screenshots_data = nil
        if summary.present?
          summary_data = summary.is_a?(Hash) ? summary.with_indifferent_access : summary
          screenshots_data = summary_data[:screenshots] || summary_data["screenshots"]
        end

        # Also check for top-level screenshots parameter
        if screenshots_data.blank?
          screenshots_data = batch_data[:screenshots] || batch_data["screenshots"]
        end

        if screenshots_data.present?
          process_screenshots(session, screenshots_data, batch_data, aggregated_data)
        end

        # Also create/update activity_logs for backward compatibility
        # Aggregate minute data into activity_logs format
        update_activity_logs(session, aggregated_data)
      end

      # Reload session to get updated totals and screenshots
      session.reload

      # Get recently created screenshots for this batch
      recent_screenshots = session.screenshots
        .where("created_at >= ?", 5.minutes.ago)
        .order(:timestamp)
        .map do |screenshot|
          {
            id: screenshot.id,
            timestamp: screenshot.timestamp.iso8601,
            sessionId: screenshot.session_id,
            userId: screenshot.user_id,
            filePath: screenshot.file_path,
            imageUrl: screenshot.image_url
          }
        end

      render json: {
        status: "success",
        message: "Batch activity data saved",
        minutes_saved: (batch_data[:totalMinutes] || batch_data["totalMinutes"] || aggregated_data.size).to_i,
        session_id: session.id,
        screenshots_saved: recent_screenshots.size,
        session: {
          id: session.id,
          user_id: session.user_id,
          start_time: session.start_time,
          end_time: session.end_time,
          last_activity_at: session.last_activity_at,
          total_active_seconds: session.total_active_seconds,
          total_idle_seconds: session.total_idle_seconds,
          total_keyboard_events: session.total_keyboard_events || 0,
          total_mouse_events: session.total_mouse_events || 0,
          status: session.status
        },
        screenshots: recent_screenshots
      }, status: :created

    rescue ActiveRecord::RecordInvalid => e
      render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
    rescue StandardError => e
      Rails.logger.error "Error saving batch activity: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      render json: { error: "Failed to save batch activity: #{e.message}" }, status: :internal_server_error
    end
  end

  private

  def parse_timestamp(timestamp_string)
    return Time.current if timestamp_string.blank?

    # Try parsing ISO 8601 format
    Time.parse(timestamp_string.to_s)
  rescue ArgumentError
    # Fallback to current time if parsing fails
    Time.current
  end

  def process_screenshots(session, screenshots_data, batch_data, aggregated_data = [])
    # screenshots_data can be:
    # 1. An array of screenshot references ["ss1", "ss2"]
    # 2. An array of objects with screenshot data [{ id: "ss1", timestamp: "...", path: "..." }]
    # 3. A hash mapping screenshot IDs to data { "ss1": { timestamp: "...", path: "..." } }

    screenshots_array = if screenshots_data.is_a?(Array)
      screenshots_data
    elsif screenshots_data.is_a?(Hash)
      screenshots_data.map { |key, value|
        if value.is_a?(Hash)
          value.merge(id: key)
        else
          { id: key, reference: value }
        end
      }
    else
      []
    end

    batch_timestamp = parse_timestamp(batch_data[:timestamp] || batch_data["timestamp"])

    # Get timestamps from aggregated data to match screenshots
    minute_timestamps = aggregated_data.map do |minute_data|
      data = minute_data.is_a?(Hash) ? minute_data.with_indifferent_access : minute_data
      parse_timestamp(data[:fullTimestamp] || data["fullTimestamp"] || data[:minute] || data["minute"])
    end.compact.sort

    screenshots_array.each_with_index do |screenshot_ref, index|
      screenshot_data = screenshot_ref.is_a?(Hash) ? screenshot_ref.with_indifferent_access : { id: screenshot_ref }

      # Determine timestamp for screenshot
      screenshot_timestamp = if screenshot_data[:timestamp] || screenshot_data["timestamp"]
        parse_timestamp(screenshot_data[:timestamp] || screenshot_data["timestamp"])
      elsif screenshot_data[:fullTimestamp] || screenshot_data["fullTimestamp"]
        parse_timestamp(screenshot_data[:fullTimestamp] || screenshot_data["fullTimestamp"])
      elsif minute_timestamps.any?
        # Use timestamp from corresponding minute, or distribute evenly
        minute_timestamps[index] || minute_timestamps.last
      else
        # Fallback to batch timestamp
        batch_timestamp
      end

      # Check if screenshot already exists for this timestamp (within 1 minute window)
      existing_screenshot = session.screenshots.where(
        "timestamp >= ? AND timestamp <= ?",
        screenshot_timestamp - 1.minute,
        screenshot_timestamp + 1.minute
      ).first

      if existing_screenshot
        Rails.logger.debug "Screenshot already exists at #{screenshot_timestamp} for session #{session.id}"
        next
      end

      # Create new screenshot record
      screenshot = session.screenshots.create!(
        user_id: current_user.id,
        timestamp: screenshot_timestamp
      )

      Rails.logger.info "Created screenshot #{screenshot.id} for session #{session.id} at #{screenshot_timestamp}"
    end
  rescue StandardError => e
    Rails.logger.error "Error processing screenshots: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    # Don't fail the entire batch if screenshot processing fails
  end

  def save_base64_screenshot(session, base64_data, timestamp)
    # base64_data can be:
    # - "data:image/png;base64,iVBORw0KGgo..."
    # - Just the base64 string without data URI prefix

    begin
      # Extract base64 string (remove data URI prefix if present)
      base64_string = if base64_data.start_with?("data:")
        # Extract the base64 part after the comma
        base64_data.split(",").last
      else
        base64_data
      end

      # Decode base64 to binary
      image_data = Base64.decode64(base64_string)

      # Create screenshots directory if it doesn't exist
      screenshots_dir = Rails.root.join("storage", "screenshots", session.id.to_s)
      FileUtils.mkdir_p(screenshots_dir)

      # Generate filename with timestamp
      filename = "screenshot_#{timestamp.to_i}_#{SecureRandom.hex(8)}.png"
      file_path = screenshots_dir.join(filename)

      # Write file
      File.binwrite(file_path, image_data)

      # Check if screenshot already exists for this timestamp (within 1 minute window)
      existing_screenshot = session.screenshots.where(
        "timestamp >= ? AND timestamp <= ?",
        timestamp - 1.minute,
        timestamp + 1.minute
      ).first

      if existing_screenshot
        # Update existing screenshot with file path if it doesn't have one
        if existing_screenshot.file_path.blank?
          existing_screenshot.update!(file_path: file_path.to_s)
        end
        Rails.logger.debug "Updated screenshot #{existing_screenshot.id} with file path"
      else
        # Create new screenshot record
        screenshot = session.screenshots.create!(
          user_id: current_user.id,
          timestamp: timestamp,
          file_path: file_path.to_s
        )
        Rails.logger.info "Saved screenshot #{screenshot.id} to #{file_path}"
      end
    rescue StandardError => e
      Rails.logger.error "Error saving base64 screenshot: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      # Don't fail the entire batch if screenshot saving fails
    end
  end

  def update_activity_logs(session, aggregated_data)
    # Group minutes by hour and create activity_logs entries
    # This maintains backward compatibility with existing activity_logs queries
    aggregated_data.group_by do |minute_data|
      data = minute_data.is_a?(Hash) ? minute_data.with_indifferent_access : minute_data
      timestamp = parse_timestamp(data[:fullTimestamp] || data["fullTimestamp"] || data[:minute] || data["minute"])
      timestamp.beginning_of_hour
    end.each do |hour_start, minutes|
      # Calculate totals for this hour
      total_active = minutes.sum do |m|
        data = m.is_a?(Hash) ? m.with_indifferent_access : m
        data[:activeSeconds] || data["activeSeconds"] || 0
      end
      total_idle = minutes.sum do |m|
        data = m.is_a?(Hash) ? m.with_indifferent_access : m
        data[:idleSeconds] || data["idleSeconds"] || 0
      end

      # Get most common app/window for this hour
      window_titles = minutes.map do |m|
        data = m.is_a?(Hash) ? m.with_indifferent_access : m
        data[:activeWindowTitle] || data["activeWindowTitle"]
      end.compact

      most_common_window = window_titles.max_by { |w| window_titles.count(w) } if window_titles.any?

      # Get first minute's URL
      first_minute = minutes.first
      first_data = first_minute.is_a?(Hash) ? first_minute.with_indifferent_access : first_minute
      active_url = first_data[:activeUrl] || first_data["activeUrl"]

      # Create or update activity_log for this hour
      # Use find_or_create_by to avoid duplicates
      activity_log = session.activity_logs.find_or_initialize_by(
        timestamp: hour_start
      )

      if activity_log.new_record?
        # New log - set initial values
        activity_log.assign_attributes(
          activity_type: total_active > total_idle ? "active" : "idle",
          duration_seconds: total_active + total_idle,
          app_name: most_common_window,
          url: active_url
        )
        activity_log.save!
      else
        # Update existing log - add to existing totals
        activity_log.duration_seconds = (activity_log.duration_seconds || 0) + (total_active + total_idle)
        if total_active > total_idle
          activity_log.activity_type = "active"
        end
        activity_log.app_name = most_common_window if most_common_window.present?
        activity_log.save!
      end
    end
  end
end
