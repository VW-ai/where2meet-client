#!/bin/bash

# Log Viewing Script
# Convenient log viewing with different modes

# Colors
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$SCRIPT_DIR/../logs"

show_usage() {
    echo -e "${BLUE}Log Viewer${NC}\n"
    echo "Usage: $0 <service> [options]"
    echo ""
    echo "Services:"
    echo "  backend     - View backend API logs"
    echo "  frontend    - View frontend dev server logs"
    echo "  postgres    - View PostgreSQL logs"
    echo "  redis       - View Redis logs"
    echo "  all         - View all logs together"
    echo ""
    echo "Options:"
    echo "  -f, --follow   - Follow log output (like tail -f)"
    echo "  -n <number>    - Show last N lines (default: 50)"
    echo ""
    echo "Examples:"
    echo "  $0 backend           - Show last 50 lines of backend logs"
    echo "  $0 backend -f        - Follow backend logs"
    echo "  $0 backend -n 100    - Show last 100 lines"
    echo "  $0 all -f            - Follow all logs"
}

if [ -z "$1" ]; then
    show_usage
    exit 0
fi

SERVICE="$1"
FOLLOW=false
LINES=50

# Parse options
shift
while [[ $# -gt 0 ]]; do
    case "$1" in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -n)
            LINES="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

case "$SERVICE" in
    backend)
        if [ "$FOLLOW" = true ]; then
            tail -f "$LOG_DIR/backend.log"
        else
            tail -n "$LINES" "$LOG_DIR/backend.log"
        fi
        ;;

    frontend)
        if [ "$FOLLOW" = true ]; then
            tail -f "$LOG_DIR/frontend.log"
        else
            tail -n "$LINES" "$LOG_DIR/frontend.log"
        fi
        ;;

    postgres)
        if [ "$FOLLOW" = true ]; then
            docker logs -f where2meet-postgres
        else
            docker logs --tail "$LINES" where2meet-postgres
        fi
        ;;

    redis)
        if [ "$FOLLOW" = true ]; then
            docker logs -f where2meet-redis
        else
            docker logs --tail "$LINES" where2meet-redis
        fi
        ;;

    all)
        if [ "$FOLLOW" = true ]; then
            echo -e "${YELLOW}Following all logs (backend, frontend, postgres, redis)...${NC}\n"
            tail -f "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log" &
            docker logs -f where2meet-postgres 2>&1 | sed 's/^/[postgres] /' &
            docker logs -f where2meet-redis 2>&1 | sed 's/^/[redis] /' &
            wait
        else
            echo -e "${BLUE}=== Backend Logs ===${NC}"
            tail -n "$LINES" "$LOG_DIR/backend.log"
            echo -e "\n${BLUE}=== Frontend Logs ===${NC}"
            tail -n "$LINES" "$LOG_DIR/frontend.log"
            echo -e "\n${BLUE}=== PostgreSQL Logs ===${NC}"
            docker logs --tail "$LINES" where2meet-postgres 2>&1
            echo -e "\n${BLUE}=== Redis Logs ===${NC}"
            docker logs --tail "$LINES" where2meet-redis 2>&1
        fi
        ;;

    *)
        echo "Unknown service: $SERVICE"
        show_usage
        exit 1
        ;;
esac
