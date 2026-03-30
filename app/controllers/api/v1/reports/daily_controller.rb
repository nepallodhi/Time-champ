class Api::V1::Reports::DailyController < ApplicationController
  include Authenticatable

  def daily
    start_date = params[:start_date] || (Date.today - 7.days).to_s
    end_date = params[:end_date] || Date.today.to_s
    
    # Filter by current user's daily summaries
    summaries = current_user.daily_summaries
                             .where(date: start_date..end_date)
                             .order(date: :asc)

    # Serialize with frontend-expected field names
    render json: summaries.map { |s|
      {
        id: s.id,
        user_id: s.user_id,
        date: s.date.to_s, # Convert date to string format
        total_active_seconds: s.active_seconds || 0,
        total_idle_seconds: s.idle_seconds || 0,
        productivity_percentage: s.productivity_score || 0.0,
        work_sessions_count: s.user.work_sessions.where(start_time: s.date.all_day).count
      }
    }
  end
end
