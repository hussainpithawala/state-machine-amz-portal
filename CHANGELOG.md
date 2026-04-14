# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.5] - 2026-04-14

### Changed
- **File Upload Size Limit**: Increased max file size for bulk execution from 100MB to 1GB
  - `start-bulk-execution-modal.tsx` - Updated validation to accept files up to 1GB
  - Enables much larger input files for bulk operations

### Technical
- **Files Changed**: 1 file
  - `components/modals/start-bulk-execution-modal.tsx` - Updated file size validation from 100MB to 1GB

## [1.1.4] - 2026-04-09

### Added
- **Page Jump Navigation**: Quick page navigation across all list views
  - Page number input field to jump directly to any page
  - "Go" button appears when input differs from current page
  - Press Enter to quickly navigate to the specified page
  - First/Last page buttons with double arrow icons for faster navigation
  - Applied to: Executions List, Linked Executions List, and State Machines pages

- **JSON Copy to Clipboard**: Copy JSON content with a single click
  - Copy button on Input/Output tabs in execution detail view
  - Copy button on individual state input/output blocks (appears on hover)
  - Visual feedback with "Copied!" confirmation and checkmark icon
  - Consistent styling across all JSON viewers

- **Group Enqueue Option**: New option for batch and bulk executions
  - "Group Enqueue" checkbox in Start Batch Execution modal
  - "Group Enqueue" checkbox in Start Bulk Execution modal
  - API support in both `/api/executions/launch-batch` and `/api/executions/launch-bulk`
  - Form-data endpoint support for bulk executions with file upload

### Changed
- **File Upload Size Limit**: Increased max file size for bulk execution from 10MB to 100MB
  - `start-bulk-execution-modal.tsx` - Updated validation to accept files up to 100MB
  - `launch-bulk-form/route.ts` - Removed server-side file size validation
  - Allows larger input files for bulk operations

- **Concurrency Limit**: Increased downstream concurrency limit to 1000
  - Updated API validation in bulk execution endpoint

### Technical
- **Files Changed**: 7 files
  - `app/dashboard/executions/ExecutionList.tsx` - Added page jump navigation
  - `app/dashboard/linked-executions/LinkedExecutionsList.tsx` - Added page jump navigation
  - `app/dashboard/state-machines/page.tsx` - Added page jump navigation
  - `app/dashboard/executions/[executionId]/page.tsx` - Added JSON copy buttons and refactored loop detection
  - `components/modals/start-batch-execution-modal.tsx` - Added Group Enqueue checkbox
  - `components/modals/start-bulk-execution-modal.tsx` - Added Group Enqueue checkbox and increased file size limit
  - `app/api/executions/launch-bulk/route.ts` - Added groupEnqueue field and removed concurrency limit
  - `app/api/executions/launch-bulk-form/route.ts` - Added groupEnqueue support and removed file size validation

### User Experience Improvements
- Page jump navigation eliminates the need to click through hundreds of pages
- Copy buttons make it easy to extract JSON data for debugging and analysis
- Group Enqueue option provides better control over batch/bulk execution queuing
- Larger file upload support enables more complex bulk operations
- Consistent pagination UI across all list pages improves discoverability

## [1.1.3] - 2026-03-29

### Added
- **Linked Executions Page**: New page to track execution links between state machines
  - `/dashboard/linked-executions` - Full-featured list view with filtering and pagination
  - Filter by source/target state machine, execution ID, state name, transformer name, and date range
  - Paginated results (25 items per page) with sortable columns
  - Direct links to source/target executions and source state machine
  - API endpoint `/api/linked-executions` with comprehensive filtering support

- **Bulk Deletion**: Select and delete multiple linked executions at once
  - Individual row checkboxes for selection
  - "Select All" button to select/deselect all items on current page
  - "Delete Selected" button with count indicator
  - Confirmation dialog showing number of records to be deleted
  - Toast notifications for success/error feedback

- **Filter-Based Deletion**: Delete all linked executions matching current filters
  - "Delete All Filtered" button in filter section
  - Fetches and displays count of matching records before confirmation
  - Single-click deletion of all filtered records
  - Auto-clears filters after successful deletion

- **SQL Executor Tool**: New database query tool for advanced users
  - `/dashboard/tools/sql` - Full-page SQL query executor
  - Large textarea for writing SQL queries with font size selector (12px-18px)
  - Execute button with loading state and execution duration display
  - Results displayed in scrollable table with row count
  - Export results to CSV functionality
  - Saved queries panel with localStorage persistence
  - Format SQL button for basic query formatting
  - Sample queries for quick start (6 predefined queries)
  - Security: Blocks dangerous operations (DROP DATABASE, TRUNCATE, etc.)
  - API endpoint `/api/sql-execute` for query execution

- **UI Components**:
  - `components/ui/checkbox.tsx` - Reusable Checkbox component using Radix UI

- **Database Schema**:
  - `lib/schema.ts` - Added `linkedExecutions` table definition with indexes
    - `idx_linked_target_exec` - Index on target_execution_id
    - `idx_linked_source_exec` - Index on source_execution_id
    - `idx_linked_source_sm` - Index on source_state_machine_id

### Changed
- **Navigation**: Reorganized sidebar navigation structure
  - Added collapsible "Tools" section for utility pages
  - Moved "SQL Executor" under Tools section
  - Removed "Create State Machine" from main navigation (accessible via State Machines page)

- **Validation**: Removed upper limit constraints for better flexibility
  - `start-batch-execution-modal.tsx` - Removed `max="1000"` limit from execution filter limit field
  - `launch-batch/route.ts` - Removed `.max(100000)` from `executionFilter.limit` and `microBatchSize`
  - `launch-bulk/route.ts` - Removed `.max(100)` from `concurrency`
  - `start-bulk-execution-modal.tsx` - Removed `max="100"` from concurrency field
  - All fields now only validate minimum value (must be >= 1)

### Technical
- **Files Changed**: 12 files
  - `lib/schema.ts` - Added linkedExecutions table schema
  - `types/database.ts` - Added LinkedExecution interface
  - `app/api/linked-executions/route.ts` - New API endpoint with GET/DELETE support
  - `app/api/sql-execute/route.ts` - New API endpoint for SQL execution
  - `app/dashboard/linked-executions/page.tsx` - New page component
  - `app/dashboard/linked-executions/LinkedExecutionsFilters.tsx` - Filter component with delete functionality
  - `app/dashboard/linked-executions/LinkedExecutionsList.tsx` - List component with selection
  - `app/dashboard/tools/sql/page.tsx` - SQL Executor page
  - `components/ui/checkbox.tsx` - New Checkbox component
  - `components/layout/sidebar.tsx` - Added Tools section with collapsible navigation
  - `components/layout/header.tsx` - Removed SQL Modal from header
  - `components/modals/sql-modal.tsx` - Removed (replaced by full page)

### User Experience Improvements
- Linked executions now easily accessible from main navigation
- Bulk operations reduce manual effort for common tasks
- Confirmation dialogs prevent accidental deletions
- SQL Executor provides powerful database access for debugging and analysis
- Removed arbitrary limits allow users to configure batch sizes based on their needs

## [1.1.2] - 2026-03-28

### Fixed
- **Execution Detail Page**: Fixed crash when loading execution details due to API response format change
  - Updated execution detail page to extract execution from paginated `results` array
  - Added null safety checks for `execution.status` with fallback to "Unknown"
  - Added default status fallback for `getStatusColor()` function
  - Resolves issue where execution detail page showed `Cannot read property 'replace' of undefined`

### Technical
- **Files Changed**: 1 file
  - `app/dashboard/executions/[executionId]/page.tsx` - Handle paginated API response

### Root Cause
- Previous API change (v1.1.1) modified `/api/executions` to always return paginated list format
- Execution detail page was still expecting direct execution object
- Fix extracts execution from `results[0]` and adds defensive null checks

## [1.1.1] - 2026-03-28

### Added
- **Dashboard Version Badge**: Display current application version in dashboard header
  - Version badge with tag icon in top-right corner of dashboard page
  - Automatically reads version from `package.json`
  - Helps users quickly identify the current release version

### Changed
- **Execution Filters**: Separated search into distinct Execution ID and Execution Name fields
  - **Execution ID**: Exact match filter for searching by execution ID
  - **Execution Name**: Partial match (LIKE) filter for searching by execution name
  - Replaced single generic "Search" field with two purpose-specific inputs
  - Both fields have consistent labeled layout with search icons

- **Executions API**: Simplified and fixed execution filtering logic
  - Removed single execution lookup from list endpoint (moved to detail endpoint)
  - Fixed execution ID filter to work correctly in list view (exact match with `eq()`)
  - Execution name filter uses partial match with `like()` operator
  - Removed unused legacy date parameters (`dateRange`, `startDate`, `endDate`)
  - Removed unused `date-fns` import
  - API now consistently returns paginated list format for all filter combinations

### Fixed
- **Execution ID Search**: Fixed execution ID filter not working in list view
  - Previous implementation incorrectly returned single object instead of paginated list
  - Now properly filters executions list by exact execution ID match
  - Both execution ID and execution name filters work independently and together

### Technical
- **Files Changed**: 3 files, +68 insertions, -88 deletions
  - `app/api/executions/route.ts` - Simplified filtering logic, removed single lookup
  - `app/dashboard/executions/ExecutionFilters.tsx` - Split search into ID and name fields
  - `app/dashboard/page.tsx` - Added version badge display

### API Changes
| Parameter | Old Behavior | New Behavior |
|-----------|--------------|--------------|
| `search` | Partial match on name | **Removed** |
| `executionId` | Single execution lookup | List filter (exact match) |
| `executionName` | — | New: List filter (partial match) |
| `dateRange` | Preset ranges (today, 7d, 30d, 90d) | **Removed** (use `startTimeFrom`/`startTimeTo`) |
| `startDate`/`endDate` | Legacy date filters | **Removed** (use `startTimeFrom`/`startTimeTo`) |

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
