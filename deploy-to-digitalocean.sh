#!/bin/bash

# Ticketing System - Digital Ocean Deployment Script
# This script automates the complete deployment process

set -e  # Exit on any error

echo "========================================"
echo "Ticketing System Deployment Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use: sudo bash deploy-to-digitalocean.sh)"
    exit 1
fi

print_info "Starting deployment process..."
echo ""

# Step 1: Update system packages
print_info "Step 1/8: Updating system packages..."
apt update && apt upgrade -y
print_success "System packages updated"
echo ""

# Step 2: Install Docker
print_info "Step 2/8: Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    print_success "Docker installed successfully"
else
    print_success "Docker already installed"
fi
docker --version
echo ""

# Step 3: Install Docker Compose
print_info "Step 3/8: Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    apt install docker-compose -y
    print_success "Docker Compose installed successfully"
else
    print_success "Docker Compose already installed"
fi
docker-compose --version
echo ""

# Step 4: Create application directory
print_info "Step 4/8: Setting up application directory..."
mkdir -p /var/www/ticketing-system
cd /var/www/ticketing-system
print_success "Application directory created"
echo ""

# Step 5: Clone repository
print_info "Step 5/8: Cloning repository from GitHub..."
if [ -d ".git" ]; then
    print_info "Repository already exists, pulling latest changes..."
    git pull origin main
else
    git clone https://github.com/HarshitSingh-PM/simple-ticketing-system.git .
fi
print_success "Repository cloned successfully"
echo ""

# Step 6: Configure environment variables
print_info "Step 6/8: Configuring environment variables..."
if [ -f ".env.production" ]; then
    cp .env.production .env
    print_success "Using .env.production file"
else
    print_error ".env.production file not found!"
    print_info "Please create .env file manually before continuing"
    print_info "Required variables:"
    echo "  - DB_PASSWORD"
    echo "  - JWT_SECRET"
    echo "  - SMTP_USER (your Gmail address)"
    echo "  - SMTP_PASSWORD (Google app password)"
    echo "  - SMTP_FROM (your Gmail address)"
    echo "  - FRONTEND_URL (http://your-droplet-ip)"
    echo "  - VITE_API_URL (http://your-droplet-ip/api)"
    exit 1
fi

# Prompt for configuration if needed
read -p "Enter your Gmail address: " GMAIL_ADDRESS
read -p "Enter your droplet IP or domain: " DROPLET_ADDRESS

# Update .env file with user inputs
sed -i "s|SMTP_USER=.*|SMTP_USER=$GMAIL_ADDRESS|g" .env
sed -i "s|SMTP_FROM=.*|SMTP_FROM=$GMAIL_ADDRESS|g" .env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://$DROPLET_ADDRESS|g" .env
sed -i "s|VITE_API_URL=.*|VITE_API_URL=http://$DROPLET_ADDRESS/api|g" .env

print_success "Environment variables configured"
echo ""

# Step 7: Configure firewall
print_info "Step 7/8: Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
print_success "Firewall configured"
echo ""

# Step 8: Build and start containers
print_info "Step 8/8: Building and starting Docker containers..."
print_info "This may take several minutes on first run..."
docker-compose down 2>/dev/null || true
docker-compose up -d --build

# Wait for services to be ready
print_info "Waiting for services to start..."
sleep 10

# Check service status
docker-compose ps

print_success "Deployment completed successfully!"
echo ""
echo "========================================"
echo "Deployment Summary"
echo "========================================"
echo ""
echo "Application URL: http://$DROPLET_ADDRESS"
echo "API URL: http://$DROPLET_ADDRESS/api"
echo ""
echo "Default Admin Login:"
echo "  Email: admin@system.com"
echo "  Password: password"
echo "  (You will be forced to change this on first login)"
echo ""
echo "Useful Commands:"
echo "  View logs: docker-compose logs -f"
echo "  Restart: docker-compose restart"
echo "  Stop: docker-compose down"
echo "  Update: git pull && docker-compose up -d --build"
echo ""
print_success "Deployment complete! Visit http://$DROPLET_ADDRESS to access your ticketing system"
