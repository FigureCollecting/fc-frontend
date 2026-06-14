# Security Policy

## Reporting Security Vulnerabilities

Please report security vulnerabilities to the repository maintainer through GitHub's security advisory feature.

## Ubuntu Base Image Security

### Package Management Strategy

This service uses **unpinned apt packages with automatic security upgrades** during build:

```dockerfile
RUN apt-get update && apt-get upgrade -y \
    && apt-get install -y \
    curl \
    xz-utils \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean
```

**Design Decision: Unpinned Packages**

We intentionally do NOT pin apt package versions (e.g., `curl=7.81.0-1ubuntu1.18`) for these reasons:

1. **Security-First Approach**: `apt-get upgrade -y` ensures latest security patches are applied at build time
2. **Automated Detection**: Security scanners (Grype, Trivy, Syft) examine the final container and flag any vulnerabilities
3. **Maintenance Efficiency**: Pinning requires constant version updates as Ubuntu releases security patches
4. **Build-Only Scope**: These utilities (curl, xz-utils) are used during build, not in production runtime
5. **Scanning Coverage**: Container security scanning provides oversight regardless of pinning strategy

**Trade-offs Accepted:**
- ✅ Better default security posture with automatic updates
- ✅ Simpler Dockerfile maintenance
- ✅ Security scanner catches any issues in final image
- ⚠️ Less reproducible builds (acceptable for our use case)

**When pinning WOULD be appropriate:**
- Compliance requirements demanding exact package manifests
- Critical infrastructure with formal change control
- Infrequent builds where reproducibility is paramount

### Container Scanning Scope

Security scanners (Grype, Trivy, Syft) examine the **entire container**, including:
- Application dependencies (`node_modules/`)
- System packages installed via apt
- Node.js binary and its dependencies
- React build output
- Nginx binary and modules (production stage)

This comprehensive scanning provides defense-in-depth even with unpinned packages.

## Node.js Installation Security

### Direct Binary Installation

We install Node.js v24.8.0 using official binaries from nodejs.org rather than Ubuntu's package manager:

```dockerfile
RUN NODE_VERSION=v24.8.0 \
    && curl -fsSLO https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.xz \
    && tar -xJf node-${NODE_VERSION}-linux-x64.tar.xz -C /usr/local --strip-components=1 \
    && rm node-${NODE_VERSION}-linux-x64.tar.xz
```

**Security Advantages:**
1. **Version Control**: Explicit Node.js version, independent of Ubuntu package updates
2. **Upstream Security**: Get Node.js security patches directly from Node.js project
3. **Avoid Package Manager CVEs**: No dependency on Ubuntu's Node.js packaging
4. **Verification**: Can add checksum verification if needed

## Frontend-Specific Security

### React Build Security

- **Environment Variables**: Only `VITE_*` prefixed variables are embedded in build
- **Production Build**: Minified and optimized, no source maps exposed
- **Static Assets**: Served via nginx with appropriate security headers

### Nginx Security (Production Stage)

- **Non-Root Execution**: Production container runs as `nginx` user (UID determined by system)
- **Minimal Permissions**: nginx user owns only necessary directories
- **No Shell Access**: nginx user created with `--shell /bin/false`
- **PID File Location**: Uses `/run/nginx/nginx.pid` (nginx-writable location)

### Health Check Security

We use Node.js built-in `http` module for health checks instead of external tools:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:80', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"
```

**Advantages:**
- No need for `curl` in production image (reduces attack surface)
- Node.js already installed for other purposes
- Simpler dependency management

## Dependency Security

### npm Overrides

The `package.json` includes security overrides for known vulnerabilities:

```json
"overrides": {
  "nth-check": "^2.1.1",
  "postcss": "^8.4.31"
}
```

These override transitive dependencies to fix security issues in packages we don't control directly.

### Regular Updates

- **Dependabot**: Configured with smart grouping to manage dependency updates
- **Security Alerts**: GitHub security scanning alerts for vulnerable dependencies
- **CodeQL**: Security vulnerability scanning (GitHub native)
- **Codecov**: Code coverage tracking and visualization

### Accepted Risk: webpack-dev-server < 5.2.1

**Vulnerabilities**:
- GHSA-4v9v-hfq4-rm2v (CVSS 5.3) - Source code theft via malicious website
- GHSA-9jgg-88mc-972h (CVSS 6.5) - Source code theft (non-Chromium browsers)

**Why Not Fixed**:
- react-scripts 5.0.1 (latest stable) requires webpack-dev-server 4.x
- webpack-dev-server 5.x has breaking API changes (`onAfterSetupMiddleware` removed)
- Upgrading breaks `npm start` development server
- Create React App is in maintenance mode (no v6 planned)
- No migration path available without full framework change (Vite, Next.js, etc.)

**Risk Assessment**:
- ✅ **Development-only**: Vulnerability only affects `npm start`, not production builds
- ✅ **Requires specific attack**: Developer must visit malicious website while dev server runs
- ✅ **Limited impact**: Source code theft only (no production data, secrets, or credentials)
- ✅ **Requires knowledge**: Attacker must know dev server port and webpack config
- ✅ **Low likelihood**: Requires specific attack scenario during development

**Mitigations**:
1. **Use Chromium-based browsers**: Chrome 94+ is immune to GHSA-9jgg-88mc-972h
2. **Avoid untrusted sites**: Don't browse untrusted websites while dev server is running
3. **Random ports**: Consider using random ports instead of default 3000
4. **Network isolation**: Run dev server on localhost only (default behavior)
5. **Production unaffected**: Production builds use nginx, not webpack-dev-server

**Security Scanner Note**:
This vulnerability will appear in npm audit and container scans. It is an **accepted risk** due to:
- Development environment scope
- No fix available without breaking changes
- Low exploitation likelihood
- Multiple mitigations in place

**Future Resolution**:
- Monitor CRA project for updates
- Consider migration to Vite/Next.js when resources allow
- Evaluate alternatives as they mature

## Best Practices

1. Keep Ubuntu base image updated via `apt-get upgrade`
2. Use security scanners on final production image
3. Monitor Dependabot and security alerts
4. Run containers as non-root users
5. Minimize production image attack surface
6. Use explicit Node.js versions for reproducibility
