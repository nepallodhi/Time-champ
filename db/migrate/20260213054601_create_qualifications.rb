class CreateQualifications < ActiveRecord::Migration[8.1]
  def change
    create_table :qualifications do |t|
      t.bigint :user_id, null: false
      t.bigint :job_id
      t.string :position, null: false
      t.text :requirements
      t.date :date_in, null: false

      t.timestamps
    end
    
    add_index :qualifications, :user_id
    add_index :qualifications, :job_id
    add_foreign_key :qualifications, :users
    add_foreign_key :qualifications, :job_departments, column: :job_id, primary_key: :id
  end
end
