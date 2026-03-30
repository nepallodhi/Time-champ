class Api::V1::AttendanceController < ApplicationController
  include Authenticatable

  def index
    # Get attendance records for current user
    start_date = params[:start_date] || (Date.today - 30.days).to_s
    end_date = params[:end_date] || Date.today.to_s
    
    records = AttendanceService.get_date_range(
      current_user,
      Date.parse(start_date),
      Date.parse(end_date)
    )
    
    render json: {
      attendance_records: records.map { |r| attendance_response(r) },
      total_active_seconds: records.sum(:active_seconds),
      total_idle_seconds: records.sum(:idle_seconds)
    }
  end

  def show
    # Get attendance for specific user (for managers/admins)
    user = current_user.organization.users.find(params[:id])
    
    start_date = params[:start_date] || (Date.today - 30.days).to_s
    end_date = params[:end_date] || Date.today.to_s
    
    records = AttendanceService.get_date_range(
      user,
      Date.parse(start_date),
      Date.parse(end_date)
    )
    
    render json: {
      user: { id: user.id, name: user.name, email: user.email },
      attendance_records: records.map { |r| attendance_response(r) },
      total_active_seconds: records.sum(:active_seconds),
      total_idle_seconds: records.sum(:idle_seconds)
    }
  end

  def update_activity
    # Update current activity status (called periodically from frontend)
    is_active = params[:is_active] != false
    AttendanceService.update_activity(current_user, is_active: is_active)
    
    render json: { status: "success" }
  end

  private

  def attendance_response(record)
    {
      id: record.id,
      user_id: record.user_id,
      date: record.date,
      check_in: record.check_in,
      check_out: record.check_out,
      active_seconds: record.active_seconds || 0,
      idle_seconds: record.idle_seconds || 0,
      total_seconds: record.total_seconds,
      active_percentage: record.active_percentage
    }
  end
end
