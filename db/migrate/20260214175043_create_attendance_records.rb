class CreateAttendanceRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :attendance_records do |t|
      t.references :user, null: false, foreign_key: true
      t.references :organization, null: false, foreign_key: true
      t.datetime :check_in
      t.datetime :check_out
      t.integer :active_seconds, default: 0
      t.integer :idle_seconds, default: 0
      t.date :date

      t.timestamps
    end
    
    add_index :attendance_records, [:user_id, :date], unique: true
    add_index :attendance_records, :date
  end
end
