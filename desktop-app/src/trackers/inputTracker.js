// Note: robotjs requires native compilation and may have issues on some platforms
// This is a simplified version that tracks mouse/keyboard activity
// For production, consider using platform-specific libraries

class InputTracker {
  constructor() {
    this.activityCallbacks = [];
    this.lastMousePosition = { x: 0, y: 0 };
    this.mouseCheckInterval = null;
    this.keyboardListeners = [];
    this.keyboardEvents = 0;
    this.mouseEvents = 0;
  }

  start() {
    console.log('Input tracker started');

    // Track mouse movement (check position changes)
    this.mouseCheckInterval = setInterval(() => {
      this.checkMouseActivity();
    }, 1000); // Check every second

    // Try to use robotjs if available (requires native compilation)
    let robotjsAvailable = false;
    try {
      const robot = require('robotjs');
      robotjsAvailable = true;

      // Track mouse movement
      const originalGetMousePos = robot.getMousePos;
      let lastPos = originalGetMousePos();

      setInterval(() => {
        try {
          const currentPos = originalGetMousePos();
          if (currentPos.x !== lastPos.x || currentPos.y !== lastPos.y) {
            this.mouseEvents++;
            this.triggerActivity();
            lastPos = currentPos;
          }
        } catch (e) {
          // robotjs failed, fallback to Electron method
          if (robotjsAvailable) {
            console.log('robotjs error, switching to fallback');
            robotjsAvailable = false;
            this.setupElectronMouseTracking();
          }
        }
      }, 500);
    } catch (error) {
      console.log('robotjs not available, using fallback tracking');
      // Fallback: Use Electron's screen API to detect mouse position changes
      this.setupElectronMouseTracking();
    }

    // If robotjs wasn't available, use Electron fallback
    if (!robotjsAvailable) {
      this.setupElectronMouseTracking();
    }
  }

  setupElectronMouseTracking() {
    // Fallback method using Electron's screen API
    // This is less accurate but doesn't require native compilation
    const { screen } = require('electron');

    setInterval(() => {
      const point = screen.getCursorScreenPoint();
      if (point.x !== this.lastMousePosition.x || point.y !== this.lastMousePosition.y) {
        this.lastMousePosition = point;
        this.mouseEvents++;
        this.triggerActivity();
      }
    }, 1000);
  }

  checkMouseActivity() {
    // This is a placeholder - actual implementation would use platform-specific APIs
    // For now, we'll rely on the activity tracker detecting window changes
  }

  onActivity(callback) {
    this.activityCallbacks.push(callback);
  }

  triggerActivity() {
    this.activityCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in activity callback:', error);
      }
    });
  }

  stop() {
    if (this.mouseCheckInterval) {
      clearInterval(this.mouseCheckInterval);
      this.mouseCheckInterval = null;
    }
    console.log('Input tracker stopped');
  }

  getActivityStats() {
    return {
      lastMousePosition: this.lastMousePosition,
      isTracking: this.mouseCheckInterval !== null
    };
  }

  getAndResetEvents() {
    const events = {
      keyboard: this.keyboardEvents || 0,
      mouse: this.mouseEvents || 0
    };
    this.keyboardEvents = 0;
    this.mouseEvents = 0;
    return events;
  }
}

module.exports = { InputTracker };
