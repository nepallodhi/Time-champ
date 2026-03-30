let screenshot;
try {
  screenshot = require('screenshot-desktop');
} catch (error) {
  console.warn('screenshot-desktop not available');
  screenshot = null;
}
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class ScreenshotTracker {
  constructor(apiClient, sessionId, interval = 300000) {
    this.apiClient = apiClient;
    this.sessionId = sessionId;
    this.interval = null;
    this.trackingInterval = interval; // Default 5 minutes
    this.screenshotDir = path.join(app.getPath('userData'), 'screenshots');

    // Create screenshots directory if it doesn't exist
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  start() {
    console.log(`Screenshot tracker started (interval: ${this.trackingInterval / 1000}s)`);
    this.interval = setInterval(() => {
      this.captureScreenshot();
    }, this.trackingInterval);

    // Capture immediately
    this.captureScreenshot();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log('Screenshot tracker stopped');
  }

  async captureScreenshot() {
    try {
      const timestamp = new Date();
      const timestampStr = timestamp.toISOString();
      let imgBuffer = null;

      // 1. Try screenshot-desktop
      if (screenshot) {
        try {
          imgBuffer = await screenshot();
        } catch (error) {
          console.warn('Standard screenshot capture failed:', error.message);
        }
      }

      // 2. Fallback to gnome-screenshot (Linux) if standard failed
      if (!imgBuffer && process.platform === 'linux') {
        try {
          imgBuffer = await this.captureWithGnome();
          console.log('Captured with gnome-screenshot');
        } catch (error) {
          console.warn('Gnome screenshot capture failed:', error.message);
        }
      }

      if (imgBuffer) {
        // Create screenshot record via API
        // Note: The API client needs to handle the binary upload. 
        // For now, based on previous code, it seems we were sending metadata.
        // Let's modify ApiClient to actually upload the image if we have it.

        // Convert buffer to base64 for simple transfer (or upload as multipart)
        const base64Image = imgBuffer.toString('base64');

        await this.apiClient.createScreenshot(this.sessionId, timestampStr, base64Image);
        console.log(`Screenshot captured and sent at ${timestampStr}`);
      } else {
        // Metadata only fallback
        await this.apiClient.createScreenshot(this.sessionId, timestampStr);
        console.log(`Screenshot metadata (only) recorded at ${timestampStr}`);
      }
    } catch (error) {
      console.error('Error in screenshot capture:', error.message || error);
    }
  }

  async captureWithGnome() {
    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      const os = require('os');
      const tmpPath = path.join(app.getPath('temp'), `shot_${Date.now()}.png`);

      exec(`gnome-screenshot -f "${tmpPath}"`, (error) => {
        if (error) {
          return reject(error);
        }
        try {
          if (fs.existsSync(tmpPath)) {
            const buffer = fs.readFileSync(tmpPath);
            fs.unlinkSync(tmpPath);
            resolve(buffer);
          } else {
            reject(new Error('Screenshot file not created'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}

module.exports = { ScreenshotTracker };
