#!/bin/bash
set -e

# Configuration
REMOTE_USER="root"
REMOTE_HOST="72.62.190.235"
REMOTE_DIR="/app/better-chatbot"
SSH_OPTS="-o StrictHostKeyChecking=no" # Consider removing for stricter security if keys are managed

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting deployment to ${REMOTE_HOST}...${NC}"

# Check for .env file
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found. Please create one before deploying.${NC}"
    exit 1
fi

# 0. Ensure remote directory exists
echo "Creating remote directory..."
ssh $SSH_OPTS ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_DIR}"

# 1. Sync files to remote server
echo "Syncing files..."
rsync -avz --delete --exclude 'node_modules' --exclude '.next' --exclude '.git' \
    -e "ssh $SSH_OPTS" \
    ./ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}

# 2. Run deployment commands on remote server
echo "Executing remote commands..."
ssh $SSH_OPTS ${REMOTE_USER}@${REMOTE_HOST} << EOF
    set -e
    cd ${REMOTE_DIR}
    
    # Ensure Docker is installed
    if ! command -v docker &> /dev/null; then
        echo "Docker not found. Installing Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
        echo "Docker installed successfully."
    fi

    # Build and start services
    echo "Building and starting services..."
    docker compose -f docker/compose.prod.yml up -d --build

    # Run migrations
    echo "Running migrations..."
    docker compose -f docker/compose.prod.yml run --rm migrator

    # Prune unused images to save space
    docker image prune -f

    echo "Deployment successfully completed!"
EOF

echo -e "${GREEN}Deployment finished! Application should be available at http://${REMOTE_HOST}:3000${NC}"
