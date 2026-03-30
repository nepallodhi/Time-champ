# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_02_17_095507) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "activity_logs", primary_key: ["id", "timestamp"], options: "PARTITION BY RANGE (\"timestamp\")", force: :cascade do |t|
    t.string "activity_type", null: false
    t.string "app_name"
    t.datetime "created_at", null: false
    t.integer "duration_seconds", null: false
    t.bigserial "id", null: false
    t.bigint "session_id", null: false
    t.datetime "timestamp", null: false
    t.datetime "updated_at", null: false
    t.string "url"
    t.index ["session_id", "timestamp"], name: "index_activity_logs_on_session_id_and_timestamp"
  end

  create_table "activity_logs_y2026", primary_key: ["id", "timestamp"], options: "INHERITS (activity_logs)", force: :cascade do |t|
    t.string "activity_type", null: false
    t.string "app_name"
    t.datetime "created_at", null: false
    t.integer "duration_seconds", null: false
    t.bigint "id", default: -> { "nextval('activity_logs_id_seq'::regclass)" }, null: false
    t.bigint "session_id", null: false
    t.datetime "timestamp", null: false
    t.datetime "updated_at", null: false
    t.string "url"
    t.index ["session_id", "timestamp"], name: "activity_logs_y2026_session_id_timestamp_idx"
  end

  create_table "activity_minutes", force: :cascade do |t|
    t.integer "active_seconds", default: 0
    t.string "active_url"
    t.string "active_window_title"
    t.datetime "created_at", null: false
    t.integer "idle_seconds", default: 0
    t.integer "keyboard_events", default: 0
    t.datetime "minute_timestamp", null: false
    t.integer "mouse_events", default: 0
    t.string "project_id"
    t.string "project_name"
    t.string "screenshot_path"
    t.string "status"
    t.string "task_id"
    t.string "task_name"
    t.datetime "updated_at", null: false
    t.jsonb "window_titles", default: {}
    t.bigint "work_session_id", null: false
    t.index ["minute_timestamp"], name: "index_activity_minutes_on_minute_timestamp"
    t.index ["work_session_id", "minute_timestamp"], name: "index_activity_minutes_on_session_and_timestamp"
    t.index ["work_session_id"], name: "index_activity_minutes_on_work_session_id"
  end

  create_table "alerts", force: :cascade do |t|
    t.string "alert_type"
    t.datetime "created_at", null: false
    t.text "message"
    t.datetime "resolved_at"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id"], name: "index_alerts_on_user_id"
  end

  create_table "attendance_records", force: :cascade do |t|
    t.integer "active_seconds", default: 0
    t.datetime "check_in"
    t.datetime "check_out"
    t.datetime "created_at", null: false
    t.date "date"
    t.integer "idle_seconds", default: 0
    t.bigint "organization_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["date"], name: "index_attendance_records_on_date"
    t.index ["organization_id"], name: "index_attendance_records_on_organization_id"
    t.index ["user_id", "date"], name: "index_attendance_records_on_user_id_and_date", unique: true
    t.index ["user_id"], name: "index_attendance_records_on_user_id"
  end

  create_table "daily_summaries", force: :cascade do |t|
    t.integer "active_seconds", default: 0
    t.datetime "created_at", null: false
    t.date "date"
    t.integer "idle_seconds", default: 0
    t.bigint "organization_id", null: false
    t.decimal "productivity_score", precision: 5, scale: 2, default: "0.0"
    t.integer "total_work_seconds", default: 0
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["organization_id"], name: "index_daily_summaries_on_organization_id"
    t.index ["user_id", "date"], name: "index_daily_summaries_on_user_id_and_date", unique: true
    t.index ["user_id"], name: "index_daily_summaries_on_user_id"
  end

  create_table "job_departments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.string "job_dept", null: false
    t.string "name", null: false
    t.bigint "organization_id", null: false
    t.string "salary_range"
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_job_departments_on_organization_id"
  end

  create_table "leaves", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.text "reason"
    t.string "status", default: "pending"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["date"], name: "index_leaves_on_date"
    t.index ["status"], name: "index_leaves_on_status"
    t.index ["user_id"], name: "index_leaves_on_user_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name"
    t.string "plan_type"
    t.datetime "updated_at", null: false
  end

  create_table "payrolls", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date", null: false
    t.bigint "job_id", null: false
    t.bigint "leave_id"
    t.text "report"
    t.bigint "salary_id", null: false
    t.decimal "total_amount", precision: 10, scale: 2, null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["date"], name: "index_payrolls_on_date"
    t.index ["job_id"], name: "index_payrolls_on_job_id"
    t.index ["user_id"], name: "index_payrolls_on_user_id"
  end

  create_table "project_assignments", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "project_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["project_id", "user_id"], name: "index_project_assignments_on_project_id_and_user_id", unique: true
    t.index ["project_id"], name: "index_project_assignments_on_project_id"
    t.index ["user_id"], name: "index_project_assignments_on_user_id"
  end

  create_table "projects", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "created_by"
    t.text "description"
    t.string "name"
    t.bigint "organization_id", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_projects_on_organization_id"
  end

  create_table "qualifications", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "date_in", null: false
    t.bigint "job_id"
    t.string "position", null: false
    t.text "requirements"
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["job_id"], name: "index_qualifications_on_job_id"
    t.index ["user_id"], name: "index_qualifications_on_user_id"
  end

  create_table "salary_bonuses", force: :cascade do |t|
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.boolean "annual", default: false
    t.decimal "bonus", precision: 10, scale: 2, default: "0.0"
    t.datetime "created_at", null: false
    t.bigint "job_id", null: false
    t.datetime "updated_at", null: false
    t.index ["job_id"], name: "index_salary_bonuses_on_job_id"
  end

  create_table "screenshots", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "file_path"
    t.bigint "session_id", null: false
    t.datetime "timestamp", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["file_path"], name: "index_screenshots_on_file_path"
    t.index ["session_id"], name: "index_screenshots_on_session_id"
    t.index ["timestamp"], name: "index_screenshots_on_timestamp"
    t.index ["user_id"], name: "index_screenshots_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "functional_unit"
    t.boolean "is_owner", default: false, null: false
    t.datetime "last_seen"
    t.bigint "manager_id"
    t.string "name"
    t.bigint "organization_id", null: false
    t.string "password_digest"
    t.string "role"
    t.string "status"
    t.datetime "updated_at", null: false
    t.index ["manager_id"], name: "index_users_on_manager_id"
    t.index ["organization_id", "email"], name: "index_users_on_organization_id_and_email", unique: true
    t.index ["organization_id"], name: "index_users_on_organization_id"
  end

  create_table "work_sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "end_time"
    t.datetime "last_activity_at"
    t.integer "lock_version", default: 0
    t.bigint "organization_id", null: false
    t.datetime "start_time"
    t.string "status", default: "active"
    t.integer "total_active_seconds", default: 0
    t.integer "total_idle_seconds", default: 0
    t.integer "total_keyboard_events", default: 0
    t.integer "total_mouse_events", default: 0
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["last_activity_at"], name: "index_work_sessions_on_last_activity_at"
    t.index ["organization_id"], name: "index_work_sessions_on_organization_id"
    t.index ["user_id", "status"], name: "index_work_sessions_on_user_id_and_status"
    t.index ["user_id"], name: "index_work_sessions_on_user_id"
  end

  add_foreign_key "activity_minutes", "work_sessions"
  add_foreign_key "alerts", "users"
  add_foreign_key "attendance_records", "organizations"
  add_foreign_key "attendance_records", "users"
  add_foreign_key "daily_summaries", "organizations"
  add_foreign_key "daily_summaries", "users"
  add_foreign_key "job_departments", "organizations"
  add_foreign_key "leaves", "users"
  add_foreign_key "payrolls", "job_departments", column: "job_id"
  add_foreign_key "payrolls", "leaves", column: "leave_id"
  add_foreign_key "payrolls", "salary_bonuses", column: "salary_id"
  add_foreign_key "payrolls", "users"
  add_foreign_key "project_assignments", "projects"
  add_foreign_key "project_assignments", "users"
  add_foreign_key "projects", "organizations"
  add_foreign_key "qualifications", "job_departments", column: "job_id"
  add_foreign_key "qualifications", "users"
  add_foreign_key "salary_bonuses", "job_departments", column: "job_id"
  add_foreign_key "screenshots", "users"
  add_foreign_key "screenshots", "work_sessions", column: "session_id"
  add_foreign_key "users", "organizations"
  add_foreign_key "users", "users", column: "manager_id"
  add_foreign_key "work_sessions", "organizations"
  add_foreign_key "work_sessions", "users"
end
