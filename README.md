# Figure Collector Frontend

React frontend for the Figure Collector application (v3.2.3). Provides a comprehensive user interface for managing figure collections with advanced authentication, real-time MFC synchronization, and accessibility-first testing.

## Features

- **Authentication & Security**
  - Register, login, profile, and session management
  - Token refresh and multiple session support
  - Secure logout options (single and all sessions)
  - Email verification flow with resend support
  - Password reset flow (forgot password + reset via email link)
  - WebAuthn/Passkey authentication (@simplewebauthn/browser)
  - Two-Factor Authentication (TOTP setup + backup codes)
  - Dedicated Security page for managing 2FA and passkeys
- **Figure Management**
  - Add, edit, and delete figures with a multi-section form (CoreFields, CompanyRoles, ArtistRoles, Releases, CollectionDetails, CatalogPurchase, MfcFields)
  - Faceted filter sidebar with collection status tabs
  - Search with advanced filtering
  - Statistical dashboard
- **MFC Integration**
  - **MFC Cookie Authentication** - Secure storage for accessing NSFW and private content
  - **MFC Bulk Import with SSE** - Real-time sync progress via Server-Sent Events
  - **MFC Lists** - Import and manage MFC lists (/lists, /lists/:id)
- **Lists Management** - Create, view, and manage figure lists with membership controls
- **UI & Theming**
  - Light, Dark, and Terminal retro theme (triple toggle)
  - Framer Motion animations
  - Markdown rendering (react-markdown)
  - XSS protection via DOMPurify
- **SEO** - react-helmet-async, robots.txt, sitemap.xml, and post-build prerender-meta.js script
- **Version Display** - Service health status with hover popup showing service details
- **Real-time Service Health Monitoring**

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
   - Access via navbar cookie indicator

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

- **Never share your MFC cookies** - they provide full access to your MFC account
- Cookies are **client-side only** and never transmitted to the backend
- Persistent cookies use **AES-GCM 256-bit encryption**
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

| Category | Technology |
|----------|-----------|
| Language | TypeScript 4.9.5 |
| UI Library | React 18.2.0 |
| UI Framework | Chakra UI v2 |
| State Management | Zustand (authStore, themeStore, syncStore) |
| Server State | React Query |
| Routing | React Router |
| Forms | React Hook Form |
| API Client | Axios |
| Animations | Framer Motion |
| Markdown | react-markdown |
| SEO | react-helmet-async |
| XSS Protection | DOMPurify |
| WebAuthn | @simplewebauthn/browser |
| Build Tool | CRACO (wraps Create React App) |
| Testing | Jest + React Testing Library + jest-axe |
| Production Server | Nginx |

## Pages & Routes

### Public Routes

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | User authentication |
| `/register` | Register | Account creation |
| `/verify-email` | VerifyEmail | Email verification flow |
| `/forgot-password` | ForgotPassword | Password reset request |
| `/reset-password` | ResetPassword | Password reset via token |

### Protected Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Collection overview and stats |
| `/figures` | FigureList | Browse and filter figures |
| `/figures/:id` | FigureDetail | View figure details |
| `/figures/add` | AddFigure | Add new figure |
| `/figures/edit/:id` | EditFigure | Edit existing figure |
| `/search` | Search | Advanced search |
| `/statistics` | Statistics | Collection analytics |
| `/lists` | Lists | MFC lists management |
| `/lists/:id` | ListDetail | Individual list view |
| `/profile` | Profile | User profile settings |
| `/security` | Security | 2FA, passkeys, backup codes |
| `*` | NotFound | 404 fallback |

## SEO

The frontend includes SEO support for improved search engine visibility:

- **react-helmet-async** for per-page `<title>` and `<meta>` tags
- **robots.txt** allowing search engine crawling
- **sitemap.xml** listing public routes
- **prerender-meta.js** post-build script for static meta tag injection

## Proxy Requirement

**IMPORTANT: This application REQUIRES a proxy to function correctly.**

The frontend makes all API requests to relative paths (e.g., `/api/version`, `/api/figures`) which must be proxied to the backend service. This design:
- **Avoids CORS issues** by keeping frontend and API on the same origin
- **Simplifies deployment** with a single domain for users
- **Enhances security** by not exposing the backend directly

### Development (Automatic)
The React dev server (`npm start`) automatically proxies `/api/*` requests to the backend using `src/setupProxy.js`. No configuration needed - it just works!

### Production (Nginx)
The production Docker image includes an Nginx configuration that:
- Serves the frontend static files
- Proxies `/api/*` requests to the backend service

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

This mirrors the production Nginx configuration, ensuring consistent behavior between development and production environments.

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

The frontend supports the following authentication endpoints:

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

## Testing

The frontend has a comprehensive test suite with **~1,105 tests across 67 suites in 97 test files**.

### Test Stack

- **Jest** - Test runner with coverage reporting
- **React Testing Library** - Component testing with user-centric queries
- **jest-axe** - Automated accessibility testing (WCAG 2.1 AA compliance)

### Test Categories

- **Component Tests** - UI rendering, user interactions, state changes
- **API Tests** - Axios interceptors, auth functions, error handling
- **Store Tests** - Zustand store behavior (auth, theme, sync)
- **Hook Tests** - Custom hook logic (SSE events, form state)
- **Accessibility Tests** - WCAG 2.1 AA compliance via jest-axe
- **Form Tests** - Validation, submission, multi-section form interactions

### Key Test Files

- `src/api/__tests__/index.test.ts` - API interceptors and auth functions
- `src/components/__tests__/Layout.test.tsx` - Version management and UI
- `src/components/__tests__/FigureForm.*.test.tsx` - Form validation, scraping, conditions
- `src/test-utils.tsx` - Shared testing utilities and providers

### Running Tests

```bash
# Run full test suite with coverage
npm test

# Run tests for a specific component
npm test ComponentName.test.tsx

# Generate coverage report
npm test -- --coverage

# Run without coverage (faster)
npm test -- --no-coverage

# Run a specific test file
npm test -- src/api/__tests__/index.test.ts

# Watch mode for development
npm test:watch

# CI mode
npm test:ci
```

## CI/CD

Seven GitHub Actions workflows automate build, test, security, and release processes:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| **Build and Test** | PR, push to develop/main | Runs test suite with coverage, uploads to Codecov |
| **CodeQL Security Analysis** | PR, push, scheduled | Static analysis for security vulnerabilities |
| **Build, Scan, and Push Docker Image** | Push to main | Builds production image, scans with Trivy, pushes to GHCR |
| **Create Release** | Manual dispatch | Creates GitHub release with changelog |
| **SBOM and Security Scanning** | Push to main | Generates Software Bill of Materials, runs Trivy scan |
| **Scheduled Security Rescan** | Cron schedule | Periodic vulnerability rescanning |
| **Security Vulnerability Scan** | PR | Dependency and container vulnerability scanning |

## Docker Deployment

### Production Container

The production image uses a multi-stage Docker build:

1. **Build stage** - Node 24 LTS compiles the React application
2. **Production stage** - Ubuntu 24.04 with Nginx serves static files and proxies API requests

```bash
# Build production image
docker build -t frontend .

# Run container (Nginx serves on port 80 internally)
docker run -p 5051:80 frontend
```

The Nginx configuration handles:
- Serving the built React static files
- Proxying `/api/*` requests to the backend service
- SPA fallback routing (all paths serve `index.html`)
