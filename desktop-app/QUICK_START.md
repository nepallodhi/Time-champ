# 🚀 Quick Start - Desktop Agent

## Step-by-Step Setup (5 minutes)

### 1️⃣ Install Dependencies

```bash
cd desktop-app
npm install
```

**Note**: This may take a few minutes as it compiles native modules.

### 2️⃣ Get Your JWT Token

**Method 1: From Browser DevTools**
1. Open WorkPulse web app in browser
2. Press `F12` (or Right-click → Inspect)
3. Go to **Application** tab → **Local Storage**
4. Find `token` key and copy the value

**Method 2: From Browser Console**
1. Open browser console (`F12`)
2. Type: `localStorage.getItem('token')`
3. Copy the returned value

### 3️⃣ Configure the App

Open `src/config/config.json` and update:

```json
{
  "apiUrl": "http://localhost:3000/api/v1",
  "token": "YOUR_JWT_TOKEN_HERE",
  "screenshotInterval": 300000,
  "idleThreshold": 300000,
  "activityInterval": 60000
}
```

**Replace `YOUR_JWT_TOKEN_HERE` with the token from step 2**

### 4️⃣ Start Work Session (Web App)

**⚠️ IMPORTANT**: You MUST do this first!

1. Open WorkPulse web app
2. Go to Dashboard
3. Select a project
4. Click **"Start Session"** or **"Start Tracking"**

### 5️⃣ Run Desktop App

```bash
npm start
```

### 6️⃣ Start Tracking

1. Desktop app window will open
2. Click **"Start Tracking"** button
3. App will minimize to system tray
4. Tracking is now active! 🎉

## 🎯 What Happens Next?

The app will automatically:

✅ **Every 60 seconds**: Log which app you're using  
✅ **Every 5 minutes**: Record screenshot timestamp  
✅ **Continuously**: Monitor keyboard/mouse activity  
✅ **When idle**: Mark you as idle after 5 minutes of inactivity  

## 📍 Where to See Your Data?

### In Web App:

1. **Dashboard** → See activity summary
2. **Activity Logs** → See which apps you used
3. **Screenshot Timeline** → See screenshot timestamps
4. **Reports** → See productivity analytics

## 🔍 Verify It's Working

1. **Check System Tray**: Look for WorkPulse icon
2. **Check Web App**: Activity logs should show app names
3. **Check Console**: Should see "Logged activity: [AppName]"

## 🛠️ Common Issues

### "No active session found"
→ Start a work session in web app first!

### "Failed to log activity"
→ Check if Rails server is running (`rails server`)

### Active window not detected (macOS)
→ Grant Accessibility permissions in System Preferences

## 📱 System Tray Menu

Right-click the tray icon to:
- Start/Stop Tracking
- Show Window
- Quit

## 🎨 Visual Guide

```
┌─────────────────────────────────┐
│   WorkPulse Desktop Tracker     │
├─────────────────────────────────┤
│  Status: [●] Tracking: Active   │
│                                 │
│  [Start Tracking] [Stop]        │
│                                 │
│  Session ID: 123                │
│  Status: Tracking               │
│                                 │
│  Configuration:                 │
│  API URL: http://localhost:3000 │
│  Token: ********                │
│  Screenshot: 5 min              │
│  Idle: 5 min                    │
└─────────────────────────────────┘
```

## 🔄 Workflow

```
1. Start Session (Web App)
   ↓
2. Start Desktop App
   ↓
3. Click "Start Tracking"
   ↓
4. App runs in background
   ↓
5. Data syncs to API
   ↓
6. View in Web App
```

## 💡 Tips

- **Keep it running**: Leave the app running in background
- **Check regularly**: View your activity in web app
- **Adjust intervals**: Edit config.json for different intervals
- **System tray**: App minimizes to tray, doesn't close

## 🚨 Important

- Desktop app requires an **active work session** from web app
- JWT token expires - you may need to update it
- App must have proper permissions (especially on macOS)
