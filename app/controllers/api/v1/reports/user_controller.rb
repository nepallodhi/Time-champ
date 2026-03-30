class Api::V1::Reports::UserController < ApplicationController
  include Authenticatable

  def show
    user = current_user.organization.users.find(params[:id])

    start_date = params[:start_date] || (Date.today - 30.days).to_s
    end_date = params[:end_date] || Date.today.to_s

    # Get all work sessions in date range
    sessions = user.work_sessions
                   .where(start_time: Date.parse(start_date)..Date.parse(end_date).end_of_day)

    # Calculate totals from sessions (handling active sessions correctly)
    total_active_seconds = 0
    total_idle_seconds = 0

    # Helper to calculate session times
    calculate_session_times = ->(session) {
      if session.start_time && session.end_time
        # Stopped session
        duration = (session.end_time - session.start_time).to_i
        active = session.total_active_seconds || duration
        idle = session.total_idle_seconds || 0
        [ active, idle ]
      elsif session.start_time && session.status == "active"
        # Active session
        duration = (Time.current - session.start_time).to_i
        active = session.total_active_seconds || duration
        idle = session.total_idle_seconds || 0
        [ active, idle ]
      else
        [ session.total_active_seconds || 0, session.total_idle_seconds || 0 ]
      end
    }

    sessions.each do |session|
      active, idle = calculate_session_times.call(session)
      total_active_seconds += active
      total_idle_seconds += idle
    end

    # Generate daily summaries list from sessions
    daily_data = sessions.group_by { |s| s.start_time.to_date }

    # Iterate through all dates in range (descending)
    range = (Date.parse(start_date)..Date.parse(end_date)).to_a.reverse

    serialized_summaries = range.map do |date|
      date_sessions = daily_data[date] || []

      day_active = 0
      day_idle = 0

      date_sessions.each do |session|
        active, idle = calculate_session_times.call(session)
        day_active += active
        day_idle += idle
      end

      # Calculate daily productivity
      # Productivity = (active / 8 hours) * 100
      day_productivity = if day_active > 0
        ((day_active.to_f / 28800) * 100).round(2) # 28800 = 8 hours * 3600
      else
        0.0
      end

      {
        id: nil, # No daily summary ID effectively
        user_id: user.id,
        date: date,
        total_active_seconds: day_active,
        total_idle_seconds: day_idle,
        productivity_percentage: [ day_productivity, 100.0 ].min,
        work_sessions_count: date_sessions.count
      }
    end

    # Filter out empty days if you want (but usually reports show all days)
    # summaries = user.daily_summaries... logic removed

    # Calculate average productivity (average of daily percentages where active > 0)
    working_days = serialized_summaries.select { |s| s[:total_active_seconds] > 0 }
    average_productivity = if working_days.any?
      (working_days.sum { |s| s[:productivity_percentage] } / working_days.count).round(2)
    else
      0.0
    end

    # Calculate project-wise productivity (ONLY from work sessions, not from daily summaries)
    project_breakdown = calculate_project_breakdown(user, start_date, end_date)

    # Calculate Project Productivity metrics from work sessions only
    project_productivity = calculate_project_productivity_from_sessions(user, start_date, end_date)

    render json: {
      user: { id: user.id, name: user.name, email: user.email },
      daily_summaries: serialized_summaries,
      total_active_hours: (total_active_seconds / 3600.0).round(2),
      total_idle_hours: (total_idle_seconds / 3600.0).round(2),
      average_productivity: average_productivity,
      project_breakdown: project_breakdown,
      # Project Productivity metrics (from work sessions only)
      project_productivity: project_productivity
    }
  end

  private

  def calculate_project_breakdown(user, start_date, end_date)
    # Get all activity minutes for the user in the date range
    # Group by project from activity_minutes (sessions no longer have projects)
    activity_minutes = ActivityMinute.joins(:work_session)
                                     .where(work_sessions: { user_id: user.id })
                                     .where(minute_timestamp: Date.parse(start_date)..Date.parse(end_date).end_of_day)

    # Group by project_id from activity_minutes
    project_data = activity_minutes.group_by { |am| am.project_id }.map do |project_id, minutes|
      next nil if project_id.blank?

      # Calculate totals from activity minutes
      total_active = minutes.sum { |m| m.active_seconds || 0 }
      total_idle = minutes.sum { |m| m.idle_seconds || 0 }
      total_seconds = total_active + total_idle

      # Get project name from first minute (or lookup project if needed)
      project_name = minutes.first&.project_name || "Unknown"

      # Calculate productivity percentage
      productivity = if total_seconds > 0
        ((total_active.to_f / total_seconds) * 100).round(2)
      else
        0.0
      end

      {
        project_id: project_id,
        project_name: project_name,
        total_active_seconds: total_active,
        total_idle_seconds: total_idle,
        total_seconds: total_seconds,
        total_active_hours: (total_active / 3600.0).round(2),
        total_idle_hours: (total_idle / 3600.0).round(2),
        productivity_percentage: productivity,
        sessions_count: minutes.map(&:work_session_id).uniq.count
      }
    end.compact

    # Sort by total active seconds (descending)
    project_data.sort_by { |p| -p[:total_active_seconds] }
  end

  def calculate_project_productivity_from_sessions(user, start_date, end_date)
    # Get all work sessions (project sessions) for the user in the date range
    sessions = user.work_sessions
                   .where(start_time: Date.parse(start_date)..Date.parse(end_date).end_of_day)

    return {
      total_project_hours: 0.0,
      average_productivity: 0.0,
      has_project_sessions: false
    } if sessions.empty?

    # Calculate totals from work sessions only
    total_active = 0
    total_idle = 0
    total_seconds = 0

    sessions.each do |session|
      # For stopped sessions with end_time, always use actual duration
      if session.start_time && session.end_time
        # Stopped session: use actual duration from start to end time
        session_duration = (session.end_time - session.start_time).to_i
        session_active = session_duration
        session_idle = 0  # For project sessions, we treat all time as active
        session_total = session_duration
      elsif session.start_time && session.status == "active"
        # Active session: calculate from start_time to now
        session_duration = (Time.current - session.start_time).to_i
        session_active = session_duration
        session_idle = 0
        session_total = session_duration
      else
        # Fallback to logged activity if available
        session_active = session.total_active_seconds || 0
        session_idle = session.total_idle_seconds || 0
        session_total = session_active + session_idle
      end

      total_active += session_active
      total_idle += session_idle
      total_seconds += session_total
    end

    # Calculate productivity percentage based on active time vs total time
    # Productivity = (active_seconds / total_seconds) * 100
    productivity = if total_seconds > 0
      ((total_active.to_f / total_seconds) * 100).round(2)
    else
      0.0
    end

    {
      total_project_hours: (total_active / 3600.0).round(2),
      average_productivity: productivity,
      has_project_sessions: true
    }
  end
end
