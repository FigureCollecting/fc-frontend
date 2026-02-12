# Figure Collector Frontend

React frontend for the Figure Collector application. Provides a user interface for managing figure collections. Features comprehensive test coverage with React Testing Library and Jest.

## Features

- Advanced user authentication (register, login, profile, session management)
  - Token refresh and multiple session support
  - Secure logout options (single and all sessions)
- Figure management interface (add, edit, delete)
- Search and filter functionality
- Statistical dashboard
- Version display with service health status
- Real-time service health monitoring
- **MFC Cookie Authentication** - Secure storage for accessing NSFW and private content
- **MFC Bulk Import with SSE** - Real-time sync progress via Server-Sent Events
- **Terminal Retro Theme** - DOS/Osbourne-inspired green/orange theme with Matrix easter egg

## Terminal Retro Theme

Experience nostalgia with the Terminal theme - a retro DOS/Osbourne/Amiga-inspired interface featuring:

- **Matrix Green & Amber Colors**: Classic terminal palette with #00ff00 green and #ff8800 orange
- **Monospace Font**: Authentic Courier New typeface throughout
- **Triple Theme Toggle**: Cycle through Light → Dark → Terminal modes
- **Easter Egg**: "The Matrix has you, Neo..." tooltip when in Terminal mode

### How to Enable

1. Click the theme toggle in the navbar (sun/moon/terminal icon)
2. Cycle through: Light → Dark → **Terminal**
3. Terminal theme persists across sessions via localStorage

### Theme Persistence

Your theme preference is automatically saved and restored on subsequent visits. The Terminal theme uses Chakra UI's dark mode as a base with custom CSS overrides for the retro aesthetic.

## MFC Cookie Authentication

The frontend supports optional MyFigureCollection (MFC) cookie authentication for accessing NSFW and private content during figure scraping. This feature provides a secure, user-friendly way to authenticate with MFC without storing credentials.

### Features

- **Multiple Storage Options**:
  - **One-time (Form Session)**: Cookies stored in memory, cleared when form closes
  - **Session (Until Logout)**: Cookies in sessionStorage, cleared on logout
  - **Persistent (Encrypted)**: AES-GCM encrypted storage in localStorage

- **Security & Privacy**:
  - Client-side only - cookies never sent to backend
  - AES-GCM 256-bit encryption for persistent storage
  - PBKDF2 key derivation with 100,000 iterations
  - Automatic cleanup on session expiry

- **User-Friendly Features**:
  - Interactive bookmarklet for easy cookie extraction
  - Collapsible help with step-by-step DevTools instructions
  - Status indicator in navbar showing storage type
  - Profile page dashboard for cookie management
  - "Save & Add Another" button for bulk figure entry

### How to Use

1. **Add Cookies** (when adding/editing a figure):
   - Click "How to get MFC cookies" for detailed instructions
   - Use provided bookmarklet for easy extraction
   - Or manually copy from browser DevTools
   - Select desired storage option
   - Cookies auto-save when storage type is selected

2. **Manage Cookies** (Profile page):
   - View current cookie status and storage type
   - Clear cookies manually at any time
   - Access via navbar cookie indicator (🔒)

3. **Automatic Cleanup**:
   - One-time cookies cleared when form closes
   - Session cookies cleared on logout
   - Persistent cookies cleared on session expiry

### Storage Types Explained

| Type | Storage Location | Encryption | Cleared When | Best For |
|------|------------------|------------|--------------|----------|
| **None** | Not stored | N/A | N/A | Public content only |
| **One-time** | Memory only | No (temporary) | Form close | Single figure entry |
| **Session** | sessionStorage | No (temporary) | Logout | Active browsing session |
| **Persistent** | localStorage | Yes (AES-GCM) | Session expiry | Frequent use |

### Security Notes

- ⚠️ **Never share your MFC cookies** - they provide full access to your MFC account
- Cookies are **client-side only** and never transmitted to the backend
- Persistent cookies use **military-grade encryption** (AES-GCM 256-bit)
- All cookies are automatically cleared when your session expires

### Technical Implementation

- **Encryption**: `src/utils/crypto.ts` - Web Crypto API with AES-GCM
- **UI Components**: `src/components/FigureForm.tsx` - Cookie management section
- **Profile Dashboard**: `src/pages/Profile.tsx` - Cookie status and controls
- **Navbar Indicator**: `src/components/Navbar.tsx` - CookieStatusIndicator
- **Auto-cleanup**: `src/stores/authStore.ts` - Logout hook

## MFC Bulk Import with SSE

Real-time synchronization of your MFC collection using Server-Sent Events (SSE) for live progress updates.

### Features

- **Real-time Progress**: Live updates as each figure is processed
- **Phase Tracking**: Visual indicators for validation → export → parsing → queueing → enrichment → complete
- **Item Statistics**: Running counts of pending, processing, completed, failed, and skipped items
- **Cancel Support**: Abort sync at any time with immediate feedback
- **Auto-Reconnect**: Automatic SSE reconnection on connection loss

### How It Works

1. **Start Sync**: Click "Sync from MFC" and provide your session cookies
2. **CSV Export**: Scraper fetches your collection CSV from MFC
3. **Queue Processing**: Items are queued with priority ordering
4. **Live Enrichment**: Each figure is scraped with real-time status updates via SSE
5. **Completion**: Summary shows enriched, skipped, and failed counts

### Technical Implementation

- **SSE Hook**: `src/hooks/useSyncEvents.ts` - Manages EventSource connection lifecycle
- **Types**: `src/types/index.ts` - SSE event interfaces (SyncPhase, SyncItemStatus, etc.)
- **API Client**: `src/api/scraper.ts` - Sync job management (create, get, cancel)
- **UI Component**: `src/components/MfcSyncModal.tsx` - Progress modal with live updates
- **Token Auth**: SSE uses query param token (`?token=<jwt>`) since EventSource can't set headers

## Technology Stack

- TypeScript
- React 18
- Chakra UI
- React Query
- React Router
- React Hook Form
- Nginx (for static serving and API proxying)
- **Testing**: React Testing Library + Jest + jest-axe

## Proxy Requirement

**⚠️ IMPORTANT: This application REQUIRES a proxy to function correctly.**

The frontend makes all API requests to relative paths (e.g., `/api/version`, `/api/figures`) which must be proxied to the backend service. This design:
- **Avoids CORS issues** by keeping frontend and API on the same origin
- **Simplifies deployment** with a single domain for users
- **Enhances security** by not exposing the backend directly

### Development (Automatic)
The React dev server (`npm start`) automatically proxies `/api/*` requests to the backend using `src/setupProxy.js`. No configuration needed - it just works!

### Production (Nginx Required)
Nginx must be configured to:
- Serve the frontend static files
- Proxy `/api/*` requests to the backend service
- Example configuration available in `../figure-collector-infra/nginx/`

### Direct Backend Access
**Not supported.** The frontend assumes a proxy and uses relative URLs. Accessing the backend directly (e.g., `http://backend:5050`) bypasses the frontend entirely.

### Environment Setup

**Configuration Files:**
- `.env.example` - Template showing all environment variables
- `.env.local` - Your local overrides (gitignored, optional)
- `.env` - Auto-created by Create React App (gitignored)

**Quick Start:**
```bash
# Copy example (optional - defaults work for most cases)
cp .env.example .env.local

# Frontend typically works with defaults - no setup required!
```

See `.env.example` for all configuration options including:
- API URL configuration (local vs Docker vs Coolify)
- Debug logging settings for development

### Local Development

```bash
# Install dependencies
npm install

# Start development server (with backend proxy)
npm start

# Build for production
npm run build

# Run tests with coverage (default)
npm test

# Run tests in watch mode for development
npm test:watch

# Run tests for CI environment
npm test:ci
```

### Environment Variables

See `.env.example` for complete configuration template.

**API Configuration:**
- `REACT_APP_API_URL`: API endpoint URL (default: `/api`)
  - Local dev with proxy: `/api` (recommended)
  - Docker/Coolify: `/api`
  - Direct backend: `http://localhost:5080/api` (not typical)

**Optional:**
- `REACT_APP_BACKEND_URL`: Direct backend URL (debugging only, not typically needed)
- `REACT_APP_DEBUG`: Enable debug logging in browser console (default: false)
- `REACT_APP_DEBUG_LEVEL`: Debug verbosity (`info`, `verbose`, `debug`)
- `REACT_APP_DEBUG_MODULES`: Comma-separated modules to debug (e.g., `auth,api`)

### Development Proxy

The frontend uses `src/setupProxy.js` to proxy API requests during development:

- **Path Rewriting**: Requests to `/api/*` are rewritten to `/*` when forwarded to the backend
- **Target**: `http://backend:5090` (Docker network)
- **Additional Routes**: `/version` is also proxied for service health information

This mirrors the production nginx configuration, ensuring consistent behavior between development and production environments.

**Requirements**:
- `http-proxy-middleware` package (included in dependencies)
- Backend service must be running on port 5080 (local) or 5090 (Docker dev)

**Verify proxy is working**:
```bash
# In Docker dev environment
docker logs fc-frontend-dev | grep HPM
# Should show: [HPM] Proxy created and [HPM] Proxy rewrite rule created
```

### Authentication Endpoints

The frontend now supports the following authentication endpoints:

- `POST /auth/login`: User login with credentials
  - Returns user data and access token
  - Handles token refresh with a secure mechanism
- `POST /auth/register`: Create new user account
  - Validates input and returns registered user profile
- `POST /auth/refresh`: Refresh authentication token
  - Automatically handled by Axios interceptors
  - Prevents unauthorized access during token expiration
- `POST /auth/logout`: Logout from current session
  - Clears current session tokens
- `POST /auth/logout-all`: Logout from all active sessions
  - Invalidates all session tokens for the user
- `GET /auth/sessions`: Retrieve active user sessions
  - Allows users to manage and view current login sessions

#### Session Management Features

- **Advanced Multiple Session Support**
  - Authenticate from multiple devices
  - Centralized view of active sessions
  - Fine-grained session access control

- **Robust Token Management**
  - Automatic, transparent token refresh
  - Seamless protection against unauthorized access
  - Centralized, secure session management

- **Flexible Logout Options**
  - Per-session logout capabilities
  - Global session termination
  - Device-level session granularity

#### Security Highlights

- Token refresh mechanism prevents unnecessary re-authentication
- Axios interceptors handle token management transparently
- LocalStorage integration for persistent auth state
- Immediate redirect to login on token invalidation

## Version Management

The frontend automatically registers its version with the backend service on startup. This eliminates circular dependencies and provides a clean architecture where:

- Frontend self-registers version from `package.json` on startup via `/register-service` endpoint
- Backend acts as orchestrator for all service version information
- Version info is displayed in the footer with hover popup showing service details

[... Rest of existing content ...]

## 🧪 Testing

### Continuous Testing Infrastructure Improvements

Our frontend testing infrastructure continues to evolve with significant enhancements across multiple areas:

#### Recent Test Improvements

- **Comprehensive Coverage Enhancement** (Latest):
  - Achieved 80%+ coverage on new/modified code for quality gate compliance
  - Added 45+ new tests covering critical uncovered lines and conditions
  - Fixed all failing tests in api/index.ts and FigureForm components
  - Enhanced Layout component tests with version management scenarios

- **Accessibility Testing**:
  - Enhanced jest-axe integration across all components
  - Comprehensive WCAG 2.1 AA compliance checks
  - Improved screen reader compatibility testing

- **Component Test Stability**:
  - Fixed test utilities for Layout and FigureList components
  - Improved mocking strategies for more realistic testing
  - Simplified Login component tests with focused input validation
  - Added comprehensive FigureForm validation and scraping tests

- **API Test Configuration**:
  - Improved Axios mocking configuration
  - Enhanced error scenario testing
  - More robust API interceptor tests
  - Complete coverage of auth functions (refreshToken, logout, sessions)

- **Test Reliability Enhancements**:
  - Resolved hanging promises in asynchronous tests
  - Improved async/await patterns
  - Better error tracking and state management
  - Fixed localStorage and window.location mocking issues

#### Key Testing Focus Areas

1. **Realistic User Interactions**
   - More precise form interaction simulations
   - Enhanced keyboard navigation testing
   - Comprehensive input validation scenarios

2. **Error Handling**
   - Extended coverage for error state testing
   - Improved fallback and error boundary tests
   - More sophisticated network error simulations

3. **Performance and Stability**
   - Reduced test flakiness
   - Optimized test execution time
   - Improved test isolation techniques

#### Test Coverage Files

Key test files providing comprehensive coverage:
- `src/api/__tests__/index.test.ts` - API interceptors and auth functions
- `src/components/__tests__/Layout.test.tsx` - Version management and UI
- `src/components/__tests__/FigureForm.*.test.tsx` - Form validation, scraping, conditions
- `src/test-utils.tsx` - Shared testing utilities and providers

#### Recommended Testing Workflow

```bash
# Run comprehensive test suite
npm test

# Run tests for a specific component
npm test ComponentName.test.tsx

# Generate test coverage report
npm test -- --coverage

# Run tests without coverage (faster)
npm test -- --no-coverage

# Run specific test suite
npm test -- src/api/__tests__/index.test.ts
```

**Note**: Our continuous testing approach ensures high-quality, reliable, and accessible frontend components across all user interaction scenarios.

## Docker Deployment

### Production Container
```bash
# Build production image
docker build -t frontend .

# Run container
docker run -p 3008:3008 frontend
```

### Test Container (Toggleable)
The test container (`Dockerfile.test`) can run in two modes:

```bash
# Build test image
docker build -f Dockerfile.test -t frontend:test .

# Mode 1: Run tests (default)
docker run frontend:test

# Mode 2: Run as service (for integration testing)
docker run -e RUN_SERVER=1 -p 3013:3013 frontend:test
```

**Features:**
- Default mode runs test suite with coverage
- Setting `RUN_SERVER=1` starts the development server instead
- Useful for integration testing scenarios
- Consistent behavior across all services

[... Rest of existing content remains the same ...]