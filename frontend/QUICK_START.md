# Quick Start Guide

## ⚠️ IMPORTANT: Node.js Version

**You MUST use Node.js 18 or higher.** Node.js 14 will NOT work.

## Quick Fix for Current Session

Run these commands in your terminal:

```bash
cd frontend
source ~/.nvm/nvm.sh  # Load nvm
nvm use 18             # Switch to Node 18
npm run dev            # Start dev server
```

## Permanent Solution

### Option 1: Set Node 18 as Default (Recommended)

```bash
nvm install 18
nvm alias default 18
nvm use default
```

Now every new terminal will use Node 18.

### Option 2: Use the Helper Script

```bash
cd frontend
./dev.sh
```

This script automatically checks and switches to Node 18.

### Option 3: Auto-load nvm in Your Shell

Add this to your `~/.bashrc` or `~/.zshrc`:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # Load nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # Load nvm bash_completion
```

Then restart your terminal or run:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

## Verify It's Working

```bash
node --version  # Should show v18.x.x or higher
npm run dev     # Should start without errors
```

## Troubleshooting

### Still seeing "Unexpected token '??='" error?

1. Check your Node version: `node --version`
2. If it's v14 or lower, switch to Node 18: `nvm use 18`
3. Verify: `node --version` should show v18.x.x
4. Try again: `npm run dev`

### nvm command not found?

Make sure nvm is loaded:
```bash
source ~/.nvm/nvm.sh
```

Or install nvm if you don't have it:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```
