class AddTotalEventsToWorkSessions < ActiveRecord::Migration[8.1]
  def change
    add_column :work_sessions, :total_keyboard_events, :integer, default: 0
    add_column :work_sessions, :total_mouse_events, :integer, default: 0
  end
end
