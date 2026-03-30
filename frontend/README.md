# WorkPulse Frontend

Production-ready React frontend for WorkPulse - Workforce Productivity Platform.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Redux Toolkit** for state management
- **React Query** for API caching and data fetching
- **TailwindCSS** for styling
- **Recharts** for data visualization
- **ActionCable** for WebSocket real-time updates
- **React Router** for routing

## Features

### Role-Based Dashboards

- **Employee Dashboard**: Personal productivity tracking, session control, activity summaries
- **Manager Dashboard**: Team monitoring, alerts, screenshot viewing, team reports
- **Admin Dashboard**: Organization-wide analytics, user management, policy settings

### Real-Time Features

- Live presence updates via WebSocket
- Real-time session tracking
- Instant alert notifications
- Team activity monitoring

### Key Modules

1. **Authentication**: JWT-based login/register
2. **Session Management**: Start/stop work sessions with project tracking
3. **Activity Tracking**: Active vs idle time monitoring
4. **Screenshot Viewer**: Grid layout with lazy loading and fullscreen preview
5. **Reports & Analytics**: Daily/weekly reports with charts
6. **Alerts System**: Real-time notifications for idle time, overtime, etc.

## Getting Started

### Prerequisites

- **Node.js 18+** and npm (Node.js 14 will NOT work - see [README_NODE.md](./README_NODE.md) for setup help)
- Backend API running (see main README)

> ⚠️ **Important**: This project requires Node.js 18 or higher. If you see errors like "Unexpected token '??='", you need to upgrade Node.js.

### Installation

1. **Switch to Node.js 18+** (REQUIRED):
   ```bash
   # If using nvm (recommended):
   nvm use 18
   # or
   nvm use  # Automatically uses version from .nvmrc
   
   # Verify version:
   node --version  # Should show v18.x.x or higher
   ```

2. Install dependencies:
```bash
npm install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your API URLs:
```
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000/cable
```

5. Start development server:
```bash
# Option 1: Use helper script (automatically checks Node version)
./dev.sh

# Option 2: Use npm directly (make sure Node 18+ is active)
npm run dev

# Option 3: Use safe script
npm run dev:safe
```

The app will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Docker Deployment

Build and run with Docker:

```bash
docker build -t workpulse-frontend .
docker run -p 80:80 workpulse-frontend
```

Or use docker-compose (see main project root).

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Project Structure

```
src/
├── api/              # API client and endpoints
├── auth/             # Authentication hooks
├── components/       # Reusable UI components
│   └── ui/          # Base UI components (Button, Card, etc.)
├── layouts/         # Layout components
├── pages/           # Page components
│   ├── admin/      # Admin dashboard pages
│   ├── manager/    # Manager dashboard pages
│   └── employee/   # Employee dashboard pages
├── store/           # Redux store and slices
├── hooks/           # Custom React hooks
├── websocket/       # WebSocket/ActionCable integration
├── charts/          # Chart components
└── utils/           # Utility functions
```

## Environment Variables

- `VITE_API_URL`: Backend API base URL
- `VITE_WS_URL`: WebSocket server URL

## API Integration

The frontend integrates with the Rails API:

- Authentication: `/api/v1/auth/login`, `/api/v1/auth/register`
- Sessions: `/api/v1/sessions/*`
- Projects: `/api/v1/projects`
- Users: `/api/v1/users`
- Reports: `/api/v1/reports/*`
- Alerts: `/api/v1/alerts`

## WebSocket Channels

- `UserChannel`: Personal user updates
- `OrganizationChannel`: Organization-wide presence and alerts

## License

See main project README.
