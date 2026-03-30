#!/bin/bash
# Helper script to run dev server with correct Node.js version

cd "$(dirname "$0")"

# Load nvm if available
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh"
  nvm use 18 2>/dev/null || nvm use default
fi

# Check Node version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Error: Node.js 18+ required. Current version: $(node --version)"
  echo ""
  echo "Please upgrade Node.js:"
  echo "  - If using nvm: nvm install 18 && nvm use 18"
  echo "  - Or download from: https://nodejs.org/"
  exit 1
fi

echo "✅ Using Node.js $(node --version)"
echo "🚀 Starting dev server..."
echo ""

npm run dev
