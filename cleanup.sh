#!/bin/bash

# Deez NATS - Full Cleanup Script
# This script completely removes all containers, volumes, images, and data
# Use with caution - this will delete everything!

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to confirm cleanup
confirm_cleanup() {
    echo
    print_warning "This script will perform a COMPLETE cleanup of your Deez NATS environment:"
    echo "  • Stop and remove all Docker containers"
    echo "  • Remove all Docker volumes (including database data)"
    echo "  • Remove all Docker images"
    echo "  • Clean Docker build cache"
    echo "  • Remove all project logs and build artifacts"
    echo "  • Remove all NATS data"
    echo "  • Remove all PostgreSQL data"
    echo
    echo -e "${RED}⚠️  WARNING: This will delete ALL data and cannot be undone! ⚠️${NC}"
    echo
    read -p "Are you sure you want to continue? Type 'YES' to confirm: " confirmation
    
    if [ "$confirmation" != "YES" ]; then
        print_warning "Cleanup cancelled."
        exit 0
    fi
}

# Function to stop and remove containers
cleanup_containers() {
    print_status "Stopping and removing Docker containers..."
    
    # Stop all running containers
    if docker ps -q | grep -q .; then
        docker stop $(docker ps -q) 2>/dev/null || true
        print_success "Stopped all running containers"
    else
        print_status "No running containers found"
    fi
    
    # Remove all containers
    if docker ps -aq | grep -q .; then
        docker rm $(docker ps -aq) 2>/dev/null || true
        print_success "Removed all containers"
    else
        print_status "No containers found"
    fi
}

# Function to remove volumes
cleanup_volumes() {
    print_status "Removing Docker volumes..."
    
    # Remove project-specific volumes
    if docker volume ls -q | grep -q "deez-nats"; then
        docker volume rm $(docker volume ls -q | grep "deez-nats") 2>/dev/null || true
        print_success "Removed project volumes"
    else
        print_status "No project volumes found"
    fi
    
    # Remove all unused volumes (optional - uncomment if you want to remove ALL volumes)
    # print_status "Removing all unused volumes..."
    # docker volume prune -f
}

# Function to remove images
cleanup_images() {
    print_status "Removing Docker images..."
    
    # Remove project-specific images
    if docker images -q | grep -q .; then
        docker rmi $(docker images -q) 2>/dev/null || true
        print_success "Removed all Docker images"
    else
        print_status "No Docker images found"
    fi
}

# Function to clean Docker system
cleanup_docker_system() {
    print_status "Cleaning Docker system..."
    
    # Remove build cache
    docker builder prune -f
    print_success "Removed Docker build cache"
    
    # Remove unused networks
    docker network prune -f
    print_success "Removed unused networks"
    
    # Remove unused data
    docker system prune -f
    print_success "Cleaned Docker system"
}

# Function to clean project files
cleanup_project_files() {
    print_status "Cleaning project files..."
    
    # Remove build artifacts
    if [ -d "services/api/dist" ]; then
        rm -rf services/api/dist
        print_success "Removed API build artifacts"
    fi
    
    if [ -d "services/worker-sql-batcher/dist" ]; then
        rm -rf services/worker-sql-batcher/dist
        print_success "Removed worker build artifacts"
    fi
    
    # Remove node_modules
    if [ -d "services/api/node_modules" ]; then
        rm -rf services/api/node_modules
        print_success "Removed API node_modules"
    fi
    
    if [ -d "services/worker-sql-batcher/node_modules" ]; then
        rm -rf services/worker-sql-batcher/node_modules
        print_success "Removed worker node_modules"
    fi
    
    # Remove logs
    if [ -d "services/api/logs" ]; then
        rm -rf services/api/logs
        print_success "Removed API logs"
    fi
    
    # Remove NATS data
    if [ -d "infra/nats/nats-data" ]; then
        rm -rf infra/nats/nats-data
        print_success "Removed NATS data"
    fi
    
    # Remove PostgreSQL data (if using local volumes)
    if [ -d "infra/postgres/data" ]; then
        rm -rf infra/postgres/data
        print_success "Removed PostgreSQL data"
    fi
}

# Function to clean Docker Compose
cleanup_docker_compose() {
    print_status "Cleaning Docker Compose..."
    
    # Remove Docker Compose stack
    if docker-compose ps -q | grep -q .; then
        docker-compose down -v --remove-orphans
        print_success "Removed Docker Compose stack"
    else
        print_status "No Docker Compose stack found"
    fi
}

# Function to verify cleanup
verify_cleanup() {
    print_status "Verifying cleanup..."
    
    # Check containers
    if docker ps -aq | grep -q .; then
        print_warning "Some containers still exist:"
        docker ps -a
    else
        print_success "All containers removed"
    fi
    
    # Check volumes
    if docker volume ls -q | grep -q .; then
        print_warning "Some volumes still exist:"
        docker volume ls
    else
        print_success "All volumes removed"
    fi
    
    # Check images
    if docker images -q | grep -q .; then
        print_warning "Some images still exist:"
        docker images
    else
        print_success "All images removed"
    fi
    
    # Check project directories
    if [ -d "services/api/dist" ] || [ -d "services/worker-sql-batcher/dist" ]; then
        print_warning "Some build artifacts still exist"
    else
        print_success "All build artifacts removed"
    fi
    
    if [ -d "services/api/node_modules" ] || [ -d "services/worker-sql-batcher/node_modules" ]; then
        print_warning "Some node_modules still exist"
    else
        print_success "All node_modules removed"
    fi
}

# Main cleanup function
main() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Deez NATS - Full Cleanup${NC}"
    echo -e "${BLUE}================================${NC}"
    echo
    
    # Check prerequisites
    check_docker
    
    # Confirm cleanup
    confirm_cleanup
    
    echo
    print_status "Starting full cleanup..."
    echo
    
    # Perform cleanup steps
    cleanup_docker_compose
    cleanup_containers
    cleanup_volumes
    cleanup_images
    cleanup_docker_system
    cleanup_project_files
    
    echo
    print_status "Cleanup completed. Verifying results..."
    echo
    
    # Verify cleanup
    verify_cleanup
    
    echo
    print_success "🎉 Full cleanup completed successfully!"
    echo
    print_status "Your Deez NATS environment is now completely clean."
    print_status "To start fresh, run: make up"
    echo
}

# Run main function
main "$@"
