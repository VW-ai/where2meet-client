#!/bin/bash

# Database Restore Script
# Restores database from a backup file

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DB_CONTAINER="where2meet-postgres"
DB_NAME="where2meet"
DB_USER="where2meet"
BACKUP_DIR="$(dirname "$0")/../backups/db"

# Check if backup file provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Available backups:${NC}"
    ls -lh "$BACKUP_DIR" 2>/dev/null || echo "No backups found"
    echo -e "\n${BLUE}Usage:${NC} $0 <backup_file>"
    echo -e "${BLUE}Example:${NC} $0 backups/db/where2meet_20250101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Check if container is running
if ! docker ps | grep -q "$DB_CONTAINER"; then
    echo -e "${RED}Error: PostgreSQL container is not running${NC}"
    echo -e "Start it with: cd server/server && docker compose up -d"
    exit 1
fi

# Confirm restore
echo -e "${RED}⚠️  WARNING: This will REPLACE the current database!${NC}"
echo -e "Backup file: ${BACKUP_FILE}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled${NC}"
    exit 0
fi

echo -e "\n${YELLOW}Creating safety backup before restore...${NC}"
SAFETY_BACKUP="$BACKUP_DIR/pre_restore_$(date +"%Y%m%d_%H%M%S").sql"
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" > "$SAFETY_BACKUP"
gzip "$SAFETY_BACKUP"
echo -e "${GREEN}✓ Safety backup created: ${SAFETY_BACKUP}.gz${NC}"

echo -e "\n${YELLOW}Restoring database...${NC}"

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    TEMP_FILE="/tmp/restore_temp.sql"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
else
    TEMP_FILE="$BACKUP_FILE"
fi

# Drop and recreate database
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS ${DB_NAME};"
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "CREATE DATABASE ${DB_NAME};"

# Restore backup
cat "$TEMP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" "$DB_NAME"

# Clean up temp file
if [[ "$BACKUP_FILE" == *.gz ]]; then
    rm "$TEMP_FILE"
fi

echo -e "${GREEN}✓ Database restored successfully${NC}"
echo -e "\n${YELLOW}Note: You may need to restart your backend server${NC}"
