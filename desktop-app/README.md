# WorkPulse Desktop Tracker

Electron desktop application for tracking:
- **Active Window Detection** - Tracks which application is currently active
- **Screenshot Capture** - Captures screenshots at configurable intervals (metadata only, no images stored)
- **Idle Detection** - Detects when user is idle based on mouse/keyboard inactivity
- **Key/Mouse Tracking** - Monitors keyboard and mouse activity

## Features

- 🖥️ **Active Window Tracking** - Automatically detects the active application
- 📸 **Screenshot Metadata** - Records screenshot timestamps (no images stored)
- ⏸️ **Idle Detection** - Detects user inactivity
- ⌨️ **Input Tracking** - Monitors keyboard and mouse activity
- 🔄 **Auto-sync** - Sends data to WorkPulse API automatically
- 🎯 **System Tray** - Runs in background with system tray icon

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure the app:
   - Edit `src/config/config.json`
   - Set your API URL and JWT token
   - Configure screenshot interval and idle threshold

## Usage

### Development

```bash
npm run dev
```

### Production Build

```bash
# Build for current platform
npm run build

# Build for specific platform
npm run build:win
npm run build:mac
npm run build:linux
```

## Configuration

Edit `src/config/config.json`:

```json
{
  "apiUrl": "http://localhost:3000/api/v1",
  "token": "your-jwt-token-here",
  "screenshotInterval": 300000,
  "idleThreshold": 300000,
  "activityInterval": 60000
}
```

## Permissions

### macOS
- **Accessibility Permission**: Required for active window detection and input tracking
  - Go to System Preferences → Security & Privacy → Privacy → Accessibility
  - Enable WorkPulse Desktop

### Windows
- Usually works without special permissions

### Linux
- May require X11 access permissions

## API Integration

The app integrates with WorkPulse API endpoints:

- `GET /api/v1/sessions/active` - Get active session
- `POST /api/v1/sessions/:id/activity` - Log activity with app name
- `POST /api/v1/sessions/:id/screenshots` - Create screenshot metadata

## Architecture

```
desktop-app/
├── src/
│   ├── main.js              # Electron main process
│   ├── api/
│   │   └── client.js        # API client
│   ├── trackers/
│   │   ├── activityTracker.js    # Active window tracking
│   │   ├── screenshotTracker.js  # Screenshot capture
│   │   ├── idleTracker.js        # Idle detection
│   │   └── inputTracker.js       # Keyboard/mouse tracking
│   ├── config/
│   │   └── config.json      # Configuration
│   └── renderer/
│       └── index.html       # UI
└── package.json
```

## Notes

- Screenshots are captured but only metadata (timestamp) is sent to the API
- Images are not stored locally by default (can be enabled if needed)
- The app runs in the system tray and can be minimized
- Requires an active work session to be started from the web app
