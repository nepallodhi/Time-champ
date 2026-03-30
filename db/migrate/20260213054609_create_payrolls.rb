class CreatePayrolls < ActiveRecord::Migration[8.1]
  def change
    create_table :payrolls do |t|
      t.bigint :user_id, null: false
      t.bigint :job_id, null: false
      t.bigint :salary_id, null: false
      t.bigint :leave_id
      t.date :date, null: false
      t.text :report
      t.decimal :total_amount, precision: 10, scale: 2, null: false

      t.timestamps
    end
    
    add_index :payrolls, :user_id
    add_index :payrolls, :job_id
    add_index :payrolls, :date
    add_foreign_key :payrolls, :users
    add_foreign_key :payrolls, :job_departments, column: :job_id, primary_key: :id
    add_foreign_key :payrolls, :salary_bonuses, column: :salary_id, primary_key: :id
    add_foreign_key :payrolls, :leaves, column: :leave_id, primary_key: :id
  end
end
