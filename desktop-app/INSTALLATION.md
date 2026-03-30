# Installation Guide

## Prerequisites

- Node.js 16+ and npm
- An active WorkPulse account with JWT token
- An active work session (started from web app)

## Step-by-Step Installation

### 1. Install Dependencies

```bash
cd desktop-app
npm install
```

**Note**: Some dependencies require native compilation:
- `active-win` - Cross-platform active window detection
- `robotjs` - Input tracking (optional, has fallback)
- `screenshot-desktop` - Screenshot capture

If you encounter compilation errors:
- **Windows**: Install Visual Studio Build Tools
- **macOS**: Install Xcode Command Line Tools: `xcode-select --install`
- **Linux**: Install build-essential: `sudo apt-get install build-essential`

### 2. Configure the App

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

**To get your JWT token:**
1. Log in to the WorkPulse web app
2. Open browser DevTools → Application/Storage → Local Storage
3. Find the `token` key and copy its value

### 3. Start the App

```bash
npm start
```

Or for development mode:
```bash
npm run dev
```

### 4. Grant Permissions (macOS)

On macOS, you'll need to grant Accessibility permissions:

1. Open System Preferences → Security & Privacy → Privacy
2. Select "Accessibility" from the left sidebar
3. Click the lock icon and enter your password
4. Find "WorkPulse Desktop" in the list and enable it
5. Restart the app if needed

### 5. Start Tracking

1. Make sure you have an active work session (start from web app)
2. Click "Start Tracking" in the desktop app
3. The app will run in the system tray

## Troubleshooting

### "No active session found"
- Start a work session from the web app first
- Make sure your JWT token is correct

### "Failed to log activity"
- Check your API URL is correct
- Verify your JWT token hasn't expired
- Ensure the Rails server is running

### Active window detection not working (macOS)
- Grant Accessibility permissions (see step 4)
- Restart the app after granting permissions

### Screenshot capture not working
- Check file system permissions
- Verify screenshot directory is writable

## Building for Production

### Windows
```bash
npm run build:win
```

### macOS
```bash
npm run build:mac
```

### Linux
```bash
npm run build:linux
```

Built applications will be in the `dist/` directory.
