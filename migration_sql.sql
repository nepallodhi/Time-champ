-- SQL to manually create project_assignments table
-- Use this if you can't run Rails migrations on the server
-- Connect to your database and run this SQL

CREATE TABLE IF NOT EXISTS project_assignments (
  id bigserial PRIMARY KEY,
  project_id bigint NOT NULL,
  user_id bigint NOT NULL,
  created_at timestamp(6) NOT NULL,
  updated_at timestamp(6) NOT NULL,
  CONSTRAINT fk_rails_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_rails_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS index_project_assignments_on_project_id_and_user_id 
ON project_assignments (project_id, user_id);

-- Mark migration as run (optional, if you want Rails to know it's done)
-- INSERT INTO schema_migrations (version) VALUES ('20260216112021') ON CONFLICT DO NOTHING;
