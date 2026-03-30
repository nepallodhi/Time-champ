const axios = require('axios');
const https = require('https');

class ApiClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl || 'http://localhost:3000/api/v1';
    this.token = token;

    // Validate token
    if (!this.token) {
      console.warn('Warning: No authentication token provided. API requests will fail.');
    }

    // Check if URL is HTTPS (for ngrok or production)
    const isHttps = this.baseUrl.startsWith('https://');

    // Create axios instance with proper TLS handling
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : undefined,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true' // Skip ngrok browser warning page
      },
      timeout: 30000, // Increased timeout for TLS handshake
      // For HTTPS connections, configure TLS options
      ...(isHttps && {
        httpsAgent: new https.Agent({
          keepAlive: true,
          // For development with ngrok, we may need to handle certificate issues
          // In production, you should use proper certificates
          rejectUnauthorized: process.env.NODE_ENV !== 'development' || process.env.SKIP_SSL_VERIFY !== 'true'
        })
      }),
      // Add retry configuration
      maxRedirects: 5,
      validateStatus: function (status) {
        return status < 500; // Don't throw for 4xx errors
      }
    });

    // Add request interceptor for better error handling
    this.client.interceptors.request.use(
      (config) => {
        // Ensure Authorization header is set on every request
        if (this.token && !config.headers['Authorization']) {
          config.headers['Authorization'] = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Handle TLS/SSL connection errors
        const errorMessage = error.message || '';
        const errorCode = error.code || '';

        if (errorCode === 'ECONNRESET' ||
          errorCode === 'ETIMEDOUT' ||
          errorCode === 'ECONNREFUSED' ||
          errorCode === 'ENOTFOUND' ||
          errorCode === 'ECONNABORTED' ||
          errorMessage.includes('socket disconnected') ||
          errorMessage.includes('Client network socket disconnected') ||
          errorMessage.includes('TLS') ||
          errorMessage.includes('SSL') ||
          errorMessage.includes('secure TLS connection')) {
          console.error('Connection error:', errorCode || errorMessage);
          console.error('Full error details:', {
            code: errorCode,
            message: errorMessage,
            config: error.config ? {
              url: error.config.url,
              baseURL: error.config.baseURL,
              method: error.config.method
            } : null
          });

          // Provide specific guidance based on error
          let guidance = 'Please check your internet connection and API server.';
          if (errorMessage.includes('TLS') || errorMessage.includes('SSL') || errorMessage.includes('secure')) {
            guidance = 'TLS/SSL connection failed. If using ngrok, try: export SKIP_SSL_VERIFY=true';
          } else if (errorCode === 'ECONNREFUSED') {
            guidance = 'Connection refused. Is the API server running?';
          } else if (errorCode === 'ENOTFOUND') {
            guidance = 'DNS lookup failed. Check your API URL.';
          }

          throw new Error(`Network connection failed: ${errorMessage || errorCode}. ${guidance}`);
        }

        // Handle certificate errors
        if (error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
          error.code === 'CERT_HAS_EXPIRED' ||
          error.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
          console.error('SSL certificate error:', error.code);
          throw new Error(`SSL certificate error: ${error.code}. If using ngrok, the certificate may need verification.`);
        }

        return Promise.reject(error);
      }
    );
  }

  // Retry wrapper for API calls
  async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        // Don't retry on 4xx errors (client errors)
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          throw error;
        }

        // Don't retry on certain connection errors that won't be fixed by retrying
        if (error.code === 'ECONNREFUSED' && i === 0) {
          // If connection refused, don't retry immediately
          throw error;
        }

        if (i < maxRetries - 1) {
          const waitTime = delay * Math.pow(2, i); // Exponential backoff
          console.log(`Request failed, retrying in ${waitTime}ms... (attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    throw lastError;
  }

  async getActiveSession() {
    return this.retryRequest(async () => {
      try {
        const response = await this.client.get('/sessions/active');
        if (response.status === 404) {
          return { session: null };
        }
        return response.data;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return { session: null };
        }
        throw error;
      }
    });
  }

  async startSession(projectId = null) {
    return this.retryRequest(async () => {
      try {
        const payload = projectId ? { project_id: projectId } : {};
        const response = await this.client.post('/sessions/start', payload);
        return response.data;
      } catch (error) {
        throw error;
      }
    });
  }

  async logActivity(sessionId, activityData) {
    return this.retryRequest(async () => {
      try {
        const response = await this.client.post(`/sessions/${sessionId}/activity`, activityData);
        return response.data;
      } catch (error) {
        // Log error but don't throw for activity logging (non-critical)
        if (error.response) {
          console.error('Failed to log activity:', error.response.status, error.response.data);
        } else {
          console.error('Failed to log activity:', error.message || error.code);
        }
        // Still throw to allow retry mechanism
        throw error;
      }
    }, 2); // Fewer retries for activity logging
  }

  async createScreenshot(sessionId, timestamp) {
    return this.retryRequest(async () => {
      try {
        const response = await this.client.post(`/sessions/${sessionId}/screenshots`, {
          timestamp: timestamp
        });
        return response.data;
      } catch (error) {
        // Log error but don't throw for screenshot logging (non-critical)
        if (error.response) {
          console.error('Failed to create screenshot record:', error.response.status, error.response.data);
        } else {
          console.error('Failed to create screenshot record:', error.message || error.code);
        }
        // Still throw to allow retry mechanism
        throw error;
      }
    }, 2); // Fewer retries for screenshot logging
  }

  async getDashboardStatistics() {
    return this.retryRequest(async () => {
      try {
        const response = await this.client.get('/dashboard/statistics');
        return response.data;
      } catch (error) {
        // Handle 403 (Forbidden) - user is not manager/admin
        if (error.response && error.response.status === 403) {
          return null; // Return null to indicate user doesn't have access
        }
        throw error;
      }
    });
  }

  async batchActivity(sessionId, batchData) {
    return this.retryRequest(async () => {
      try {
        const response = await this.client.post(`/sessions/${sessionId}/batch_activity`, batchData);
        return response.data;
      } catch (error) {
        // Log error details for debugging
        if (error.response) {
          console.error('[BACKEND] Failed to sync batch:', error.response.status, error.response.data);
          // If 401, provide helpful error message
          if (error.response.status === 401) {
            throw new Error('Authentication failed. Please check your JWT token in config.json');
          }
        } else {
          console.error('[BACKEND] Failed to sync batch:', error.message || error.code);
        }
        throw error;
      }
    }, 2); // Fewer retries for batch activity
  }
}

module.exports = { ApiClient };
