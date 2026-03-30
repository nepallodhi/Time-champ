class AddManagerIdToUsers < ActiveRecord::Migration[8.1]
  def change
    add_reference :users, :manager, null: true, foreign_key: { to_table: :users }, index: true
  end
end
