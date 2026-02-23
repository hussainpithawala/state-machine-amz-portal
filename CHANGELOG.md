# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [1.0.5] - 2026-02-23

- Feature: Added batch execution functionality
- Feature: Enhanced date-time picker with time selection
- Fix: Resolved CSS parsing issues in calendar component
- Enhancement: Improved Docker support and deployment

## [1.0.4] - 2026-02-18

### Changed
- **Release script**: Updated the write permissions for the GitHub token used to push the Docker images.

## [1.0.3] - 2026-02-18

### Added
- **Release automation**: GitHub Actions workflow to build the app and publish Docker images on manual dispatch or version tags.
- **Multi-architecture images**: Docker builds for `linux/amd64` and `linux/arm64`, with build cache enabled.
- **Release publishing**: Automatic GitHub Release creation on version tags.

### Changed
- **Docker image tagging**: Improved tagging/versioning using manual version input, git tags, and commit SHA.
- **Registry publishing**: Publishing support for both Docker Hub and GitHub Container Registry (GHCR).

### Security
- **Container scanning**: Added Trivy vulnerability scanning with SARIF upload for reporting.

## [1.0.0] - 2026-02-09

### Added

#### Core Features
- **Dashboard**: Real-time statistics, service health monitoring, and execution overview
- **State Machines Management**: Complete CRUD operations for AWS Step Functions-compatible state machines
- **Executions Monitoring**: Comprehensive execution tracking with detailed state timeline visualization
  // ... existing code ...
