# WorkPulse Frontend - Complete Routes Guide

## Overview

The frontend now includes comprehensive pages and routes for all three roles with full WebSocket integration for real-time updates.

## Admin Routes (`/admin/*`)

### 1. Dashboard (`/admin/dashboard`)
- Organization-wide metrics (total users, online users, idle users, managers, employees)
- Activity charts (last 7 days)
- Productivity trends
- User activity overview with real-time status

### 2. User Management (`/admin/users`)
- **Create Manager**: Create new manager accounts
- **Create Employee**: Create new employee accounts
- **Assign Manager to Employees**: Assign employees to managers
- View all managers and their team sizes
- View all employees with their assigned managers

### 3. Activity Monitoring (`/admin/activity`)
- Real-time activity table for all users
- Status indicators (online/idle/offline)
- Last activity timestamps
- Productivity percentages
- WebSocket integration for live updates

### 4. Reports (`/admin/reports`)
- Role distribution charts
- Activity trends (last 30 days)
- User productivity summary table
- Comprehensive analytics

## Manager Routes (`/manager/*`)

### 1. Dashboard (`/manager/dashboard`)
- Team overview metrics
- Active projects count
- Online team members
- Team member list with real-time status

### 2. Projects (`/manager/projects`)
- **Create Project**: Create new projects with name and description
- **Assign Project**: Assign projects to team members
- View all projects
- Delete projects
- Project assignment interface

### 3. Team Management (`/manager/team`)
- **Add Employees to Team**: Add unassigned employees to your team
- **Remove from Team**: Remove employees from your team
- View current team members
- View available (unassigned) employees

### 4. Employee Tracking (`/manager/tracking`)
- Individual employee cards with:
  - Real-time status (online/idle/offline)
  - Productivity percentage
  - Active/Idle hours
  - Productivity trend charts (last 7 days)
  - Recent activity
  - Work sessions count
- WebSocket integration for live status updates

## Employee Routes (`/employee/*`)

### 1. Dashboard (`/employee/dashboard`)
- Session control (start/stop with project selection)
- Activity summary with pie charts
- Live status indicator
- Project time tracking
- WebSocket integration for:
  - Session state updates
  - Presence updates (online/idle/offline)
  - Real-time activity tracking

### 2. My Team (`/employee/team`)
- View assigned manager
- View team members (employees with same manager)
- Real-time status for all team members
- WebSocket integration for live presence

### 3. My Progress (`/employee/progress`)
- Average productivity card
- Total active/idle hours
- Work hours trend chart (last 30 days)
- Productivity trend line chart
- Daily summary table with:
  - Date
  - Active/Idle hours
  - Productivity percentage
  - Work sessions count

### 4. Attendance (`/employee/attendance`)
- Present days count
- Total days in month
- Attendance rate percentage
- Calendar view with:
  - Present days (green)
  - Absent days (gray)
  - Today highlighted (blue)
- Recent activity list

## WebSocket Integration

### Channels Used

1. **UserChannel** (Employee)
   - Personal session updates
   - Session state changes
   - Real-time activity tracking

2. **OrganizationChannel** (All Roles)
   - User presence updates (USER_ONLINE, USER_OFFLINE, USER_IDLE)
   - Real-time status changes
   - Organization-wide activity

### WebSocket Events Handled

- `USER_ONLINE`: User came online
- `USER_OFFLINE`: User went offline
- `USER_IDLE`: User became idle
- `SESSION_STATE`: Session state update
- `SESSION_UPDATE`: Session data update
- `INACTIVE_ALERT`: Inactivity alert (Manager/Admin)
- `OVERTIME_ALERT`: Overtime alert (Manager/Admin)

### Real-Time Features

- ✅ Live presence indicators (online/idle/offline)
- ✅ Real-time session tracking
- ✅ Instant status updates across all dashboards
- ✅ Live activity monitoring
- ✅ Real-time team status

## Navigation

All dashboards include a top navigation bar with:
- Role-specific menu items
- User name and role badge
- Logout button
- Active route highlighting

## API Integration

### User Management
- `POST /api/v1/auth/register` - Create new users (managers/employees)
- `GET /api/v1/users` - List all users
- `PUT /api/v1/users/:id` - Update user (assign manager, change role)

### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `DELETE /api/v1/projects/:id` - Delete project

### Sessions
- `POST /api/v1/sessions/start` - Start work session
- `POST /api/v1/sessions/:id/stop` - Stop work session
- `GET /api/v1/sessions/active` - Get active session

### Reports
- `GET /api/v1/reports/daily` - Daily summaries
- `GET /api/v1/reports/user/:id` - User reports

## Features Summary

### Admin Features
✅ Create managers and employees
✅ Assign managers to employees
✅ View organization-wide activity
✅ Monitor all users in real-time
✅ View comprehensive reports
✅ Track user productivity

### Manager Features
✅ Create and manage projects
✅ Assign projects to team members
✅ Add/remove employees from team
✅ Track team member progress
✅ View real-time team status
✅ Monitor employee activity and productivity

### Employee Features
✅ Start/stop work sessions
✅ View team and team members
✅ Track personal progress
✅ View attendance calendar
✅ Real-time status updates
✅ Activity summaries and charts

## Next Steps

1. **Backend API Extensions** (if needed):
   - Add endpoint for project assignment to users
   - Add manager_id field to User model if not exists
   - Add endpoint for bulk user creation

2. **Enhancements**:
   - Add screenshot viewing in employee tracking
   - Add file attachments management
   - Add notifications system
   - Add search and filtering

3. **Testing**:
   - Test WebSocket connections
   - Test all CRUD operations
   - Test real-time updates
   - Test role-based access
