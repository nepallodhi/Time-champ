const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { ActivityTracker } = require('./trackers/activityTracker');
const { ScreenshotTracker } = require('./trackers/screenshotTracker');
const { IdleTracker } = require('./trackers/idleTracker');
const { InputTracker } = require('./trackers/inputTracker');
const { BatchTracker } = require('./trackers/batchTracker');
const { ApiClient } = require('./api/client');

let mainWindow;
let tray;
let activityTracker;
let screenshotTracker;
let idleTracker;
let inputTracker;
let batchTracker;
let apiClient;
let isTracking = false;
let currentSession = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    // icon: path.join(__dirname, '../assets/icon.png'), // Optional icon
    show: true // Show window on startup
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // Hide window instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Create tray icon
  createTray();
}

function createTray() {
  let icon;
  try {
    const iconPath = path.join(__dirname, '../assets/icon.png');
    icon = nativeImage.createFromPath(iconPath);
    // If icon doesn't exist, create a simple one
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
  } catch (error) {
    // Create a simple colored icon if file doesn't exist
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: isTracking ? 'Stop Tracking' : 'Start Tracking',
      click: () => {
        if (isTracking) {
          stopTracking();
        } else {
          startTracking();
        }
      }
    },
    {
      label: 'Show Window',
      click: () => {
        mainWindow.show();
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('WorkPulse Desktop Tracker');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Also show window on double-click
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

let lastNoSessionWarning = 0;
const NO_SESSION_WARNING_INTERVAL = 30000; // Only show warning once per 30 seconds

async function startTracking() {
  if (isTracking) return;

  try {
    // Initialize API client
    const config = require('./config/config.json');
    apiClient = new ApiClient(config.apiUrl, config.token);

    // Get or start active session with better error handling
    let sessionData;
    // Retry finding session for a few seconds (in case user just started it)
    for (let i = 0; i < 5; i++) {
      try {
        sessionData = await apiClient.getActiveSession();
        if (sessionData && sessionData.session) break;
      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error.message);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // If no active session, try to start one
    if (!sessionData || !sessionData.session) {
      console.log('No active session found. Attempting to start a new session...');
      try {
        await apiClient.startSession();
        // Wait a bit for propagation
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Retry getting session
        sessionData = await apiClient.getActiveSession();
      } catch (startError) {
        console.error('Failed to auto-start session:', startError.message);
      }
    }

    if (!sessionData || !sessionData.session) {
      const now = Date.now();
      // Only log warning if enough time has passed since last warning
      if (now - lastNoSessionWarning > NO_SESSION_WARNING_INTERVAL) {
        console.log('No active session found. Please start a session from the web app.');
        lastNoSessionWarning = now;
      }

      if (mainWindow && !mainWindow.isDestroyed()) {
        const apiUrl = config.apiUrl || 'unknown';
        mainWindow.webContents.send('tracking-error', {
          type: 'no-session',
          message: `Failed to auto-start session.\n\n1. Go to Web Dashboard\n2. Start a project manually.\n3. Check API URL: ${apiUrl}`
        });
      }
      return;
    }

    currentSession = sessionData.session;
    isTracking = true;

    // Initialize trackers
    const noopClient = { logActivity: async () => { } };
    activityTracker = new ActivityTracker(noopClient, currentSession.id);
    screenshotTracker = new ScreenshotTracker(apiClient, currentSession.id, config.screenshotInterval || 300000); // 5 min default
    idleTracker = new IdleTracker(config.idleThreshold || 300000); // 5 min default
    inputTracker = new InputTracker();

    // Initialize BatchTracker with real client
    batchTracker = new BatchTracker(apiClient, currentSession.id, activityTracker, inputTracker, idleTracker, screenshotTracker);

    // Start tracking
    activityTracker.start();
    screenshotTracker.start();
    idleTracker.start();
    inputTracker.start();
    batchTracker.start();

    // Update tray menu
    updateTrayMenu();

    console.log('Tracking started for session:', currentSession.id);

    // Notify renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('tracking-update', { isTracking: true, session: currentSession });
    }
  } catch (error) {
    console.error('Failed to start tracking:', error.message || error);
    console.error('Full error:', error);
  }
}

function stopTracking() {
  if (!isTracking) return;

  // Stop all trackers
  if (activityTracker) activityTracker.stop();
  if (screenshotTracker) screenshotTracker.stop();
  if (idleTracker) idleTracker.stop();
  if (inputTracker) inputTracker.stop();
  if (batchTracker) batchTracker.stop();

  isTracking = false;
  currentSession = null;

  // Update tray menu
  updateTrayMenu();

  console.log('Tracking stopped');

  // Notify renderer
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('tracking-update', { isTracking: false, session: null });
  }
}

function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: isTracking ? 'Stop Tracking' : 'Start Tracking',
      click: () => {
        if (isTracking) {
          stopTracking();
        } else {
          startTracking();
        }
      }
    },
    {
      label: 'Show Window',
      click: () => {
        mainWindow.show();
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

// IPC handlers
ipcMain.handle('start-tracking', async () => {
  await startTracking();
  return { success: true };
});

ipcMain.handle('stop-tracking', () => {
  stopTracking();
  return { success: true };
});

ipcMain.handle('get-tracking-status', () => {
  return { isTracking, session: currentSession };
});

ipcMain.handle('get-config', () => {
  try {
    const config = require('./config/config.json');
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-config', async (event, config) => {
  const fs = require('fs');
  const configPath = path.join(__dirname, 'config/config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return { success: true };
});

ipcMain.handle('get-dashboard-statistics', async () => {
  try {
    const config = require('./config/config.json');
    if (!config.apiUrl || !config.token) {
      return { success: false, error: 'API URL or token not configured' };
    }

    // Create a temporary API client if one doesn't exist
    const client = apiClient || new ApiClient(config.apiUrl, config.token);
    const statistics = await client.getDashboardStatistics();
    return { success: true, statistics };
  } catch (error) {
    // Handle 403 (Forbidden) - user is not manager/admin
    if (error.response && error.response.status === 403) {
      return { success: true, statistics: null };
    }
    return { success: false, error: error.message || 'Failed to fetch statistics' };
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Don't quit on window close, keep running in background
  if (process.platform !== 'darwin') {
    // On macOS, keep app running even when all windows are closed
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  stopTracking();
});
