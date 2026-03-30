class CreateActivityLogs < ActiveRecord::Migration[8.1]
  def up
    # Create the table with primary key and partition key (if it doesn't exist)
    unless table_exists?(:activity_logs)
      execute <<-SQL
        CREATE TABLE activity_logs (
          id bigserial,
          session_id bigint NOT NULL,
          activity_type varchar NOT NULL,
          duration_seconds integer NOT NULL,
          app_name varchar,
          url varchar,
          timestamp timestamp(6) NOT NULL,
          created_at timestamp(6) NOT NULL,
          updated_at timestamp(6) NOT NULL,
          PRIMARY KEY (id, timestamp)
        ) PARTITION BY RANGE (timestamp);
      SQL
    end

    # Create an initial partition for the current year (if it doesn't exist)
    unless connection.table_exists?('activity_logs_y2026')
      execute <<-SQL
        CREATE TABLE activity_logs_y2026 PARTITION OF activity_logs
        FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
      SQL
    end

    # Add index if it doesn't exist
    unless connection.index_exists?(:activity_logs, [:session_id, :timestamp])
      add_index :activity_logs, [ :session_id, :timestamp ]
    end
  end

  def down
    drop_table :activity_logs
  end
end
