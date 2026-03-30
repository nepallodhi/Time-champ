class Api::V1::UsersController < ApplicationController
  include Authenticatable
  before_action :set_user, only: [ :show, :update, :destroy, :activity_minutes, :screenshots, :batch_activity ]
  before_action :authorize_admin_only, only: [ :destroy ]

  def index
    users = if current_user.role == "employee"
      # Employees can see their manager and team members (other employees with same manager)
      visible_user_ids = [ current_user.id ]

      # Add manager if exists
      if current_user.manager_id.present?
        visible_user_ids << current_user.manager_id
      end

      # Add team members (other employees with same manager_id)
      team_member_ids = current_user.organization.users
        .where(role: "employee", manager_id: current_user.manager_id)
        .where.not(id: current_user.id)
        .pluck(:id)

      visible_user_ids.concat(team_member_ids)

      current_user.organization.users.where(id: visible_user_ids).order(:name)
    elsif current_user.role == "manager"
      # Managers can only see employees that belong to them
      # If manager_id parameter is provided, it must match the current manager's ID
      if params[:manager_id].present?
        manager_id = params[:manager_id].to_i
        # Ensure manager can only see employees under their own manager_id
        unless manager_id == current_user.id
          return render json: { error: "You can only view employees under your own management" }, status: :forbidden
        end
        users_query = current_user.organization.users.where(manager_id: manager_id, role: "employee")
      else
        # If no manager_id provided, show employees under this manager
        users_query = current_user.organization.users.where(manager_id: current_user.id, role: "employee")
      end

      users_query.order(:name)
    else
      # Admins can see all users and filter by any manager_id
      users_query = current_user.organization.users

      # Filter by manager_id if provided
      if params[:manager_id].present?
        manager_id = params[:manager_id].to_i
        users_query = users_query.where(manager_id: manager_id)
      end

      users_query.order(:name)
    end

    render json: users.map { |u| user_response(u) }
  end

  def show
    # Employees can only view themselves, their manager, or team members
    if current_user.role == "employee"
      unless @user.id == current_user.id ||
             @user.id == current_user.manager_id ||
             (@user.role == "employee" && @user.manager_id == current_user.manager_id)
        return render json: { error: "Unauthorized" }, status: :forbidden
      end
    end

    # If date parameter is provided and user is manager/admin, return detailed activity
    if params[:date].present? && (current_user.role == "manager" || current_user.role == "admin")
      # Managers can only view their team members, admins can view anyone
      if current_user.role == "manager"
        unless @user.manager_id == current_user.id
          return render json: { error: "You can only view activity for employees in your team" }, status: :forbidden
        end
      end

      return render_user_activity(@user, params[:date])
    end

    render json: user_response(@user)
  end

  # GET /api/v1/users/:id/activity_minutes?date=2026-02-16
  def activity_minutes
    # Only admins and managers can access
    unless current_user.role == "admin" || current_user.role == "manager"
      return render json: { error: "Unauthorized" }, status: :forbidden
    end

    # Managers can only view their team members
    if current_user.role == "manager"
      unless @user.manager_id == current_user.id
        return render json: { error: "You can only view activity for employees in your team" }, status: :forbidden
      end
    end

    # Parse date parameter
    begin
      date = params[:date].present? ? Date.parse(params[:date]) : Date.today
    rescue ArgumentError
      return render json: { error: "Invalid date format. Use YYYY-MM-DD" }, status: :bad_request
    end

    # Get work sessions for the date
    sessions = @user.work_sessions.where(start_time: date.all_day)
    session_ids = sessions.pluck(:id)

    # Get activity minutes for the date
    activity_minutes = ActivityMinute.where(work_session_id: session_ids)
                                     .where("minute_timestamp >= ? AND minute_timestamp < ?",
                                            date.beginning_of_day, date.end_of_day)
                                     .order(:minute_timestamp)

    # Format response
    minutes_data = activity_minutes.map do |minute|
      {
        id: minute.id,
        minute_timestamp: minute.minute_timestamp.iso8601,
        active_seconds: minute.active_seconds || 0,
        idle_seconds: minute.idle_seconds || 0,
        keyboard_events: minute.keyboard_events || 0,
        mouse_events: minute.mouse_events || 0,
        active_window_title: minute.active_window_title,
        project_id: minute.project_id,
        task_id: minute.task_id,
        project_name: minute.project_name,
        task_name: minute.task_name,
        window_titles: minute.window_titles || {},
        active_url: minute.active_url,
        status: minute.status,
        screenshot_path: minute.screenshot_path,
        session_id: minute.work_session_id
      }
    end

    # Calculate totals
    totals = {
      total_active_seconds: activity_minutes.sum(:active_seconds) || 0,
      total_idle_seconds: activity_minutes.sum(:idle_seconds) || 0,
      total_keyboard_events: activity_minutes.sum(:keyboard_events) || 0,
      total_mouse_events: activity_minutes.sum(:mouse_events) || 0
    }

    render json: {
      user: {
        id: @user.id,
        name: @user.name,
        email: @user.email
      },
      date: date.to_s,
      activity_minutes: minutes_data,
      totals: totals,
      count: minutes_data.size
    }
  end

  # GET /api/v1/users/:id/screenshots?date=2026-02-16&session_id=123
  def screenshots
    # Only admins and managers can access
    unless current_user.role == "admin" || current_user.role == "manager"
      return render json: { error: "Unauthorized" }, status: :forbidden
    end

    # Managers can only view their team members
    if current_user.role == "manager"
      unless @user.manager_id == current_user.id
        return render json: { error: "You can only view screenshots for employees in your team" }, status: :forbidden
      end
    end

    # Parse date parameter (optional)
    date = if params[:date].present?
      begin
        Date.parse(params[:date])
      rescue ArgumentError
        return render json: { error: "Invalid date format. Use YYYY-MM-DD" }, status: :bad_request
      end
    else
      nil
    end

    # Get screenshots
    screenshots_query = @user.screenshots.includes(:session)

    # Filter by date if provided
    if date
      screenshots_query = screenshots_query.where(
        "timestamp >= ? AND timestamp < ?",
        date.beginning_of_day,
        date.end_of_day
      )
    end

    # Filter by session_id if provided
    if params[:session_id].present?
      screenshots_query = screenshots_query.where(session_id: params[:session_id])
    end

    screenshots = screenshots_query.order(timestamp: :desc)

    # Format response
    screenshots_data = screenshots.map do |screenshot|
      {
        id: screenshot.id,
        session_id: screenshot.session_id,
        user_id: screenshot.user_id,
        timestamp: screenshot.timestamp.iso8601,
        created_at: screenshot.created_at.iso8601,
        session: {
          id: screenshot.session.id,
          start_time: screenshot.session.start_time.iso8601,
          status: screenshot.session.status
        }
      }
    end

    render json: {
      user: {
        id: @user.id,
        name: @user.name,
        email: @user.email
      },
      date: date&.to_s,
      screenshots: screenshots_data,
      count: screenshots_data.size
    }
  end

  # GET /api/v1/users/:id/batch_activity?date=2026-02-16&session_id=123
  def batch_activity
    # Only admins and managers can access
    unless current_user.role == "admin" || current_user.role == "manager"
      return render json: { error: "Unauthorized" }, status: :forbidden
    end

    # Managers can only view their team members
    if current_user.role == "manager"
      unless @user.manager_id == current_user.id
        return render json: { error: "You can only view activity for employees in your team" }, status: :forbidden
      end
    end

    # Parse date parameter (optional)
    date = if params[:date].present?
      begin
        Date.parse(params[:date])
      rescue ArgumentError
        return render json: { error: "Invalid date format. Use YYYY-MM-DD" }, status: :bad_request
      end
    else
      nil
    end

    # Get work sessions query
    sessions_query = @user.work_sessions

    # Filter sessions by date if provided
    if date
      sessions_query = sessions_query.where(
        "start_time >= ? AND start_time < ?",
        date.beginning_of_day,
        date.end_of_day + 1.day
      )
    end

    # Filter by specific session_id if provided
    if params[:session_id].present?
      sessions_query = sessions_query.where(id: params[:session_id])
    end

    sessions = sessions_query.order(:start_time)

    if sessions.empty?
      return render json: {
        userId: @user.id,
        date: date&.to_s,
        totalMinutes: 0,
        aggregatedData: [],
        summary: {
          userId: @user.id,
          totalActiveSeconds: 0,
          totalIdleSeconds: 0,
          totalKeyboardEvents: 0,
          totalMouseEvents: 0,
          productivity_percentage: 0.0,
          screenshots: []
        }
      }
    end

    session_ids = sessions.pluck(:id)

    # Get activity minutes
    activity_minutes_query = ActivityMinute.where(work_session_id: session_ids)

    if date
      activity_minutes_query = activity_minutes_query.where(
        "minute_timestamp >= ? AND minute_timestamp < ?",
        date.beginning_of_day,
        date.end_of_day
      )
    end

    activity_minutes = activity_minutes_query.order(:minute_timestamp)

    # Get screenshots
    screenshots_query = Screenshot.where(session_id: session_ids)

    if date
      screenshots_query = screenshots_query.where(
        "timestamp >= ? AND timestamp < ?",
        date.beginning_of_day,
        date.end_of_day
      )
    end

    screenshots = screenshots_query.order(:timestamp)

    # Format all activity minutes (aggregating across all sessions)
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

    # Format all screenshots (aggregating across all sessions)
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

    # Calculate totals across all sessions
    total_active_seconds = sessions.sum(:total_active_seconds) || 0
    total_idle_seconds = sessions.sum(:total_idle_seconds) || 0
    total_keyboard_events = sessions.sum(:total_keyboard_events) || 0
    total_mouse_events = sessions.sum(:total_mouse_events) || 0

    # Calculate productivity percentage
    total_time = total_active_seconds + total_idle_seconds
    productivity_percentage = if total_time > 0
      ((total_active_seconds.to_f / total_time) * 100).round(2)
    else
      0.0
    end

    # Create summary matching POST API format
    summary = {
      userId: @user.id,
      totalActiveSeconds: total_active_seconds,
      totalIdleSeconds: total_idle_seconds,
      totalKeyboardEvents: total_keyboard_events,
      totalMouseEvents: total_mouse_events,
      productivity_percentage: productivity_percentage,
      screenshots: screenshots_data
    }

    # Get the most recent timestamp from all sessions
    latest_timestamp = sessions.maximum(:last_activity_at) || sessions.maximum(:start_time)

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

    # Return flattened response matching POST API format
    render json: {
      userId: @user.id,
      date: date&.to_s,
      timestamp: latest_timestamp&.iso8601,
      totalMinutes: aggregated_data.size,
      aggregatedData: aggregated_data,
      hourlyActivity: hourly_activity,
      summary: summary
    }
  end

  def create
    # Determine organization - use provided org_id if admin, otherwise use current user's org
    organization = if params[:organisation_id].present? || params[:organization_id].present?
      org_id_str = (params[:organisation_id] || params[:organization_id]).to_s
      # Extract numeric part if it has "org-" prefix
      org_id = if org_id_str.start_with?("org-")
        org_id_str.gsub(/^org-/, "").to_i
      else
        org_id_str.to_i
      end

      if current_user.role == "admin" && org_id > 0
        Organization.find_by(id: org_id) || current_user.organization
      else
        current_user.organization
      end
    else
      current_user.organization
    end

    user_params = user_create_params

    # Debug: Log received params (remove in production)
    Rails.logger.debug "User create params: #{user_params.inspect}"
    Rails.logger.debug "Password present: #{user_params[:password].present?}"

    # Ensure password is present (has_secure_password requirement)
    unless user_params[:password].present?
      return render json: { errors: [ "Password can't be blank" ] }, status: :unprocessable_entity
    end

    user = organization.users.new(user_params)
    user.organization_id = organization.id

    if user.save
      render json: user_response(user), status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    # Only admins can change roles, users can update their own name
    if params[:user][:role].present? && current_user.role != "admin"
      return render json: { error: "Only admins can change user roles" }, status: :forbidden
    end

    # Users can only update themselves unless they're admin/manager
    unless current_user.id == @user.id || current_user.role.in?([ "admin", "manager" ])
      return render json: { error: "Unauthorized" }, status: :forbidden
    end

    if @user.update(user_update_params)
      render json: user_response(@user)
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    # Allow non-owner admins to delete themselves
    if @user.id == current_user.id
      # Only non-owner admins can delete themselves
      if current_user.role == "admin" && current_user.is_owner == false
        # Allow deletion to proceed (skip the self-deletion check)
      else
        return render json: { error: "You cannot delete your own account" }, status: :forbidden
      end
    end

    # Prevent deleting organization owner (regardless of role - admin, manager, or employee)
    # is_owner is a boolean field, so check for true explicitly
    if @user.is_owner == true
      return render json: { error: "Cannot delete organization owner. The owner account is protected." }, status: :forbidden
    end

    # Only admins can delete users (employees and managers)
    unless current_user.role == "admin"
      return render json: { error: "Only admins can delete users" }, status: :forbidden
    end

    # Special rule: If deleting an admin, only an owner admin can delete a non-owner admin
    # Exception: Non-owner admins can delete themselves
    if @user.role == "admin"
      # Allow non-owner admins to delete themselves
      if @user.id == current_user.id && current_user.is_owner == false
        # Allow self-deletion for non-owner admins (skip the owner check)
      else
        # The user being deleted must not be an owner (already checked above)
        # The current_user (deleter) must be an owner
        unless current_user.is_owner == true
          return render json: { error: "Only organization owners can delete other admins" }, status: :forbidden
        end
      end
    end

    # Admins can delete both employees and managers
    # When a manager is deleted, their team members' manager_id will be set to null (via dependent: :nullify)
    if @user.destroy
      render json: {
        message: "User deleted successfully",
        deleted_user: {
          id: @user.id,
          name: @user.name,
          role: @user.role
        }
      }, status: :ok
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_user
    @user = current_user.organization.users.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: "User not found" }, status: :not_found
  end

  def authorize_admin_only
    unless current_user.role == "admin"
      render json: { error: "Only admins can perform this action" }, status: :forbidden
    end
  end

  def user_create_params
    permitted = [ :name, :email, :password, :role, :manager_id, :functional_unit, :is_owner ]
    # Accept unwrapped params directly (no :user wrapper required)
    params.permit(*permitted)
  end

  def user_update_params
    permitted = [ :name, :status, :functional_unit ]
    # Allow password change for own account or by admin/manager
    if params[:user][:password].present? && (current_user.id == @user.id || current_user.role.in?([ "admin", "manager" ]))
      permitted << :password
    end
    permitted << :role if current_user.role == "admin"
    permitted << :manager_id if current_user.role.in?([ "admin", "manager" ])
    permitted << :is_owner if current_user.role == "admin"
    params.require(:user).permit(*permitted)
  end

  def user_response(user)
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      last_seen: user.last_seen,
      organization_id: user.organization_id,
      manager_id: user.manager_id,
      functional_unit: user.functional_unit,
      is_owner: user.is_owner,
      created_at: user.created_at
    }
  end

  def render_user_activity(user, date_string)
    begin
      date = Date.parse(date_string)
    rescue ArgumentError
      return render json: { error: "Invalid date format. Use YYYY-MM-DD" }, status: :bad_request
    end

    # Get work sessions for the date
    sessions = user.work_sessions.where(start_time: date.all_day).includes(:activity_logs, :project)

    # Calculate active and idle time directly from sessions (most accurate for active sessions)
    # We prioritize session totals because DailySummary might be stale for active sessions
    active_seconds = sessions.sum(:total_active_seconds) || 0
    idle_seconds = sessions.sum(:total_idle_seconds) || 0

    # Calculate productivity (based on 8 hours per day = 100%)
    # Productivity = (active_seconds / 8 hours) * 100
    hours_per_day = 8
    seconds_per_day = hours_per_day * 3600
    productivity = ((active_seconds.to_f / seconds_per_day) * 100).round(2)
    productivity = [ productivity, 100.0 ].min

    # Get all activity logs for the date
    session_ids = sessions.pluck(:id)
    activity_logs = ActivityLog.where(session_id: session_ids)
                               .where("timestamp >= ? AND timestamp < ?", date.beginning_of_day, date.end_of_day)
                               .order(:timestamp)

    # Calculate hourly intensity stream (hourly breakdown)
    hourly_intensity = calculate_hourly_intensity(activity_logs, date)

    # Calculate telemetry data
    telemetry = calculate_telemetry(activity_logs, sessions)

    # Get screenshots for the date
    screenshot_timestamps = user.screenshots
                               .where(session_id: session_ids)
                               .where("timestamp >= ? AND timestamp < ?", date.beginning_of_day, date.end_of_day)
                               .order(:timestamp)
                               .pluck(:timestamp, :id)

    # Get minute-by-minute activity data if available
    activity_minutes = ActivityMinute.where(work_session_id: session_ids)
                                     .where("minute_timestamp >= ? AND minute_timestamp < ?",
                                            date.beginning_of_day, date.end_of_day)
                                     .order(:minute_timestamp)

    minutes_data = activity_minutes.map do |minute|
      {
        id: minute.id,
        minute_timestamp: minute.minute_timestamp.iso8601,
        active_seconds: minute.active_seconds || 0,
        idle_seconds: minute.idle_seconds || 0,
        keyboard_events: minute.keyboard_events || 0,
        mouse_events: minute.mouse_events || 0,
        active_window_title: minute.active_window_title,
        window_titles: minute.window_titles || {},
        project_name: minute.project_name,
        task_name: minute.task_name
      }
    end

    render json: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      date: date.to_s,
      metrics: {
        productivity: productivity,
        active_time_seconds: active_seconds,
        active_time_formatted: format_time(active_seconds),
        idle_time_seconds: idle_seconds,
        idle_time_formatted: format_time(idle_seconds)
      },
      hourly_intensity: hourly_intensity,
      telemetry: telemetry,
      screenshots: screenshot_timestamps.map { |ts, id| { id: id, timestamp: ts.iso8601 } },
      activity_minutes: minutes_data,
      has_detailed_data: activity_minutes.any?
    }
  end

  def calculate_hourly_intensity(activity_logs, date)
    # Initialize hourly data (9 AM to 5 PM, or full day)
    hourly_data = {}
    (9..17).each do |hour|
      hourly_data[hour] = {
        hour: hour,
        intensity: 0,
        active_seconds: 0,
        idle_seconds: 0
      }
    end

    # Group activity logs by hour
    activity_logs.to_a.each do |log|
      hour = log.timestamp.hour
      next unless hourly_data[hour]

      if log.activity_type == "active"
        hourly_data[hour][:active_seconds] += log.duration_seconds
      else
        hourly_data[hour][:idle_seconds] += log.duration_seconds
      end
    end

    # Calculate intensity percentage for each hour (0-100)
    hourly_data.each do |hour, data|
      total = data[:active_seconds] + data[:idle_seconds]
      if total > 0
        # Intensity = (active_seconds / total_seconds) * 100
        data[:intensity] = ((data[:active_seconds].to_f / total) * 100).round(2)
      else
        data[:intensity] = 0
      end
    end

    # Convert to array format for frontend
    hourly_data.values.map do |data|
      {
        time: "#{data[:hour].to_s.rjust(2, '0')}:00",
        intensity: data[:intensity],
        active_seconds: data[:active_seconds],
        idle_seconds: data[:idle_seconds]
      }
    end
  end

  def calculate_telemetry(activity_logs, sessions)
    # Use accurate totals from sessions
    cursor_events = sessions.sum(:total_mouse_events) || 0
    estimated_keystrokes = sessions.sum(:total_keyboard_events) || 0

    # Calculate average cursor events per day (placeholder)
    avg_cursor_events = 2000

    cursor_vs_avg = if avg_cursor_events > 0
      (((cursor_events.to_f - avg_cursor_events) / avg_cursor_events) * 100).round(2)
    else
      0
    end

    avg_keystrokes = 12000 # Placeholder average

    keystrokes_vs_avg = if avg_keystrokes > 0
      (((estimated_keystrokes.to_f - avg_keystrokes) / avg_keystrokes) * 100).round(2)
    else
      0
    end

    # Count active window changes (unique app_name changes)
    # If activity logs are missing, this might be 0, which is acceptable
    logs_array = activity_logs.to_a
    app_names = logs_array.map { |log| log.app_name }.compact.uniq
    active_windows = app_names.size

    {
      cursor_events: cursor_events,
      cursor_events_vs_avg: cursor_vs_avg,
      keystrokes: estimated_keystrokes,
      keystrokes_vs_avg: keystrokes_vs_avg,
      active_windows: active_windows
    }
  end

  def format_time(seconds)
    return "0h 0m" if seconds.nil? || seconds <= 0

    hours = seconds / 3600
    minutes = (seconds % 3600) / 60

    "#{hours}h #{minutes}m"
  end
end
