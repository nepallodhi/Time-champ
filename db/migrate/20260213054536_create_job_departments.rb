class CreateJobDepartments < ActiveRecord::Migration[8.1]
  def change
    create_table :job_departments do |t|
      t.string :job_dept, null: false
      t.string :name, null: false
      t.text :description
      t.string :salary_range
      t.bigint :organization_id, null: false

      t.timestamps
    end
    
    add_index :job_departments, :organization_id
    add_foreign_key :job_departments, :organizations
  end
end
