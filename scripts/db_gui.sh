#!/bin/bash

# Database GUI Setup Script
# Provides multiple options for visual database management

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/../server/server"

show_usage() {
    echo -e "${BLUE}Database GUI Management${NC}\n"
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  pgadmin-start   - Start pgAdmin in Docker"
    echo "  pgadmin-stop    - Stop pgAdmin"
    echo "  info            - Show connection details"
    echo "  install-guides  - Show installation guides for GUI tools"
    echo ""
    echo "Examples:"
    echo "  $0 pgadmin-start"
    echo "  $0 info"
}

start_pgadmin() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Starting pgAdmin 4${NC}"
    echo -e "${BLUE}========================================${NC}\n"

    cd "$SERVER_DIR"

    # Check if already running
    if docker ps | grep -q "where2meet-pgadmin"; then
        echo -e "${YELLOW}pgAdmin is already running${NC}"
        echo -e "${GREEN}Access at: ${BLUE}http://localhost:5050${NC}\n"
        return 0
    fi

    # Check if postgres is running
    if ! docker ps | grep -q "where2meet-postgres"; then
        echo -e "${RED}PostgreSQL is not running${NC}"
        echo -e "Start it first with: ./start_all.sh"
        exit 1
    fi

    echo -e "${YELLOW}Starting pgAdmin container...${NC}"

    # Start pgAdmin with proper port mapping
    docker run -d \
        --name where2meet-pgadmin \
        -p 5050:80 \
        -e PGADMIN_DEFAULT_EMAIL=admin@where2meet.com \
        -e PGADMIN_DEFAULT_PASSWORD=admin \
        -e PGADMIN_CONFIG_SERVER_MODE=False \
        -e PGADMIN_CONFIG_MASTER_PASSWORD_REQUIRED=False \
        dpage/pgadmin4:latest

    echo -e "${GREEN}✓ pgAdmin started${NC}\n"

    # Wait for pgAdmin to start
    echo -e "${YELLOW}Waiting for pgAdmin to be ready...${NC}"
    sleep 10

    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}  pgAdmin Ready!${NC}"
    echo -e "${GREEN}========================================${NC}\n"

    echo -e "${BLUE}Access pgAdmin:${NC}"
    echo -e "  URL:      ${GREEN}http://localhost:5050${NC}"
    echo -e "  Email:    ${GREEN}admin@where2meet.com${NC}"
    echo -e "  Password: ${GREEN}admin${NC}\n"

    echo -e "${YELLOW}First Time Setup:${NC}"
    echo -e "  1. Click 'Add New Server'"
    echo -e "  2. General Tab:"
    echo -e "     Name: ${GREEN}Where2Meet${NC}"
    echo -e "  3. Connection Tab:"
    echo -e "     Host: ${GREEN}host.docker.internal${NC} (Mac/Windows) or ${GREEN}172.17.0.1${NC} (Linux)"
    echo -e "     Port: ${GREEN}5432${NC}"
    echo -e "     Database: ${GREEN}where2meet${NC}"
    echo -e "     Username: ${GREEN}where2meet${NC}"
    echo -e "     Password: ${GREEN}where2meet${NC}"
    echo -e "  4. Click 'Save'\n"

    echo -e "${YELLOW}To stop pgAdmin:${NC}"
    echo -e "  ${BLUE}$0 pgadmin-stop${NC}\n"

    # Open browser
    if command -v open > /dev/null; then
        echo -e "${GREEN}Opening browser...${NC}"
        sleep 2
        open http://localhost:5050
    fi
}

stop_pgadmin() {
    echo -e "${YELLOW}Stopping pgAdmin...${NC}"

    if docker ps | grep -q "where2meet-pgadmin"; then
        docker stop where2meet-pgadmin
        docker rm where2meet-pgadmin
        echo -e "${GREEN}✓ pgAdmin stopped${NC}"
    else
        echo -e "${YELLOW}pgAdmin is not running${NC}"
    fi
}

show_connection_info() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Database Connection Info${NC}"
    echo -e "${BLUE}========================================${NC}\n"

    echo -e "${YELLOW}Connection Details:${NC}"
    echo -e "  Host:     ${GREEN}localhost${NC}"
    echo -e "  Port:     ${GREEN}5432${NC}"
    echo -e "  Database: ${GREEN}where2meet${NC}"
    echo -e "  Username: ${GREEN}where2meet${NC}"
    echo -e "  Password: ${GREEN}where2meet${NC}\n"

    echo -e "${YELLOW}Connection String:${NC}"
    echo -e "  ${GREEN}postgresql://where2meet:where2meet@localhost:5432/where2meet${NC}\n"

    echo -e "${YELLOW}Connection URL (with driver):${NC}"
    echo -e "  ${GREEN}postgresql+psycopg://where2meet:where2meet@localhost:5432/where2meet${NC}\n"

    # Check if postgres is running
    if docker ps | grep -q "where2meet-postgres"; then
        echo -e "${GREEN}✓ PostgreSQL is running${NC}\n"
    else
        echo -e "${RED}✗ PostgreSQL is not running${NC}"
        echo -e "  Start with: ${BLUE}./start_all.sh${NC}\n"
    fi

    # Check if pgAdmin is running
    if docker ps | grep -q "where2meet-pgadmin"; then
        echo -e "${GREEN}✓ pgAdmin is running at http://localhost:5050${NC}\n"
    else
        echo -e "${YELLOW}ⓘ pgAdmin is not running${NC}"
        echo -e "  Start with: ${BLUE}$0 pgadmin-start${NC}\n"
    fi
}

show_install_guides() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  GUI Tool Installation Guides${NC}"
    echo -e "${BLUE}========================================${NC}\n"

    echo -e "${YELLOW}Option 1: pgAdmin (Easiest - Docker)${NC}"
    echo -e "  Run: ${GREEN}$0 pgadmin-start${NC}"
    echo -e "  Access at: http://localhost:5050"
    echo -e "  ${GREEN}✓ No installation needed!${NC}\n"

    echo -e "${YELLOW}Option 2: TablePlus (Mac - Popular)${NC}"
    echo -e "  Install: ${GREEN}brew install --cask tableplus${NC}"
    echo -e "  Or download: https://tableplus.com/"
    echo -e "  Free tier available\n"

    echo -e "${YELLOW}Option 3: Postico (Mac Only)${NC}"
    echo -e "  Install: ${GREEN}brew install --cask postico${NC}"
    echo -e "  Or download: https://eggerapps.at/postico/"
    echo -e "  Free trial, \$50 license\n"

    echo -e "${YELLOW}Option 4: DBeaver (Free, Cross-platform)${NC}"
    echo -e "  Install: ${GREEN}brew install --cask dbeaver-community${NC}"
    echo -e "  Or download: https://dbeaver.io/"
    echo -e "  Completely free\n"

    echo -e "${YELLOW}Option 5: VS Code Extension${NC}"
    echo -e "  1. Install VS Code extension: ${GREEN}PostgreSQL by Chris Kolkman${NC}"
    echo -e "  2. Or use: ${GREEN}Database Client by cweijan${NC}"
    echo -e "  Good for quick queries\n"

    echo -e "${YELLOW}Option 6: DataGrip (Paid)${NC}"
    echo -e "  Download: https://www.jetbrains.com/datagrip/"
    echo -e "  30-day trial, \$89/year"
    echo -e "  Very powerful\n"

    echo -e "${BLUE}Recommendation:${NC}"
    echo -e "  Start with: ${GREEN}$0 pgadmin-start${NC} (no installation needed)"
    echo -e "  Or install: ${GREEN}brew install --cask tableplus${NC} (best Mac experience)\n"

    echo -e "${YELLOW}Connection info for any tool:${NC}"
    echo -e "  Run: ${GREEN}$0 info${NC}\n"
}

# Main script
if [ -z "$1" ]; then
    show_usage
    exit 0
fi

case "$1" in
    pgadmin-start)
        start_pgadmin
        ;;
    pgadmin-stop)
        stop_pgadmin
        ;;
    info)
        show_connection_info
        ;;
    install-guides)
        show_install_guides
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}\n"
        show_usage
        exit 1
        ;;
esac
