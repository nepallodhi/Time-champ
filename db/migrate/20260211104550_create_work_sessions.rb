class CreateWorkSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :work_sessions do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :project, null: false, foreign_key: true
      t.datetime :start_time
      t.datetime :end_time
      t.integer :total_active_seconds, default: 0
      t.integer :total_idle_seconds, default: 0
      t.string :status, default: 'active'
      t.datetime :last_activity_at
      t.integer :lock_version, default: 0

      t.timestamps
    end
    add_index :work_sessions, [ :user_id, :status ]
    add_index :work_sessions, :last_activity_at
  end
end
