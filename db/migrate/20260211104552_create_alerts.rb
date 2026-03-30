class CreateAlerts < ActiveRecord::Migration[8.1]
  def change
    create_table :alerts do |t|
      t.references :user, null: false, foreign_key: true
      t.string :alert_type
      t.text :message
      t.datetime :resolved_at

      t.timestamps
    end
  end
end
