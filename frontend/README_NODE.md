# Node.js Version Requirement

This project requires **Node.js 18 or higher** to run.

## Quick Setup

If you have `nvm` installed (recommended):

```bash
cd frontend
nvm use  # Automatically uses Node 18 from .nvmrc
npm install
npm run dev
```

## Manual Setup

If you don't have `nvm`:

1. **Install Node.js 18+** from [nodejs.org](https://nodejs.org/)

2. **Verify your Node version:**
   ```bash
   node --version  # Should be v18.0.0 or higher
   ```

3. **Install dependencies and run:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Troubleshooting

### Error: "Unexpected token '??='"

This means you're using Node.js 14 or earlier. Please upgrade to Node.js 18+.

### Using nvm (Node Version Manager)

If you have nvm installed, you can easily switch Node versions:

```bash
# Install Node 18
nvm install 18

# Use Node 18
nvm use 18

# Set as default (optional)
nvm alias default 18
```

The `.nvmrc` file in this directory will automatically use Node 18 when you run `nvm use` in this directory.
