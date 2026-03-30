class AddFunctionalUnitAndIsOwnerToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :functional_unit, :string
    add_column :users, :is_owner, :boolean, default: false, null: false
  end
end
