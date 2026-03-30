class AttendanceService
  # Service to track user attendance (login/logout, active/idle time)
  # Separate from project work sessions
  
  def self.check_in(user)
    today = Date.current
    record = AttendanceRecord.find_or_initialize_by(user: user, date: today)
    
    # If already checked in today, don't create duplicate
    return record if record.check_in.present? && record.check_out.nil?
    
    record.organization = user.organization
    record.check_in = Time.current
    record.save!
    record
  end

  def self.check_out(user)
    today = Date.current
    record = AttendanceRecord.find_by(user: user, date: today, check_out: nil)
    return nil unless record
    
    record.check_out = Time.current
    record.save!
    record
  end

  def self.update_activity(user, is_active: true)
    today = Date.current
    record = AttendanceRecord.find_or_initialize_by(user: user, date: today)
    
    # Initialize if first activity of the day
    if record.new_record?
      record.organization = user.organization
      record.check_in ||= Time.current
    end
    
    # Calculate time since last update or check_in
    last_update = record.updated_at || record.check_in || Time.current
    elapsed_seconds = (Time.current - last_update).to_i
    
    if is_active
      record.active_seconds = (record.active_seconds || 0) + elapsed_seconds
    else
      record.idle_seconds = (record.idle_seconds || 0) + elapsed_seconds
    end
    
    record.save!
    record
  end

  def self.get_today_record(user)
    AttendanceRecord.find_by(user: user, date: Date.current)
  end

  def self.get_date_range(user, start_date, end_date)
    AttendanceRecord.where(user: user, date: start_date..end_date).order(date: :desc)
  end
end
