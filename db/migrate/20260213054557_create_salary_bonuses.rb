class CreateSalaryBonuses < ActiveRecord::Migration[8.1]
  def change
    create_table :salary_bonuses do |t|
      t.bigint :job_id, null: false
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.boolean :annual, default: false
      t.decimal :bonus, precision: 10, scale: 2, default: 0.0

      t.timestamps
    end
    
    add_index :salary_bonuses, :job_id
    add_foreign_key :salary_bonuses, :job_departments, column: :job_id, primary_key: :id
  end
end
