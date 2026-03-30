# WorkPulse — Workforce Productivity & Time Intelligence System

WorkPulse is a production-grade workforce productivity tracking platform built with Ruby on Rails. It tracks employee work sessions, active vs idle time, project logging, and provides real-time monitoring and analytics.

## Tech Stack

- **Backend**: Ruby on Rails 8.1 (API-only)
- **Database**: PostgreSQL 16 (Native Partitioning for activity logs)
- **Cache/Queue**: Redis 7
- **Background Jobs**: Sidekiq with sidekiq-scheduler
- **Real-time**: ActionCable (via Redis adapter)
- **Auth**: JWT Authentication
- **Rate Limiting**: Rack::Attack
- **Logging**: Structured JSON with Lograge

## Core Features

- **Multi-Tenant**: Every record is scoped to an `Organization`
- **Session Tracking**: Only one active session per user
- **Activity Ingestion**: High-frequency ingestion (every 30-60s) with concurrency safety
- **Optimistic Locking**: Prevents double-counting and race conditions during telemetry ingestion
- **Real-time Monitoring**: WebSocket updates for user presence (Online/Offline/Idle) and alerts
- **Automated Analytics**: Sidekiq jobs for daily summaries, idle detection, and overtime alerts
- **Rate Limiting**: Protection against API abuse with configurable limits
- **Role-Based Access**: Admin, Manager, and Employee roles with appropriate permissions

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register organization and user
- `POST /api/v1/auth/login` - User login

### Sessions
- `POST /api/v1/sessions/start` - Start work session
- `POST /api/v1/sessions/:id/stop` - Stop work session
- `GET /api/v1/sessions/active` - Get active session

### Activities
- `POST /api/v1/sessions/:id/activity` - Log activity

### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

### Alerts
- `GET /api/v1/alerts` - List alerts (role-based)
- `GET /api/v1/alerts/:id` - Get alert
- `POST /api/v1/alerts/:id/resolve` - Resolve alert

### Users
- `GET /api/v1/users` - List users (admin/manager)
- `GET /api/v1/users/:id` - Get user
- `PUT /api/v1/users/:id` - Update user

### Reports
- `GET /api/v1/reports/daily` - Daily summaries
- `GET /api/v1/reports/user/:id` - User reports

### Health
- `GET /api/v1/health` - System health check

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Ruby 3.2.2 (if running locally)

### Installation

1. Clone the repository
2. Setup environment variables:
   ```bash
   cp .env.example .env
   ```
3. Start the system:
   ```bash
   docker-compose up --build
   ```

The API will be available at `http://localhost:3000`.

## Architecture & Scalability

### Locking Strategy
We use **Optimistic Locking** (`lock_version`) on the `WorkSessions` table. The `ActivitiesController` handles high-frequency updates by retrying conflicts up to 3 times, ensuring high ingestion reliability without sacrificing data integrity.

### Rate Limiting
- **Authentication**: 5 requests/minute per IP
- **Activity Ingestion**: 200 requests/minute per user
- **General API**: 100 requests/minute per user

### Real-time Flow
1. User connects to `OrganizationChannel`
2. Redis tracks the online presence set
3. Activity ingestion triggers state transitions (e.g., Online → Idle)
4. Broadcasts are sent via ActionCable to all managers in the organization

### Scheduled Jobs
- **DailySummaryJob**: Runs daily at midnight
- **IdleDetectionJob**: Runs every 5 minutes
- **OvertimeAlertJob**: Runs every 30 minutes

### Job Idempotency
`DailySummaryJob` uses a unique index on `(user_id, date)` to ensure that double-runs do not create duplicate records.

## Verification

Run the load test script to verify concurrency handling:

```bash
ruby script/test_activity_load.rb
```

This script fires 100 parallel activity updates and validates that the final totals match the expected counts exactly.

**Latest Results:**
- ✅ 100% success rate (100/100 requests)
- ✅ Exact totals: 6000 seconds (100 × 60)
- ✅ No race conditions detected
- ⚡ Completed in ~1.6 seconds
# Time-champ
