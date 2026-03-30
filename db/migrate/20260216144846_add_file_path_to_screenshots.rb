class AddFilePathToScreenshots < ActiveRecord::Migration[8.1]
  def change
    add_column :screenshots, :file_path, :string
    add_index :screenshots, :file_path
  end
end
