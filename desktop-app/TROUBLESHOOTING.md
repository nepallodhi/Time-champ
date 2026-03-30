# Troubleshooting Guide

## Common Errors and Solutions

### "Client network socket disconnected before secure TLS connection was established"

This error occurs when the desktop app cannot establish a secure HTTPS/TLS connection to the API server.

#### Possible Causes:

1. **Ngrok tunnel is down or unstable**
   - Ngrok tunnels can be interrupted or expire
   - Free ngrok tunnels may have connection limits

2. **Network connectivity issues**
   - Internet connection is unstable
   - Firewall blocking HTTPS connections
   - VPN or proxy interfering with connections

3. **SSL certificate issues**
   - Self-signed certificates
   - Expired certificates
   - Certificate chain issues

4. **API server not running**
   - Rails server is not started
   - Server crashed or stopped

#### Solutions:

**1. Check if ngrok tunnel is running:**
```bash
# Check ngrok status
curl https://your-ngrok-url.ngrok-free.dev/api/v1/health
```

**2. Restart ngrok tunnel:**
```bash
# Stop current ngrok
# Start new ngrok tunnel
ngrok http 3000
```

**3. Verify API server is running:**
```bash
# Check if Rails server is running
curl http://localhost:3000/api/v1/health
```

**4. Check network connection:**
- Verify internet connectivity
- Check firewall settings
- Disable VPN temporarily to test

**5. For development with ngrok (SSL certificate bypass):**

If you're using ngrok for development and experiencing certificate issues, you can temporarily bypass SSL verification:

**Option A: Set environment variable (recommended for development only)**
```bash
export SKIP_SSL_VERIFY=true
npm start
```

**Option B: Use HTTP instead of HTTPS (if ngrok supports it)**
Update `src/config/config.json`:
```json
{
  "apiUrl": "http://localhost:3000/api/v1"
}
```

**⚠️ WARNING**: Never use `SKIP_SSL_VERIFY=true` or HTTP in production!

**6. Check API URL configuration:**

Verify your `src/config/config.json` has the correct URL:
```json
{
  "apiUrl": "https://your-ngrok-url.ngrok-free.dev/api/v1",
  "token": "your-jwt-token"
}
```

**7. Verify JWT token is valid:**
- Token may have expired
- Get a new token from the web app
- Check token in browser DevTools → Local Storage

**8. Check timeout settings:**

The app now has a 30-second timeout for TLS handshake. If your connection is very slow, you may need to:
- Check your network speed
- Verify ngrok tunnel latency
- Consider using a different tunneling service

### "Failed to log activity"

**Problem**: Activity tracking is working but API calls are failing.

**Solutions**:
1. The app will continue tracking even if API calls fail
2. Check console logs for specific error messages
3. Verify API server is accessible
4. Check network connection stability

### "No active session found"

**Problem**: Desktop app can't find an active work session.

**Solutions**:
1. **Start a session in the web app first**
   - Go to WorkPulse web app
   - Select a project
   - Click "Start Session" or "Start Tracking"

2. Verify JWT token is correct and not expired

3. Check API URL is correct

### Connection Timeout Errors

**Problem**: Requests are timing out.

**Solutions**:
1. Check network speed and stability
2. Verify API server is responding
3. Check if ngrok tunnel has rate limits (free tier)
4. Consider using a paid ngrok plan for better stability

### SSL Certificate Errors

**Problem**: Certificate validation fails.

**Solutions**:
1. For development with ngrok, use `SKIP_SSL_VERIFY=true` (see above)
2. For production, ensure proper SSL certificates are configured
3. Check certificate expiration dates
4. Verify certificate chain is complete

## Debugging Tips

### Enable Verbose Logging

The app logs all connection attempts and errors to the console. Check the console output for:
- Connection errors
- TLS handshake failures
- Timeout messages
- API response errors

### Test API Connection Manually

```bash
# Test with curl
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-ngrok-url.ngrok-free.dev/api/v1/sessions/active
```

### Check Network Connectivity

```bash
# Ping test
ping your-ngrok-url.ngrok-free.dev

# DNS resolution
nslookup your-ngrok-url.ngrok-free.dev
```

### Monitor Network Traffic

Use network monitoring tools to see:
- If connections are being established
- Where connections are failing
- TLS handshake progress

## Getting Help

If you continue to experience issues:

1. **Check the console logs** for detailed error messages
2. **Verify all prerequisites** are met:
   - API server is running
   - Ngrok tunnel is active (if using ngrok)
   - JWT token is valid
   - Network connection is stable

3. **Try switching to localhost** (if API is on same machine):
   ```json
   {
     "apiUrl": "http://localhost:3000/api/v1"
   }
   ```

4. **Check ngrok status page** (if using ngrok):
   - Visit: http://localhost:4040 (ngrok web interface)
   - Check request logs
   - Verify tunnel is active

## Recent Improvements

The app has been updated with:
- ✅ Better TLS/SSL error handling
- ✅ Automatic retry with exponential backoff
- ✅ Increased connection timeout (30 seconds)
- ✅ Graceful error handling (tracking continues even if API calls fail)
- ✅ More detailed error messages
- ✅ Support for SSL certificate bypass in development
