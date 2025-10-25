#!/bin/bash

# Database Console Script
# Opens an interactive PostgreSQL console

set -e

# Colors
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

DB_CONTAINER="where2meet-postgres"
DB_NAME="where2meet"
DB_USER="where2meet"

# Check if container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo -e "${YELLOW}PostgreSQL container is not running${NC}"
    echo "Start it with: cd server/server && docker compose up -d"
    exit 1
fi

echo -e "${GREEN}Connecting to PostgreSQL console...${NC}"
echo -e "${YELLOW}Type '\\q' or 'exit' to quit${NC}\n"

# Connect to database
docker exec -it "$DB_CONTAINER" psql -U "$DB_USER" "$DB_NAME"
