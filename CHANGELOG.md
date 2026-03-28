# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-28

### Added
- **State Machine Selector Modal**: New reusable component for selecting state machines from a paginated, searchable list
  - `components/modals/state-machine-selector-modal.tsx` - Modal with table view, search, and pagination (20 items per page)
  - Fetches state machines from `/api/state-machines` API endpoint
  - Displays ID, name, and select action for each state machine
  
- **State Name Selector Modal**: New component for selecting states from a state machine definition
  - `components/modals/state-name-selector-modal.tsx` - Modal showing all states defined in a state machine
  - Fetches states from `/api/state-machines/[id]/states` API endpoint
  - Displays state usage indicators (used/unused) and status history badges
  - Search functionality to filter states by name

- **Execution Time Range Filters**: Exact date-time range selection for execution filtering
  - Replaced preset date range dropdown (Today, 7d, 30d, 90d) with precise date-time pickers
  - "Start Time From" and "Start Time To" fields using `DateTimePicker` component
  - Backend support for `startTimeFrom` and `startTimeTo` query parameters (Unix timestamps)

- **Filter Submission Control**: Manual filter application instead of auto-submit
  - New "Apply Filters" button to trigger search
  - "Unsaved changes" indicator when filter values differ from applied filters
  - Improved user control over filter execution timing

### Changed
- **Start Batch Execution Modal**: Enhanced UX with selector modals for read-only fields
  - `sourceStateMachineId` field is now read-only, selectable only via `StateMachineSelectorModal`
  - `sourceStateName` field is now read-only, selectable only via `StateNameSelectorModal` (enabled after state machine selection)
  - Both fields display search button to open respective selector modals
  - Consistent styling with gray background for read-only inputs

- **Execution Filters**: Complete UI overhaul for improved consistency and usability
  - Added consistent labels with icons to all filter fields:
    - 🔍 Search
    - Status
    - 🕐 Start Time From
    - 🕐 Start Time To
    - State Machine ID
    - 🔽 State Name (dynamic, shown when state machine selected)
    - State Status (dynamic, shown when state machine selected)
  - `State Machine ID` field is now read-only, populated via `StateMachineSelectorModal`
  - Removed manual text input for State Machine ID to prevent invalid entries
  - Refactored filter state management with `pendingFilters` and `committedFilters` separation

- **Executions API**: Extended filtering capabilities
  - Added `startTimeFrom` and `startTimeTo` query parameters (Unix timestamps in seconds)
  - Exact timestamp filters take priority over legacy `dateRange` parameter
  - Backward compatible with existing `dateRange`, `startDate`, `endDate` parameters

### Technical
- **Files Changed**: 5 files, +803 insertions, -191 deletions
  - `app/api/executions/route.ts` - Extended query schema and date filtering logic
  - `app/dashboard/executions/ExecutionFilters.tsx` - Complete refactor with new UI and state management
  - `components/modals/start-batch-execution-modal.tsx` - Integrated selector modals
  - `components/modals/state-machine-selector-modal.tsx` - New component
  - `components/modals/state-name-selector-modal.tsx` - New component

### User Experience Improvements
- Prevents manual entry errors by using selector modals for ID fields
- Provides visual feedback for unsaved filter changes
- Enables precise time-based execution filtering
- Improves discoverability of state machines and states through searchable lists
- Maintains consistent label structure across all filter fields

## [1.0.9] - 2026-03-24

### Changed
- **Batch Execution**: Adjusted batch execution defaults for improved usability
- **Next.js Config**: Added development origin to support local development workflows

## [1.0.8] - 2026-03-21

### Fixed
- **Dependencies** — Resolved peer dependency conflicts for React 19:
  - Upgraded `@testing-library/react` from v14 to v16 (supports React 19)
  - Upgraded `@testing-library/dom` from v9 to v10 (required by @testing-library/react v16)
  - Upgraded `drizzle-kit` from v0.18.1 to v0.31.9 (fixes `dialect` property type error)
  
- **Scripts** — Restored `type-check` script in `package.json` for TypeScript validation

- **Missing File** — Restored `app/api/state-machines/[id]/states/route.ts` that was missing from working directory

### Changed
- **Vitest Config** — Updated test configuration with improved path resolution and CSS handling

## [1.0.7] - 2026-03-20

### Added
- **State Name & Status Filters**: Advanced execution filtering capabilities
  - Dynamic state name dropdown that auto-populates based on selected State Machine ID
  - State status filter (SUCCEEDED, FAILED, RUNNING, WAITING, RETRYING, CANCELLED, TIMED_OUT)
  - New API endpoint `/api/state-machines/[id]/states` to fetch available states and their statuses
  - Enhanced filter UI with clear filters functionality
- **Pause/Resume Functionality**: Ability to resume paused executions
  - New `POST /api/executions/{id}/resume` endpoint
  - Resume button on paused execution detail pages with loading state management
  - Paused status card displaying current state information
- **Testing Infrastructure**: Vitest testing framework setup
  - `@testing-library/react` integration
  - Test configuration files (`vitest.config.ts`, `vitest.setup.ts`)
  - Initial component tests for execution modals

### Changed
- **Execution Filters UI**: Enhanced `ExecutionFilters.tsx` with dynamic dropdowns and improved UX
- **Type Definitions**: Updated execution list and page types to support new filter parameters

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
