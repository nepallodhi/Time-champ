# Ngrok Configuration

The frontend is now configured to use your ngrok URL for API and WebSocket connections.

## Current Configuration

- **API URL**: `https://eddy-sane-senatorially.ngrok-free.dev/api/v1`
- **WebSocket URL**: `wss://eddy-sane-senatorially.ngrok-free.dev/cable`

## Environment Variables

The `.env` file has been updated with:
```
VITE_API_URL=https://eddy-sane-senatorially.ngrok-free.dev/api/v1
VITE_WS_URL=wss://eddy-sane-senatorially.ngrok-free.dev/cable
```

## Important Notes

### 1. Restart Dev Server

After updating environment variables, you need to **restart the dev server** for changes to take effect:

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Ngrok Browser Warning

If you see ngrok's browser warning page, you may need to:
- Click "Visit Site" to proceed
- Or add the `ngrok-skip-browser-warning` header (handled automatically by the API client)

### 3. CORS Configuration

Make sure your Rails backend has CORS configured to allow requests from your frontend origin (e.g., `http://localhost:5173`).

### 4. WebSocket Connection

The WebSocket connection uses `wss://` (secure WebSocket) since ngrok uses HTTPS. The token is passed as a query parameter: `?token=YOUR_JWT_TOKEN`

## Testing the Connection

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser: `http://localhost:5173`

3. Try logging in - the API calls should go to your ngrok URL

4. Check the browser console for WebSocket connection status

## Troubleshooting

### API calls failing?

- Check that your ngrok tunnel is running
- Verify the ngrok URL is correct
- Check browser console for CORS errors
- Ensure Rails backend CORS allows your frontend origin

### WebSocket not connecting?

- Verify the WebSocket URL uses `wss://` (not `ws://`)
- Check that the token is being passed correctly
- Look for errors in browser console
- Check Rails logs for ActionCable connection errors

### Need to switch back to localhost?

Update `.env`:
```
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000/cable
```

Then restart the dev server.
