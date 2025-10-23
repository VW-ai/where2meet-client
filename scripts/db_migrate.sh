#!/bin/bash

# Database Migration Helper Script
# Simplifies common Alembic operations

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/../server/server"

cd "$SERVER_DIR"
source venv/bin/activate

# Show usage
show_usage() {
    echo -e "${BLUE}Database Migration Helper${NC}\n"
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  create <message>  - Create a new migration"
    echo "  upgrade           - Run pending migrations"
    echo "  downgrade [n]     - Rollback n migrations (default: 1)"
    echo "  status            - Show migration status"
    echo "  history           - Show migration history"
    echo "  current           - Show current migration"
    echo ""
    echo "Examples:"
    echo "  $0 create 'add users table'"
    echo "  $0 upgrade"
    echo "  $0 downgrade"
    echo "  $0 downgrade 2"
    echo "  $0 status"
}

# Check for command
if [ -z "$1" ]; then
    show_usage
    exit 0
fi

COMMAND="$1"

case "$COMMAND" in
    create)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Migration message required${NC}"
            echo "Usage: $0 create <message>"
            exit 1
        fi

        echo -e "${YELLOW}Creating new migration...${NC}"
        alembic revision --autogenerate -m "$2"
        echo -e "${GREEN}✓ Migration created${NC}"
        echo -e "\n${YELLOW}Review the migration file, then run:${NC}"
        echo -e "  $0 upgrade"
        ;;

    upgrade)
        echo -e "${YELLOW}Running migrations...${NC}"
        alembic upgrade head
        echo -e "${GREEN}✓ Migrations complete${NC}"
        ;;

    downgrade)
        STEPS="${2:-1}"
        echo -e "${YELLOW}Rolling back ${STEPS} migration(s)...${NC}"
        alembic downgrade -${STEPS}
        echo -e "${GREEN}✓ Rollback complete${NC}"
        ;;

    status)
        echo -e "${BLUE}Migration Status:${NC}\n"
        alembic current -v
        echo ""
        alembic heads
        ;;

    history)
        echo -e "${BLUE}Migration History:${NC}\n"
        alembic history -v
        ;;

    current)
        echo -e "${BLUE}Current Migration:${NC}\n"
        alembic current
        ;;

    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}\n"
        show_usage
        exit 1
        ;;
esac
