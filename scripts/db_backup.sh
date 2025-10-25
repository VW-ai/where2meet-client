#!/bin/bash

# Database Backup Script
# Creates timestamped backups of your PostgreSQL database

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DB_CONTAINER="where2meet-postgres"
DB_NAME="where2meet"
DB_USER="where2meet"
BACKUP_DIR="$(dirname "$0")/../backups/db"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"

echo -e "${YELLOW}Starting database backup...${NC}"

# Check if container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo -e "${RED}Error: PostgreSQL container is not running${NC}"
    echo -e "Start it with: cd server/server && docker compose up -d"
    exit 1
fi

# Create backup
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Get file size
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo -e "${GREEN}✓ Backup created successfully${NC}"
echo -e "  File: ${BACKUP_FILE}"
echo -e "  Size: ${SIZE}"

# Clean up old backups (keep last 10)
echo -e "\n${YELLOW}Cleaning up old backups (keeping last 10)...${NC}"
cd "$BACKUP_DIR"
ls -t ${DB_NAME}_*.sql.gz | tail -n +11 | xargs rm -f 2>/dev/null || true

REMAINING=$(ls -1 ${DB_NAME}_*.sql.gz 2>/dev/null | wc -l | tr -d ' ')
echo -e "${GREEN}✓ ${REMAINING} backups retained${NC}"
