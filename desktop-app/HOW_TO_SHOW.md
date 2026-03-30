# How to Show the Desktop Agent Window

## Method 1: Window Should Auto-Show

The window is now configured to show automatically when you run `npm start`.

If you don't see it:
- Check if it's behind other windows
- Look for the window in your taskbar/application switcher
- Try Alt+Tab (Linux) to switch between windows

## Method 2: System Tray Icon

The app runs in your system tray (notification area):

1. **Look for the tray icon** in your system tray/notification area
2. **Left-click** the icon → Shows the window
3. **Right-click** the icon → Shows menu:
   - Start/Stop Tracking
   - Show Window
   - Quit

## Method 3: Keyboard Shortcut

If the window is hidden:
- Press `Alt+Tab` to find it
- Or use your window manager's window switcher

## Method 4: Restart the App

If the window doesn't appear:

1. Stop the app (Ctrl+C in terminal or Quit from tray menu)
2. Restart:
   ```bash
   cd desktop-app
   npm start
   ```

The window should now appear automatically.

## Troubleshooting

### Window Not Visible?

1. **Check if app is running**:
   ```bash
   ps aux | grep electron
   ```

2. **Check system tray**:
   - Look in notification area
   - May be hidden behind "Show hidden icons"

3. **Force show window**:
   - Right-click tray icon → "Show Window"
   - Or left-click tray icon

### No Tray Icon?

- Some Linux desktop environments hide tray icons
- Check "Show hidden icons" or tray settings
- The app window should still be accessible via Alt+Tab

## Visual Guide

```
┌─────────────────────────────────┐
│   WorkPulse Desktop Tracker       │  ← Main Window
├─────────────────────────────────┤
│  Status: [●] Tracking: Active   │
│                                 │
│  [Start Tracking] [Stop]        │
│                                 │
│  Session ID: 123                │
│  Status: Tracking               │
└─────────────────────────────────┘
         ↑
         │
    System Tray
    (Click to show)
```

## Quick Access

**Fastest way to show window:**
1. Look for tray icon
2. Left-click it
3. Window appears!
