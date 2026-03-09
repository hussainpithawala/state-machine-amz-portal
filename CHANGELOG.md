# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2026-03-09

### Added
- **Bulk Execution**: New bulk execution feature with support for launching multiple executions with custom inputs
  - JSON input array or file upload (max 10MB) support
  - Configurable concurrency (1-100) and execution mode (concurrent/sequential)
  - Micro-batching support with customizable batch size
  - Advanced configuration: pause threshold, resume strategy (manual/auto), timeout settings
  - Orchestrator ID tracking for bulk operations
- **API Endpoints**: 
  - `/api/executions/launch-bulk` - JSON-based bulk execution launch
  - `/api/executions/launch-bulk-form` - Form-data bulk execution with file upload
- **UI Components**:
  - `StartBulkExecutionModal` - Full-featured modal for bulk execution with input method toggle
  - Micro-batch configuration UI in batch execution modal
- **Loop Detection**: Automatic detection of repeated state patterns in execution timeline
  - Visual alert when loops are detected
  - Iteration index selector to navigate through loop repetitions
  - State signature matching algorithm for pattern recognition
- **Orchestrator Protection**: Disable execution buttons for orchestrator state machines (`micro-bulk-orchestrator-v1`, `micro-batch-orchestrator-v1`)

### Changed
- **Execution List**: Improved pagination handling with proper state synchronization
- **Batch Execution**: Added micro-batching support with configurable batch size
- **Modal Components**: Added `disabled` prop to all execution modals for better control

### Enhanced
- **State Timeline**: Enhanced visualization with loop detection and iteration navigation
- **Input Validation**: Comprehensive validation for bulk execution parameters
- **Error Handling**: Improved error messages and toast notifications for bulk operations

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
