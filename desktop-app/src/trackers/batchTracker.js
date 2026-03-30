const crypto = require('crypto');

class BatchTracker {
    constructor(apiClient, sessionId, activityTracker, inputTracker, idleTracker, screenshotTracker) {
        this.apiClient = apiClient;
        this.sessionId = sessionId;
        this.activityTracker = activityTracker;
        this.inputTracker = inputTracker;
        this.idleTracker = idleTracker;
        this.screenshotTracker = screenshotTracker;

        this.batchInterval = 60000; // 1 minute
        this.interval = null;
        this.isTracking = false;

        // Store minutes data
        this.aggregatedData = [];
        this.currentMinute = null;

        // Last successful sync
        this.lastSyncTime = Date.now();
    }

    start() {
        console.log('Batch tracker started');
        this.isTracking = true;

        // Initialize first minute
        this.startNewMinute();

        // Start periodic sync (check every 5 seconds if minute is complete)
        this.interval = setInterval(() => {
            this.checkAndSync();
        }, 5000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        // Sync remaining data
        if (this.isTracking) {
            this.finalizeCurrentMinute();
            this.syncBatch();
        }

        this.isTracking = false;
        console.log('Batch tracker stopped');
    }

    startNewMinute() {
        const now = new Date();
        // Align to nearest minute start if possible, or just use current time
        this.currentMinute = {
            id: crypto.randomUUID(), // Generate a unique ID for this minute
            fullTimestamp: now.toISOString(),
            activeSeconds: 0,
            idleSeconds: 0,
            keyboardEvents: 0,
            mouseEvents: 0,
            activeWindowTitle: '',
            windowTitles: {},
            activeUrl: '', // Allow specific URL tracking if available
            status: 'Active',
            startTime: Date.now()
        };
    }

    checkAndSync() {
        const now = Date.now();

        // Update current minute data
        this.updateCurrentMinute(now);

        // Check if minute is complete (60 seconds passed)
        if (now - this.currentMinute.startTime >= 60000) {
            this.finalizeCurrentMinute();
            this.startNewMinute();

            // Sync to server
            this.syncBatch();
        }
    }

    updateCurrentMinute(now) {
        // 1. Get Active/Idle status
        const idleStatus = this.idleTracker.getIdleStatus();
        const timeDiff = (now - (this.lastUpdate || this.currentMinute.startTime)) / 1000; // Seconds since last check
        this.lastUpdate = now;

        if (timeDiff <= 0) return;

        if (idleStatus.isIdle) {
            this.currentMinute.idleSeconds += timeDiff;
            this.currentMinute.status = 'Idle';
        } else {
            this.currentMinute.activeSeconds += timeDiff;
            this.currentMinute.status = 'Active';
        }

        // 2. Get Window Info
        const windowInfo = this.activityTracker.getCurrentWindow();
        if (windowInfo.appName) {
            // Update most recent window
            this.currentMinute.activeWindowTitle = windowInfo.appName;

            // Track time per window (approximate based on sampling)
            const windowKey = windowInfo.appName + (windowInfo.title ? ` - ${windowInfo.title}` : '');
            if (!this.currentMinute.windowTitles[windowKey]) {
                this.currentMinute.windowTitles[windowKey] = 0;
            }
            this.currentMinute.windowTitles[windowKey] += timeDiff;
        }

        // 3. Get Input Events
        // We'll collect these at the end of the minute accurately, 
        // but for real-time we could sample. For now, let's just do it at finalize.
    }

    finalizeCurrentMinute() {
        // Collect accumulated events
        const events = this.inputTracker.getAndResetEvents();
        this.currentMinute.keyboardEvents = events.keyboard;
        this.currentMinute.mouseEvents = events.mouse;

        // Check for screenshot
        // We can ask the screenshot tracker if it has a recent screenshot,
        // or we can trigger one if needed.
        // For now, let's assume the screenshot tracker handles its own intervals
        // and we just link if possible, or we trigger one here.

        // Optimization: Add screenshot directly to batch if available
        // For this implementation, we will let the standalone screenshot tracker handle it separately
        // OR we could integrate it here. Let's keep it simple for now and just send activity data.

        // Add to aggregated data
        this.aggregatedData.push(this.currentMinute);

        console.log(`Finalized minute: ${this.currentMinute.activeSeconds.toFixed(1)}s active, ${this.currentMinute.idleSeconds.toFixed(1)}s idle`);
    }

    async syncBatch() {
        if (this.aggregatedData.length === 0) return;

        const dataToSend = [...this.aggregatedData];
        this.aggregatedData = []; // Clear buffer

        try {
            const payload = {
                sessionId: this.sessionId,
                timestamp: new Date().toISOString(),
                totalMinutes: dataToSend.length,
                aggregatedData: dataToSend
            };

            console.log(`Syncing batch with ${dataToSend.length} minutes...`);
            await this.apiClient.batchActivity(this.sessionId, payload);
            this.lastSyncTime = Date.now();
            console.log('Batch sync successful');
        } catch (error) {
            console.error('Batch sync failed:', error.message);
            // Put data back in buffer to retry next time
            this.aggregatedData = [...dataToSend, ...this.aggregatedData];
        }
    }
}

module.exports = { BatchTracker };
