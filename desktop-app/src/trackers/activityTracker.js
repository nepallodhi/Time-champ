let activeWin;
try {
  activeWin = require('active-win');
} catch (error) {
  console.warn('active-win not available, will use fallback');
  activeWin = null;
}

class ActivityTracker {
  constructor(apiClient, sessionId) {
    this.apiClient = apiClient;
    this.sessionId = sessionId;
    this.interval = null;
    this.trackingInterval = 60000; // 60 seconds
    this.lastActivity = {
      appName: null,
      timestamp: Date.now(),
      duration: 0
    };
  }

  start() {
    console.log('Activity tracker started');
    this.interval = setInterval(() => {
      this.trackActivity();
    }, this.trackingInterval);

    // Track immediately
    this.trackActivity();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log('Activity tracker stopped');
  }

  async trackActivity() {
    try {
      let window;
      if (activeWin) {
        try {
          window = await activeWin();
        } catch (error) {
          console.warn('active-win error, using fallback:', error.message);
          window = { owner: { name: 'Unknown' }, title: '' };
        }
      } else {
        // Fallback: Use a generic app name when active-win is not available
        window = { owner: { name: 'Browser' }, title: document?.title || 'Unknown' };
      }

      const now = Date.now();
      const duration = Math.floor((now - this.lastActivity.timestamp) / 1000);

      if (duration > 0) {
        const appName = window ? window.owner.name : 'Unknown';
        const windowTitle = window ? window.title : '';

        // Determine activity type based on app name
        const activityType = this.isIdleApp(appName) ? 'idle' : 'active';

        // Log activity (with error handling to prevent tracking from stopping)
        try {
          await this.apiClient.logActivity(this.sessionId, {
            activity_type: activityType,
            duration_seconds: duration,
            app_name: appName,
            url: windowTitle,
            timestamp: new Date(this.lastActivity.timestamp).toISOString()
          });

          console.log(`Logged activity: ${appName} (${activityType}) for ${duration}s`);
        } catch (error) {
          // Log error but continue tracking
          console.error('Failed to log activity (continuing tracking):', error.message || error);
          // Don't throw - allow tracking to continue even if API calls fail
        }
      }

      // Update last activity
      this.lastActivity = {
        appName: window ? window.owner.name : null,
        title: window ? window.title : '',
        timestamp: now,
        duration: 0
      };
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  isIdleApp(appName) {
    // Consider certain apps as idle (e.g., screen savers, lock screens)
    const idleApps = ['ScreenSaverEngine', 'loginwindow', 'Lock Screen'];
    return idleApps.includes(appName);
  }

  getCurrentWindow() {
    return {
      appName: this.lastActivity.appName || 'Unknown',
      title: this.lastActivity.url || this.lastActivity.title || ''
    };
  }
}

module.exports = { ActivityTracker };
