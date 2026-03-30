class CreateScreenshots < ActiveRecord::Migration[8.1]
  def change
    create_table :screenshots do |t|
      t.bigint :session_id, null: false
      t.bigint :user_id, null: false
      t.datetime :timestamp, null: false

      t.timestamps
    end

    add_index :screenshots, :session_id
    add_index :screenshots, :user_id
    add_index :screenshots, :timestamp
    add_foreign_key :screenshots, :work_sessions, column: :session_id
    add_foreign_key :screenshots, :users, column: :user_id
  end
end
