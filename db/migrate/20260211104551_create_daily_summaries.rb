class CreateDailySummaries < ActiveRecord::Migration[8.1]
  def change
    create_table :daily_summaries do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.date :date
      t.integer :total_work_seconds, default: 0
      t.integer :active_seconds, default: 0
      t.integer :idle_seconds, default: 0
      t.decimal :productivity_score, precision: 5, scale: 2, default: 0.0

      t.timestamps
    end
    add_index :daily_summaries, [ :user_id, :date ], unique: true
  end
end
