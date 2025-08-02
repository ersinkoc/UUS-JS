#!/bin/bash

# UUS.js Deployment Script

set -e

echo "🚀 UUS.js Deployment Script"
echo "=========================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}Error: pnpm is not installed${NC}"
    echo "Install it with: npm install -g pnpm"
    exit 1
fi

# Parse command line arguments
DEPLOY_TARGET=${1:-"all"}
ENVIRONMENT=${2:-"production"}

echo -e "${BLUE}Deploy Target: $DEPLOY_TARGET${NC}"
echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"

# Install dependencies
echo -e "\n${GREEN}Installing dependencies...${NC}"
pnpm install --frozen-lockfile

# Build packages
echo -e "\n${GREEN}Building packages...${NC}"
pnpm build

# Run tests
echo -e "\n${GREEN}Running tests...${NC}"
pnpm test

# Function to deploy to Vercel
deploy_vercel() {
    echo -e "\n${GREEN}Deploying to Vercel...${NC}"
    
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}Error: Vercel CLI is not installed${NC}"
        echo "Install it with: npm install -g vercel"
        return 1
    fi
    
    if [ "$ENVIRONMENT" == "production" ]; then
        vercel --prod
    else
        vercel
    fi
}

# Function to deploy to Netlify
deploy_netlify() {
    echo -e "\n${GREEN}Deploying to Netlify...${NC}"
    
    if ! command -v netlify &> /dev/null; then
        echo -e "${RED}Error: Netlify CLI is not installed${NC}"
        echo "Install it with: npm install -g netlify-cli"
        return 1
    fi
    
    if [ "$ENVIRONMENT" == "production" ]; then
        netlify deploy --prod
    else
        netlify deploy
    fi
}

# Function to deploy to npm
deploy_npm() {
    echo -e "\n${GREEN}Publishing to npm...${NC}"
    
    # Check if logged in to npm
    if ! npm whoami &> /dev/null; then
        echo -e "${RED}Error: Not logged in to npm${NC}"
        echo "Login with: npm login"
        return 1
    fi
    
    # Publish packages
    pnpm changeset publish
}

# Function to deploy Docker images
deploy_docker() {
    echo -e "\n${GREEN}Building Docker images...${NC}"
    
    docker build -t uusjs/core:latest -f deploy/docker/Dockerfile .
    
    if [ "$ENVIRONMENT" == "production" ]; then
        echo -e "${GREEN}Pushing to Docker Hub...${NC}"
        docker push uusjs/core:latest
    fi
}

# Deploy based on target
case $DEPLOY_TARGET in
    "vercel")
        deploy_vercel
        ;;
    "netlify")
        deploy_netlify
        ;;
    "npm")
        deploy_npm
        ;;
    "docker")
        deploy_docker
        ;;
    "all")
        deploy_vercel
        deploy_netlify
        deploy_npm
        deploy_docker
        ;;
    *)
        echo -e "${RED}Unknown deploy target: $DEPLOY_TARGET${NC}"
        echo "Available targets: vercel, netlify, npm, docker, all"
        exit 1
        ;;
esac

echo -e "\n${GREEN}✅ Deployment completed successfully!${NC}"