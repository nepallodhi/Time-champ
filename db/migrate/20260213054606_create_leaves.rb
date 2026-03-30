class CreateLeaves < ActiveRecord::Migration[8.1]
  def change
    create_table :leaves do |t|
      t.bigint :user_id, null: false
      t.date :date, null: false
      t.text :reason
      t.string :status, default: "pending"

      t.timestamps
    end
    
    add_index :leaves, :user_id
    add_index :leaves, :date
    add_index :leaves, :status
    add_foreign_key :leaves, :users
  end
end
