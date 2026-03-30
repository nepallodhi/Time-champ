# How the Desktop Agent Works

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Desktop Agent                         │
│  (Electron App - Runs on User's Computer)               │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Monitors
                          ▼
        ┌─────────────────────────────────────┐
        │  1. Active Window Tracker           │
        │     - Detects current app            │
        │     - Every 60 seconds               │
        └─────────────────────────────────────┘
                          │
        ┌─────────────────────────────────────┐
        │  2. Screenshot Tracker               │
        │     - Records timestamps             │
        │     - Every 5 minutes                │
        └─────────────────────────────────────┘
                          │
        ┌─────────────────────────────────────┐
        │  3. Idle Tracker                     │
        │     - Monitors input activity        │
        │     - Detects 5 min inactivity       │
        └─────────────────────────────────────┘
                          │
        ┌─────────────────────────────────────┐
        │  4. Input Tracker                    │
        │     - Keyboard/mouse monitoring      │
        │     - Determines active/idle state   │
        └─────────────────────────────────────┘
                          │
                          │ Sends Data
                          ▼
        ┌─────────────────────────────────────┐
        │         Rails API                    │
        │  (http://localhost:3000/api/v1)     │
        └─────────────────────────────────────┘
                          │
                          │ Stores
                          ▼
        ┌─────────────────────────────────────┐
        │      PostgreSQL Database            │
        │  - activity_logs (with app_name)    │
        │  - screenshots (with timestamp)     │
        └─────────────────────────────────────┘
                          │
                          │ Displays
                          ▼
        ┌─────────────────────────────────────┐
        │      Web Application                 │
        │  - Activity reports                  │
        │  - Screenshot timeline               │
        │  - Productivity analytics            │
        └─────────────────────────────────────┘
```

## 📊 Data Flow Example

### Scenario: User working in VS Code

```
Time    | Event                    | Data Sent to API
--------|--------------------------|----------------------------------
10:00   | App starts tracking      | (Initial connection)
10:00   | Active window: VS Code   | POST /sessions/1/activity
        |                          | { app_name: "Code", 
        |                          |   activity_type: "active",
        |                          |   duration_seconds: 60 }
10:01   | Still in VS Code         | POST /sessions/1/activity
        |                          | { app_name: "Code", ... }
10:02   | Switched to Chrome        | POST /sessions/1/activity
        |                          | { app_name: "Chrome", ... }
10:05   | Screenshot timestamp     | POST /sessions/1/screenshots
        |                          | { timestamp: "2026-02-14T10:05:00Z" }
10:06   | No input for 5 min       | POST /sessions/1/activity
        |                          | { activity_type: "idle", ... }
```

## 🔄 Component Details

### 1. Activity Tracker (`activityTracker.js`)

**Purpose**: Track which application is currently active

**How it works**:
```javascript
// Every 60 seconds:
1. Get active window using 'active-win' library
2. Extract app name (e.g., "VS Code", "Chrome")
3. Calculate duration since last check
4. Send to API with app_name
```

**Data Structure**:
```json
{
  "activity_type": "active" | "idle",
  "duration_seconds": 60,
  "app_name": "VS Code",
  "url": "file:///path/to/file",
  "timestamp": "2026-02-14T10:00:00Z"
}
```

### 2. Screenshot Tracker (`screenshotTracker.js`)

**Purpose**: Record screenshot timestamps (metadata only)

**How it works**:
```javascript
// Every 5 minutes:
1. Capture screenshot using 'screenshot-desktop'
2. Generate timestamp
3. Send ONLY timestamp to API (no image)
4. Optionally save locally (disabled by default)
```

**Data Structure**:
```json
{
  "timestamp": "2026-02-14T10:05:00Z"
}
```

**Note**: Images are NOT stored, only timestamps!

### 3. Idle Tracker (`idleTracker.js`)

**Purpose**: Detect when user is inactive

**How it works**:
```javascript
// Continuously:
1. Monitor input activity via InputTracker
2. Track last activity time
3. If no activity for 5 minutes → mark as idle
4. When activity resumes → mark as active
```

**Threshold**: 5 minutes of no keyboard/mouse input

### 4. Input Tracker (`inputTracker.js`)

**Purpose**: Monitor keyboard and mouse activity

**How it works**:
```javascript
// Continuously:
1. Check mouse position changes
2. Monitor keyboard activity (if available)
3. Trigger activity callbacks when input detected
4. Used by IdleTracker to determine active/idle state
```

**Privacy**: Only tracks activity, NOT what you type!

## 🔐 Security & Privacy

### What IS Tracked:
✅ Application names (e.g., "VS Code", "Chrome")  
✅ Window titles (e.g., "index.tsx - VS Code")  
✅ Activity timestamps  
✅ Screenshot timestamps (no images)  
✅ Active/Idle state  

### What is NOT Tracked:
❌ Screen content/images  
❌ Keystrokes/content  
❌ File contents  
❌ Personal data  
❌ Passwords  

### Data Storage:
- All data sent to YOUR Rails API
- Stored in YOUR database
- No third-party services
- JWT token stored locally (encrypted by OS)

## 🎯 Integration Points

### API Endpoints Used:

1. **Get Active Session**
   ```
   GET /api/v1/sessions/active
   ```
   - Called when tracking starts
   - Returns current work session

2. **Log Activity**
   ```
   POST /api/v1/sessions/:id/activity
   ```
   - Called every 60 seconds
   - Sends app name and activity data

3. **Create Screenshot Metadata**
   ```
   POST /api/v1/sessions/:id/screenshots
   ```
   - Called every 5 minutes
   - Sends timestamp only

### Database Tables:

1. **activity_logs**
   ```sql
   - session_id
   - activity_type (active/idle)
   - duration_seconds
   - app_name ← NEW! (from desktop app)
   - url
   - timestamp
   ```

2. **screenshots**
   ```sql
   - session_id
   - user_id
   - timestamp ← Screenshot time
   - created_at
   ```

## 🖥️ User Interface

### Main Window Components:

1. **Status Display**
   - Shows tracking status (Active/Inactive)
   - Displays current session ID
   - Color-coded indicators

2. **Control Buttons**
   - Start Tracking
   - Stop Tracking
   - Configuration

3. **Configuration Panel**
   - API URL input
   - JWT Token input
   - Interval settings

### System Tray:

- **Icon**: WorkPulse logo (or placeholder)
- **Right-click Menu**:
  - Start/Stop Tracking
  - Show Window
  - Quit
- **Left-click**: Show main window

## 🔧 Configuration

### Config File: `src/config/config.json`

```json
{
  "apiUrl": "http://localhost:3000/api/v1",
  "token": "your-jwt-token",
  "screenshotInterval": 300000,  // 5 minutes
  "idleThreshold": 300000,        // 5 minutes
  "activityInterval": 60000       // 1 minute
}
```

### Environment Variables (Optional):

You can also set these via environment variables:
- `WORKPULSE_API_URL`
- `WORKPULSE_TOKEN`

## 📈 Performance

### Resource Usage:
- **CPU**: < 1% (idle), ~2-3% (active)
- **Memory**: ~50-100 MB
- **Network**: Minimal (small API calls)
- **Disk**: Minimal (config only)

### Optimization:
- Batched API calls
- Efficient polling intervals
- Minimal system impact
- Runs in background

## 🐛 Error Handling

### Common Errors:

1. **"No active session found"**
   - Solution: Start session in web app first

2. **"Failed to log activity"**
   - Check: API server running?
   - Check: JWT token valid?
   - Check: Network connection?

3. **"Active window detection failed"**
   - macOS: Grant Accessibility permissions
   - Windows: Usually works automatically
   - Linux: Check X11 permissions

### Logging:

The app logs to console:
- Tracking start/stop
- Activity logs
- Screenshot captures
- Errors and warnings

## 🚀 Future Enhancements

Potential features:
- Auto-update mechanism
- Better error recovery
- Offline mode with sync
- Custom app categorization
- Productivity insights
- Notification system
