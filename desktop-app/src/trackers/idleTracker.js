const { InputTracker } = require('./inputTracker');

class IdleTracker {
  constructor(threshold = 300000) {
    this.idleThreshold = threshold; // Default 5 minutes
    this.inputTracker = new InputTracker();
    this.lastActivityTime = Date.now();
    this.isIdle = false;
    this.checkInterval = null;
  }

  start() {
    console.log(`Idle tracker started (threshold: ${this.idleThreshold / 1000}s)`);
    
    // Track input activity
    this.inputTracker.onActivity(() => {
      this.lastActivityTime = Date.now();
      if (this.isIdle) {
        this.isIdle = false;
        console.log('User is now active');
      }
    });

    // Check idle status periodically
    this.checkInterval = setInterval(() => {
      this.checkIdleStatus();
    }, 10000); // Check every 10 seconds
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.inputTracker.stop();
    console.log('Idle tracker stopped');
  }

  checkIdleStatus() {
    const timeSinceLastActivity = Date.now() - this.lastActivityTime;
    
    if (timeSinceLastActivity >= this.idleThreshold && !this.isIdle) {
      this.isIdle = true;
      console.log(`User is idle (${Math.floor(timeSinceLastActivity / 1000)}s since last activity)`);
    } else if (timeSinceLastActivity < this.idleThreshold && this.isIdle) {
      this.isIdle = false;
      console.log('User is now active');
    }
  }

  getIdleStatus() {
    return {
      isIdle: this.isIdle,
      timeSinceLastActivity: Date.now() - this.lastActivityTime
    };
  }
}

module.exports = { IdleTracker };
