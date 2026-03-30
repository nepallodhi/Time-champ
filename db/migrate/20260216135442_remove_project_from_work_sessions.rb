class RemoveProjectFromWorkSessions < ActiveRecord::Migration[8.1]
  def change
    remove_foreign_key :work_sessions, :projects
    remove_index :work_sessions, :project_id if index_exists?(:work_sessions, :project_id)
    remove_column :work_sessions, :project_id, :bigint
  end
end
