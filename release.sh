#!/bin/bash
# Release Helper for State Machine Portal (Next.js Application)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Icons
CHECK="✓"
CROSS="✗"
ROCKET="🚀"
DOCKER="🐳"

info() { echo -e "${BLUE}→${NC} $1"; }
success() { echo -e "${GREEN}${CHECK}${NC} $1"; }
error() { echo -e "${RED}${CROSS}${NC} $1"; }
warning() { echo -e "${YELLOW}!${NC} $1"; }

# Validate version format
validate_version() {
    local version="$1"
    if [[ ! $version =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
        error "Invalid version: $version (expected vX.Y.Z)"
        return 1
    fi

    if git rev-parse "$version" >/dev/null 2>&1; then
        error "Tag $version already exists"
        return 1
    fi

    success "Version format valid"
    return 0
}

# Check prerequisites
check_prereqs() {
    info "Checking prerequisites..."

    # Clean git state
    if [ -n "$(git status --porcelain)" ]; then
        error "Uncommitted changes detected"
        git status --short
        return 1
    fi
    success "Git working directory clean"

    # On main branch
    local branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$branch" != "main" ] && [ "$branch" != "master" ]; then
        warning "Not on main/master branch (current: $branch)"
    fi

    # Check Node.js and npm
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        return 1
    fi

    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        return 1
    fi

    # Check Docker
    if ! command -v docker &> /dev/null; then
        warning "Docker is not installed (required for testing image)"
    fi

    success "Prerequisites satisfied"
    return 0
}

# Run tests and build
run_tests_and_build() {
    info "Running tests and building application..."

    # Install dependencies
    if ! npm ci >/dev/null 2>&1; then
        error "Failed to install dependencies"
        return 1
    fi

    # Run linting
#    if ! npm run lint >/dev/null 2>&1; then
#        error "Linting failed"
#        return 1
#    fi
#    success "Linting passed"

#    # Run type checking
#    if ! npm run type-check >/dev/null 2>&1; then
#        error "Type checking failed"
#        return 1
#    fi
#    success "Type checking passed"

    # Build the application
    if ! npm run build >/dev/null 2>&1; then
        error "Build failed"
        return 1
    fi
    success "Application built successfully"

    return 0
}

# Check CHANGELOG
check_changelog() {
    local version="${1#v}"

    info "Checking CHANGELOG..."

    if [ ! -f "CHANGELOG.md" ]; then
        error "CHANGELOG.md not found"
        return 1
    fi

    if grep -q "## \[$version\]" CHANGELOG.md; then
        success "CHANGELOG has entry for $version"
        return 0
    else
        error "No CHANGELOG entry for $version"
        echo ""
        echo "Add this to CHANGELOG.md:"
        echo "## [$version] - $(date +%Y-%m-%d)"
        echo ""
        echo "- Feature: Added batch execution functionality"
        echo "- Feature: Enhanced date-time picker with time selection"
        echo "- Fix: Resolved CSS parsing issues in calendar component"
        echo "- Enhancement: Improved Docker support and deployment"
        return 1
    fi
}

# Update package.json version
update_package_version() {
    local version="${1#v}"

    info "Updating package.json version to $version..."

    if command -v jq &> /dev/null; then
        # Use jq if available (more reliable)
        jq --arg v "$version" '.version = $v' package.json > package.json.tmp && mv package.json.tmp package.json
    else
        # Fallback to sed (less reliable but works)
        sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" package.json
        rm -f package.json.bak
    fi

    # Stage the change
    git add package.json
    success "package.json version updated"
    return 0
}

# Test Docker image locally
test_docker_image() {
    local version="$1"
    local image_name="state-machine-amz-portal:$version"

    if ! command -v docker &> /dev/null; then
        warning "Docker not available, skipping Docker test"
        return 0
    fi

    info "Building and testing Docker image..."

    # Build Docker image
    if ! docker build -t "$image_name" . >/dev/null 2>&1; then
        error "Docker build failed"
        return 1
    fi

    # Test that image can start
    info "Testing Docker image startup..."
    container_id=$(docker run -d -p 3000:3000 --env-file .env.example "$image_name")

    # Wait for container to start
    sleep 5

    # Check if container is still running
    if docker ps -q --filter "id=$container_id" | grep -q .; then
        success "Docker image starts successfully"
        docker stop "$container_id" >/dev/null 2>&1
        docker rm "$container_id" >/dev/null 2>&1
    else
        error "Docker container failed to start"
        docker logs "$container_id" 2>/dev/null || true
        docker rm "$container_id" >/dev/null 2>&1
        return 1
    fi

    # Clean up image
    docker rmi "$image_name" >/dev/null 2>&1 || true

    return 0
}

# Create and push tag
create_tag() {
    local version="$1"

    info "Creating tag $version..."

    # Commit package.json version update if it exists
    if git diff --cached --quiet; then
        # No staged changes, create tag directly
        if git tag -a "$version" -m "Release $version"; then
            success "Tag created"
        else
            error "Failed to create tag"
            return 1
        fi
    else
        # Has staged changes (package.json), commit them first
        if git commit -m "chore(release): version $version"; then
            success "Release commit created"
            if git tag -a "$version" -m "Release $version"; then
                success "Tag created"
            else
                error "Failed to create tag"
                return 1
            fi
        else
            error "Failed to create release commit"
            return 1
        fi
    fi

    info "Pushing changes and tag to origin..."
    if git push origin HEAD --tags; then
        success "Changes and tag pushed"
        return 0
    else
        error "Failed to push changes and tag"
        return 1
    fi
}

# Show next steps
show_next_steps() {
    local version="$1"
    local repo_name=$(basename "$(git config --get remote.origin.url)" .git)
    local owner=$(git config --get remote.origin.url | sed -E 's/.*github.com[:\/]([^\/]+)\/.*/\1/')

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}${ROCKET} Release $version created!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "GitHub Actions will now:"
    echo "  • Build multi-platform Docker images"
    echo "  • Push to Docker Hub and GitHub Container Registry"
    echo "  • Create GitHub Release"
    echo "  • Run security vulnerability scanning"
    echo ""
    echo "Docker Images (available in ~10 minutes):"
    echo "  ${DOCKER} Docker Hub:    ${owner}/${repo_name}:${version}"
    echo "  ${DOCKER} GitHub CR:     ghcr.io/${owner}/${repo_name}:${version}"
    echo ""
    echo "GitHub Release:"
    echo "  📦 https://github.com/${owner}/${repo_name}/releases/tag/${version}"
    echo ""
    echo "Run locally with Docker:"
    echo "  docker run -d \\"
    echo "    -p 3000:3000 \\"
    echo "    -e STATE_MACHINE_SERVICE_URL=http://your-service:9090 \\"
    echo "    -e DATABASE_URL=postgresql://user:pass@host:5432/db \\"
    echo "    ${owner}/${repo_name}:${version}"
    echo ""
}

# Main release function
main() {
    if [ $# -ne 1 ]; then
        echo "Usage: $0 <version>"
        echo "Example: $0 v1.0.0"
        exit 1
    fi

    local version="$1"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  State Machine Portal Release: $version"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Validation steps
    validate_version "$version" || exit 1
    check_prereqs || exit 1
    check_changelog "$version" || exit 1

    # Quality checks
    run_tests_and_build || exit 1

    # Update version in package.json
    update_package_version "$version" || exit 1

    # Test Docker image
    test_docker_image "$version" || exit 1

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Ready to release $version"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    read -p "Continue? [y/N] " -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Release cancelled"
        # Clean up staged changes
        git reset --quiet
        exit 0
    fi

    # Create and push tag
    create_tag "$version" || exit 1

    # Success!
    show_next_steps "$version"
}

main "$@"
