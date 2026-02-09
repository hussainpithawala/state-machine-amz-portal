# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-09

### Added

#### Core Features
- **Dashboard**: Real-time statistics, service health monitoring, and execution overview
- **State Machines Management**: Complete CRUD operations for AWS Step Functions-compatible state machines
- **Executions Monitoring**: Comprehensive execution tracking with detailed state timeline visualization
- **Execution Launch**: Individual execution launching with custom input parameters
- **Batch Execution**: Advanced batch execution with source filtering and configurable modes

#### User Experience
- **Date-Time Picker**: Enhanced date and time selection with automatic Unix timestamp conversion
- **Advanced Filtering**: Comprehensive filtering options for executions and batch operations
- **Responsive Design**: Mobile-friendly interface with optimized layouts
- **Toast Notifications**: User-friendly feedback system using Sonner
- **JSON Viewers**: Syntax-highlighted input/output viewers for execution data

#### Technical Features
- **Service Health Check**: Real-time monitoring of downstream Go service availability
- **Multi-platform Docker Support**: Optimized images for both amd64 and arm64 architectures
- **GitHub Actions Integration**: Automated build, test, and release workflows
- **Security Scanning**: Vulnerability scanning with Trivy integration

### Changed

#### Architecture
- **Proxy Architecture**: Frontend validates requests and forwards to downstream Go service
- **Server Components**: Optimized performance with Next.js Server Components
- **Decoupled Design**: Clear separation between presentation layer and business logic

#### Performance
- **Optimized Data Fetching**: Efficient API routes with proper caching strategies
- **Suspense Boundaries**: Improved loading states and user experience
- **Bundle Optimization**: Multi-stage Docker builds for minimal image size

#### Configuration
- **Environment-driven**: All configuration via environment variables
- **Non-root Container**: Security best practices with non-root user in Docker

### Fixed

- **CSS Parsing Issues**: Resolved calendar component styling problems
- **Drizzle ORM Compatibility**: Updated query syntax for latest Drizzle versions
- **TypeScript Errors**: Fixed type mismatches in database queries and component props
- **Suspense Boundary Errors**: Proper handling of client-side hooks in Server Components

### Removed

- **Local Database Persistence**: Removed redundant local state machine storage (handled by downstream service)
- **Manual Timestamp Input**: Replaced with user-friendly date-time picker

### Security

- **Docker Security**: Non-root user execution and minimal base image
- **Input Validation**: Comprehensive Zod validation for all API endpoints
- **Vulnerability Scanning**: Automated security scanning in CI/CD pipeline

### Documentation

- **Comprehensive README**: Setup instructions, usage examples, and deployment guides
- **Environment Documentation**: Clear explanation of all required environment variables
- **Docker Usage Examples**: Ready-to-run Docker commands for various scenarios
- **Release Process**: Automated release script with quality checks

### Dependencies

#### Added
- **Next.js 16**: With Turbopack for optimal development experience
- **Drizzle ORM**: Type-safe database queries with PostgreSQL
- **Shadcn UI**: Customizable component library with Tailwind CSS
- **Sonner**: Modern toast notification system
- **React Day Picker**: Date and time selection components
- **Zod**: Schema validation and type safety

#### Updated
- **TypeScript**: Full type safety across the entire codebase
- **Tailwind CSS**: Utility-first styling with custom theme
- **Lucide React**: Consistent icon system

### Deployment

#### Docker
- Multi-stage build process for optimized image size
- Health check endpoint for container orchestration
- Environment variable configuration support
- Multi-architecture support (linux/amd64, linux/arm64)

#### GitHub Actions
- Automated Docker image building and publishing
- Push to both Docker Hub and GitHub Container Registry
- Automatic GitHub Release creation on git tags
- Security vulnerability scanning with Trivy

### Configuration

#### Environment Variables
- `STATE_MACHINE_SERVICE_URL`: URL of downstream Go state machine service (default: `http://localhost:9090`)
- `DATABASE_URL`: PostgreSQL connection string for portal metadata
- `PORT`: Application port (default: `3000`)

#### Required Services
- **Downstream State Machine Service**: Go-based service running on port 9090
- **PostgreSQL Database**: For storing portal metadata and execution history

### Getting Started

```bash
# Clone repository
git clone https://github.com/hussainpithawala/state-machine-amz-portal.git
cd state-machine-amz-portal

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your service URLs

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
