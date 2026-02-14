# Changelog

All notable changes to the fc-frontend service will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.1] - 2026-02-13

### Changed
- **Organization Migration**: Moved repository from `rpgoldberg` to `FigureCollecting` org
- **Docker Publish Workflow**: Fixed OCI case-sensitivity bug in image verification step
- **Security Scan Workflow**: Added `security-events: write` permission for SARIF uploads

---

## [2.2.0] - 2025-11-30

### Changed
- **Improved Security Scan Workflow**: Fixed vulnerability counting in scheduled scans
  - Uses JSON parsing with `jq` instead of grep for accurate vulnerability counts
  - Prevents false positive vulnerability reports from table headers
  - Added auto-close feature for stale security issues when vulnerabilities are resolved
  - Each service now scans only its own Docker image (eliminates redundant cross-service scanning)

---

## [2.1.1] - 2025-11-28

### Added
- **Codecov Configuration**: Added `codecov.yml` with 80% patch coverage threshold
  - Enforces code quality standards on new code
  - Configured project and patch coverage targets
- **Docker Image Verification**: Added scripts for safe Docker image verification
  - `scripts/verify-docker-image.sh` for validating container images
  - `scripts/safe-version-bump.sh` for controlled version management

### Changed
- **Security Scan Workflow**: Removed archived version-manager from scheduled security scans
  - Updated matrix strategy to only scan active services (fc-backend, fc-frontend, scraper)

### Security
- **CI/CD Improvements**: Enhanced build and security workflows
  - All security scans passing (CodeQL, Trivy, NPM Audit)
  - Container image scanning with vulnerability reporting

---

## [2.1.0] - 2025-11-27

### Added
- **Code Analysis Tools**: Replaced SonarCloud with CodeQL and Codecov
  - CodeQL for security vulnerability scanning
  - Codecov for coverage tracking and enforcement

---

## [2.0.0] - 2025-10-26

### Added
- Initial production release
- React/TypeScript single-page application
- Chakra UI component library
- Figure collection management interface
- User authentication flows
- Docker containerization with Nginx
- GitHub Actions CI/CD pipeline
- Security vulnerability scanning

---

## Links

- [Repository](https://github.com/FigureCollecting/fc-frontend)
- [Issues](https://github.com/FigureCollecting/fc-frontend/issues)
- [Pull Requests](https://github.com/FigureCollecting/fc-frontend/pulls)
