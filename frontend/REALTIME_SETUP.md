# Real-Time WebSocket Setup - Complete Guide

## ✅ All Pages Now Have Real-Time Updates

All pages have been updated to use centralized WebSocket hooks that provide real-time updates **without page refresh**.

## WebSocket Architecture

### Centralized Hooks

1. **`useOrganizationWebSocket()`** - For organization-wide updates
   - Used in: Admin, Manager, Employee dashboards
   - Handles: USER_ONLINE, USER_OFFLINE, USER_IDLE, SESSION_UPDATE, alerts

2. **`useUserWebSocket()`** - For personal user updates
   - Used in: Employee dashboard
   - Handles: SESSION_STATE, SESSION_UPDATE

### Real-Time Events Handled

| Event | Description | Updates |
|-------|-------------|---------|
| `USER_ONLINE` | User came online | Presence state, User list |
| `USER_OFFLINE` | User went offline | Presence state, User list |
| `USER_IDLE` | User became idle | Presence state |
| `SESSION_STATE` | Session state changed | Active session, Projects |
| `SESSION_UPDATE` | Session activity updated | Session totals, Reports |
| `INACTIVE_ALERT` | Inactivity alert created | Alerts list |
| `OVERTIME_ALERT` | Overtime alert created | Alerts list |

## CRUD Operations with Real-Time Updates

### ✅ Create Operations

1. **Create User (Admin)**
   - Invalidates: `['users']`
   - WebSocket: Automatically updates when user comes online

2. **Create Project (Manager)**
   - Invalidates: `['projects']`
   - Real-time: Project appears immediately in lists

3. **Start Session (Employee)**
   - Invalidates: `['sessions']`, `['projects']`, `['reports']`
   - WebSocket: Broadcasts `USER_ONLINE` and `SESSION_STATE`

### ✅ Read Operations

- All queries have `refetchInterval: 60000` as fallback
- WebSocket updates invalidate queries for instant refresh
- No manual refresh needed

### ✅ Update Operations

1. **Update User Profile (Manager)**
   - Invalidates: `['users']`
   - Updates Redux store immediately

2. **Update Session (Activity Logging)**
   - WebSocket: Broadcasts `SESSION_UPDATE`
   - Auto-updates: Session totals, reports

3. **Assign Manager (Admin/Manager)**
   - Invalidates: `['users']`
   - Real-time: Team lists update immediately

### ✅ Delete Operations

1. **Delete Project (Manager)**
   - Invalidates: `['projects']`, `['sessions']`
   - Real-time: Project removed from lists

2. **Stop Session (Employee)**
   - Invalidates: `['sessions']`, `['reports']`, `['projects']`
   - WebSocket: Broadcasts `USER_OFFLINE`

## Pages with Real-Time Features

### Admin Pages
- ✅ **Dashboard**: Real-time user activity, metrics update automatically
- ✅ **Activity Monitoring**: Live status updates (online/idle/offline)
- ✅ **Reports**: Auto-refresh when sessions update
- ✅ **User Management**: Instant updates when users are created/updated

### Manager Pages
- ✅ **Dashboard**: Real-time team status, online count updates
- ✅ **Projects**: Instant project list updates
- ✅ **Team Management**: Real-time team member status
- ✅ **Employee Tracking**: Live productivity and activity updates
- ✅ **Profile**: Instant profile updates

### Employee Pages
- ✅ **Dashboard**: Real-time session state, activity summary
- ✅ **Team View**: Live team member status
- ✅ **Progress**: Auto-updating charts and summaries
- ✅ **Attendance**: Real-time session tracking

## WebSocket Connection Flow

1. **On Login**:
   - Token stored in localStorage
   - WebSocket consumer created with token
   - Subscriptions established

2. **On Page Load**:
   - `useOrganizationWebSocket()` hook connects
   - `useUserWebSocket()` hook connects (employees)
   - Initial data fetched via API

3. **On Events**:
   - WebSocket receives event
   - Redux store updated
   - React Query cache invalidated
   - UI updates automatically

4. **On Logout**:
   - WebSocket connections cleaned up
   - Consumer disconnected

## Error Handling

All mutations now include:
- ✅ Error logging to console
- ✅ User-friendly error messages
- ✅ Proper error display in UI

## Fallback Mechanisms

- **Query Refetch**: Every 60 seconds as fallback
- **WebSocket Reconnection**: Automatic reconnection on disconnect
- **Token Refresh**: Consumer recreated with new token if needed

## Testing Real-Time Features

1. **Test Presence Updates**:
   - Login as Employee A
   - Login as Manager in another browser
   - Start session as Employee A
   - Manager should see Employee A status change to "online" immediately

2. **Test Session Updates**:
   - Start session as Employee
   - Activity is logged (via API)
   - Dashboard should update session totals in real-time

3. **Test Alerts**:
   - Employee becomes idle
   - Manager/Admin should see alert appear immediately

4. **Test CRUD**:
   - Create project as Manager
   - Project appears in list immediately
   - No page refresh needed

## Troubleshooting

### WebSocket Not Connecting?
- Check browser console for connection errors
- Verify token is in localStorage
- Check ngrok URL is correct
- Verify backend ActionCable is running

### Updates Not Showing?
- Check browser console for WebSocket messages
- Verify queries are being invalidated
- Check Redux DevTools for state updates
- Ensure WebSocket hooks are being called

### Data Stale?
- Queries refetch every 60 seconds as fallback
- WebSocket events should trigger immediate updates
- Check network tab for API calls

## Performance Optimizations

- ✅ Query caching with React Query
- ✅ Redux state management for real-time data
- ✅ WebSocket connection reuse
- ✅ Automatic query invalidation on mutations
- ✅ Fallback refetch intervals

All pages are now fully functional with real-time WebSocket updates working without page refresh! 🎉
