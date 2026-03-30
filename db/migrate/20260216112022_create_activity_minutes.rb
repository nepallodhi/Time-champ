class CreateActivityMinutes < ActiveRecord::Migration[8.1]
  def change
    create_table :activity_minutes do |t|
      t.references :work_session, null: false, foreign_key: true, index: true
      t.datetime :minute_timestamp, null: false
      t.integer :active_seconds, default: 0
      t.integer :idle_seconds, default: 0
      t.integer :keyboard_events, default: 0
      t.integer :mouse_events, default: 0
      t.string :active_window_title
      t.string :project_id
      t.string :task_id
      t.string :project_name
      t.string :task_name
      t.jsonb :window_titles, default: {}
      t.string :active_url
      t.string :status
      t.string :screenshot_path

      t.timestamps
    end

    add_index :activity_minutes, [:work_session_id, :minute_timestamp], name: "index_activity_minutes_on_session_and_timestamp"
    add_index :activity_minutes, :minute_timestamp, name: "index_activity_minutes_on_minute_timestamp"
  end
end
