class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :email
      t.string :password_digest
      t.string :name
      t.string :role
      t.string :status
      t.datetime :last_seen

      t.timestamps
    end
    add_index :users, [ :organization_id, :email ], unique: true
  end
end
