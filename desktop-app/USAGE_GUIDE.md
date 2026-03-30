# WorkPulse Desktop Agent - Usage Guide

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd desktop-app
npm install
```

### Step 2: Get Your JWT Token

1. **Log in to WorkPulse Web App**
   - Open your browser and go to `http://localhost:5173` (or your frontend URL)
   - Log in with your credentials

2. **Get the Token**
   - Open Browser DevTools (F12 or Right-click → Inspect)
   - Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
   - Click on **Local Storage** → Your domain
   - Find the key `token` and copy its value

### Step 3: Configure the App

Edit `src/config/config.json`:

```json
{
  "apiUrl": "http://localhost:3000/api/v1",
  "token": "paste-your-jwt-token-here",
  "screenshotInterval": 300000,
  "idleThreshold": 300000,
  "activityInterval": 60000
}
```

**Configuration Options:**
- `apiUrl`: Your Rails API URL (default: `http://localhost:3000/api/v1`)
- `token`: Your JWT authentication token
- `screenshotInterval`: How often to capture screenshots (in milliseconds)
  - Default: 300000 (5 minutes)
- `idleThreshold`: Time before user is considered idle (in milliseconds)
  - Default: 300000 (5 minutes)
- `activityInterval`: How often to log activity (in milliseconds)
  - Default: 60000 (1 minute)

### Step 4: Start a Work Session (Web App)

**IMPORTANT**: You must start a work session from the web app first!

1. Go to the WorkPulse web app
2. Navigate to your dashboard
3. Select a project
4. Click **"Start Session"** or **"Start Tracking"**

### Step 5: Run the Desktop App

```bash
npm start
```

Or for development mode:
```bash
npm run dev
```

## 📱 How It Works

### Main Window

When you start the app, you'll see a control panel with:

1. **Status Indicator**
   - Shows if tracking is active or inactive
   - Green = Tracking Active
   - Red = Tracking Inactive

2. **Start/Stop Buttons**
   - Click "Start Tracking" to begin monitoring
   - Click "Stop Tracking" to pause monitoring

3. **Session Information**
   - Shows your current session ID
   - Displays tracking status

4. **Configuration Panel**
   - Update API URL
   - Update JWT token
   - Adjust screenshot interval
   - Adjust idle threshold

### System Tray

The app runs in your system tray (notification area):

- **Right-click** the tray icon to:
  - Start/Stop Tracking
  - Show Window
  - Quit

- **Left-click** the tray icon to show the main window

### What Gets Tracked

#### 1. Active Window Detection
- **What**: Detects which application you're currently using
- **Frequency**: Every 60 seconds (configurable)
- **Data Sent**: App name (e.g., "VS Code", "Chrome", "Slack")
- **Example**: 
  ```json
  {
    "activity_type": "active",
    "duration_seconds": 60,
    "app_name": "VS Code",
    "url": "file:///path/to/file.rb"
  }
  ```

#### 2. Screenshot Metadata
- **What**: Records when screenshots would be taken
- **Frequency**: Every 5 minutes (configurable)
- **Data Sent**: Timestamp only (no images stored)
- **Example**:
  ```json
  {
    "timestamp": "2026-02-14T10:30:00Z"
  }
  ```

#### 3. Idle Detection
- **What**: Detects when you're not using keyboard/mouse
- **Threshold**: 5 minutes of inactivity (configurable)
- **How**: Monitors mouse movement and keyboard input
- **Result**: Marks activity as "idle" instead of "active"

#### 4. Input Tracking
- **What**: Monitors keyboard and mouse activity
- **Purpose**: Determines if user is active or idle
- **Privacy**: Only tracks activity, not what you type

## 🔄 Data Flow

```
Desktop App → API → Database
     ↓
1. Detects active window
2. Captures screenshot metadata
3. Monitors input activity
4. Detects idle state
     ↓
Sends to Rails API:
- POST /api/v1/sessions/:id/activity
- POST /api/v1/sessions/:id/screenshots
     ↓
Stored in Database:
- activity_logs table (with app_name)
- screenshots table (with timestamp)
```

## 🎯 Features in Action

### Active Window Tracking

The app continuously monitors which application is in focus:

```
Time    | Active App    | Status
--------|---------------|--------
10:00   | VS Code       | Active
10:01   | Chrome        | Active
10:02   | Slack         | Active
10:03   | VS Code       | Active
```

This data is sent to your API every 60 seconds.

### Screenshot Metadata

Every 5 minutes, the app records a screenshot timestamp:

```
10:00 - Screenshot timestamp recorded
10:05 - Screenshot timestamp recorded
10:10 - Screenshot timestamp recorded
```

**Note**: Only timestamps are stored, not actual images.

### Idle Detection

If you don't use keyboard/mouse for 5 minutes:

```
10:00 - Active (using VS Code)
10:01 - Active (using Chrome)
10:02 - Active (using Slack)
10:03 - No input detected
10:04 - No input detected
10:05 - IDLE (no activity for 5 minutes)
```

## 🔐 Permissions Required

### macOS

1. **Accessibility Permission** (Required)
   - System Preferences → Security & Privacy → Privacy → Accessibility
   - Enable "WorkPulse Desktop"
   - Restart the app after enabling

### Windows

- Usually works without special permissions
- May need to allow through Windows Defender

### Linux

- May require X11 access permissions
- Check your window manager settings

## 📊 Viewing Your Data

### In Web App

1. **Activity Logs**
   - Go to your dashboard
   - View activity summary
   - See which apps you used and for how long

2. **Screenshot Timeline**
   - Navigate to Screenshot Timeline
   - See when screenshots were captured
   - Filter by date

3. **Reports**
   - View productivity reports
   - See app usage statistics
   - Track time spent in different applications

## 🛠️ Troubleshooting

### App Won't Start

**Error**: `Cannot find module 'electron'`
```bash
# Solution: Install dependencies
cd desktop-app
npm install
```

### "No active session found"

**Problem**: App can't find an active work session

**Solution**:
1. Go to web app
2. Start a work session first
3. Then start tracking in desktop app

### Active Window Detection Not Working

**macOS**:
- Grant Accessibility permissions
- Restart the app

**Windows/Linux**:
- Check if you have proper permissions
- Try running as administrator (if needed)

### "Failed to log activity"

**Problem**: Can't connect to API

**Solutions**:
1. Check if Rails server is running (`rails server`)
2. Verify API URL in config.json
3. Check if JWT token is valid (not expired)
4. Check network connection

### Screenshot Capture Failing

**Problem**: Screenshots not being recorded

**Solutions**:
1. Check file system permissions
2. Verify screenshot directory is writable
3. Check console for error messages

## 🎨 Customization

### Change Tracking Intervals

Edit `src/config/config.json`:

```json
{
  "screenshotInterval": 600000,  // 10 minutes
  "idleThreshold": 600000,        // 10 minutes
  "activityInterval": 30000        // 30 seconds
}
```

### Change API URL

If your API is on a different server:

```json
{
  "apiUrl": "https://your-api-domain.com/api/v1"
}
```

## 📦 Building for Production

### Build for Your Platform

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Built applications will be in the `dist/` directory.

### Distribution

After building, you can:
- Share the installer with your team
- Deploy to multiple machines
- Create auto-update mechanism (future feature)

## 🔍 Monitoring

### Check if It's Working

1. **Check System Tray**
   - Icon should be visible
   - Right-click to see menu

2. **Check Main Window**
   - Status should show "Tracking: Active"
   - Session ID should be displayed

3. **Check Web App**
   - Activity logs should show app names
   - Screenshot timeline should show timestamps
   - Reports should show activity data

### Console Logs

The app logs important events:
- "Tracking started for session: X"
- "Logged activity: AppName (active) for 60s"
- "Screenshot captured at [timestamp]"
- "User is idle"

## 🚨 Important Notes

1. **Privacy**: 
   - Only app names are tracked, not content
   - Screenshots are NOT stored (only timestamps)
   - Keyboard input is monitored for activity, not content

2. **Performance**:
   - Minimal system impact
   - Runs in background
   - Low CPU/memory usage

3. **Security**:
   - JWT token is stored locally
   - All communication is with your API
   - No data sent to third parties

4. **Requirements**:
   - Must have active work session
   - Must have valid JWT token
   - Must have API connection

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify configuration is correct
3. Ensure Rails server is running
4. Check network connectivity
5. Verify JWT token is valid
