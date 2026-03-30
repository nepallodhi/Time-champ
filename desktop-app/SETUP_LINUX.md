# Linux Setup Guide

## System Dependencies

If you encounter compilation errors with native modules, install these dependencies:

```bash
sudo apt-get update
sudo apt-get install -y \
  build-essential \
  libpng-dev \
  libxtst-dev \
  python3-dev \
  libx11-dev \
  libxrandr-dev
```

## Installation Without Native Modules

The app is designed to work **without** native modules if they fail to compile:

1. **active-win** (optional) - Falls back to generic app name
2. **robotjs** (optional) - Falls back to Electron screen API
3. **screenshot-desktop** (optional) - Still sends metadata timestamps

### Install Dependencies

```bash
cd desktop-app
npm install --ignore-scripts
```

This will skip native compilation and the app will use fallbacks.

### Run the App

```bash
npm start
```

The app will work with reduced functionality:
- ✅ Activity tracking (with generic app names)
- ✅ Screenshot metadata (timestamps only)
- ✅ Idle detection (using Electron APIs)
- ⚠️ Active window detection may show "Unknown" or "Browser"

## Full Installation (With Native Modules)

If you want full functionality, install system dependencies first:

```bash
sudo apt-get update
sudo apt-get install -y build-essential libpng-dev libxtst-dev python3-dev
cd desktop-app
npm install
```

## Troubleshooting

### "Cannot find module 'active-win'"
→ The app will use fallback mode (generic app names)

### "Cannot find module 'robotjs'"
→ The app will use Electron's screen API for mouse tracking

### "Cannot find module 'screenshot-desktop'"
→ Screenshot metadata will still be sent (timestamps only)

### All modules missing?
→ The app will still work but with limited functionality:
- Activity tracking will work (with generic names)
- Screenshot metadata will work
- Idle detection will work
