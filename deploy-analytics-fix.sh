#!/bin/bash

# Deploy Analytics Fix Script for VPS
# Skrip untuk men-deploy perbaikan dashboard analytics ke VPS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/path/to/mstafix"  # Update this with your VPS path
BACKUP_DIR="/tmp/mstafix-backup-$(date +%Y%m%d-%H%M%S)"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."

    # Check if docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose is not installed."
        exit 1
    fi

    # Check if project directory exists
    if [ ! -d "$PROJECT_DIR" ]; then
        log_error "Project directory $PROJECT_DIR does not exist."
        log_info "Please update PROJECT_DIR variable in this script."
        exit 1
    fi

    log_success "Requirements check passed."
}

backup_current_state() {
    log_info "Creating backup..."

    mkdir -p "$BACKUP_DIR"

    # Backup current code
    cp -r "$PROJECT_DIR" "$BACKUP_DIR/"

    # Backup docker-compose state
    cd "$PROJECT_DIR"
    docker-compose ps > "$BACKUP_DIR/docker-compose-state.txt" 2>/dev/null || true

    log_success "Backup created at: $BACKUP_DIR"
}

pull_latest_changes() {
    log_info "Pulling latest changes from git..."

    cd "$PROJECT_DIR"

    # Check if git repo
    if [ ! -d ".git" ]; then
        log_warning "Not a git repository. Skipping git pull."
        return 0
    fi

    # Pull latest changes
    git fetch origin
    git pull origin main || git pull origin master

    log_success "Latest changes pulled successfully."
}

build_services() {
    log_info "Building services..."

    cd "$PROJECT_DIR"

    # Build manage-soal-service
    log_info "Building manage-soal-service..."
    cd manage-soal-service
    npm install --production
    cd ..

    # Build web-client
    log_info "Building web-client..."
    cd web-client
    npm install --production
    npm run build
    cd ..

    log_success "Services built successfully."
}

deploy_services() {
    log_info "Deploying services..."

    cd "$PROJECT_DIR"

    # Method 1: Using docker-compose (most common)
    if [ -f "docker-compose.yml" ]; then
        log_info "Using docker-compose for deployment..."

        # Restart specific services
        docker-compose restart manage-soal-service || log_warning "Failed to restart manage-soal-service"
        docker-compose restart web-client || log_warning "Failed to restart web-client"

        # Wait for services to be ready
        sleep 10

    # Method 2: Using docker swarm
    elif docker service ls >/dev/null 2>&1; then
        log_info "Using docker swarm for deployment..."

        # Update services
        docker service update mstafix_manage-soal-service || log_warning "Failed to update manage-soal-service"
        docker service update mstafix_web-client || log_warning "Failed to update web-client"

        # Wait for services to be ready
        sleep 15

    else
        log_error "Cannot determine deployment method. Please deploy manually."
        exit 1
    fi

    log_success "Services deployed successfully."
}

verify_deployment() {
    log_info "Verifying deployment..."

    cd "$PROJECT_DIR"

    # Check service status
    if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
        log_info "Checking docker-compose services..."
        docker-compose ps
    elif docker service ls >/dev/null 2>&1; then
        log_info "Checking docker swarm services..."
        docker service ls | grep mstafix
    fi

    # Wait for services to be fully ready
    log_info "Waiting for services to be ready..."
    sleep 20

    # Test endpoints (if curl is available)
    if command -v curl &> /dev/null; then
        log_info "Testing endpoints..."

        # Test web-client health
        if curl -f -s -o /dev/null "http://localhost:3000/api/health" 2>/dev/null; then
            log_success "Web-client is responding."
        else
            log_warning "Web-client health check failed."
        fi

        # Test manage-soal-service health
        if curl -f -s -o /dev/null "http://localhost:3003/health" 2>/dev/null; then
            log_success "Manage-soal-service is responding."
        else
            log_warning "Manage-soal-service health check failed."
        fi
    fi

    log_success "Deployment verification completed."
}

show_post_deployment_info() {
    log_info "Post-deployment information:"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Open your admin dashboard in browser"
    echo "2. Check browser console for analytics logs"
    echo "3. Verify that Recent Activity shows real data (not mock)"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "- Check logs: docker-compose logs web-client"
    echo "- Check logs: docker-compose logs manage-soal-service"
    echo "- Check logs: docker-compose logs auth-service"
    echo ""
    echo "📂 Backup location: $BACKUP_DIR"
    echo ""
    echo "🚀 If everything works, you can remove the backup:"
    echo "   rm -rf $BACKUP_DIR"
    echo ""
}

rollback() {
    log_warning "Rolling back deployment..."

    if [ -d "$BACKUP_DIR" ]; then
        cd "$PROJECT_DIR"

        # Stop services
        docker-compose down || true

        # Restore backup
        cp -r "$BACKUP_DIR/mstafix/"* .

        # Restart services
        docker-compose up -d

        log_success "Rollback completed."
    else
        log_error "Backup directory not found. Cannot rollback automatically."
    fi
}

# Main execution
main() {
    echo "🚀 Starting Analytics Fix Deployment"
    echo "===================================="
    echo ""

    # Trap for cleanup on exit
    trap 'echo ""; log_info "Deployment interrupted. Use: $0 rollback to restore previous state."' INT TERM

    case "${1:-deploy}" in
        "deploy")
            check_requirements
            backup_current_state
            pull_latest_changes
            build_services
            deploy_services
            verify_deployment
            show_post_deployment_info
            ;;
        "rollback")
            rollback
            ;;
        "verify")
            verify_deployment
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  deploy    - Deploy analytics fix (default)"
            echo "  rollback  - Rollback to previous state"
            echo "  verify    - Verify current deployment"
            echo "  help      - Show this help message"
            echo ""
            echo "Before running, update PROJECT_DIR variable in this script."
            ;;
        *)
            log_error "Unknown command: $1"
            echo "Use '$0 help' for usage information."
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
