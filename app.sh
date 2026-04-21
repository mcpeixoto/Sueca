#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
else
  echo "Error: neither 'docker compose' nor 'docker-compose' found."
  exit 1
fi

COMPOSE_CMD="$DOCKER_COMPOSE --env-file $SCRIPT_DIR/.env.prod"

show_help() {
  cat <<EOF
Usage: $0 <command>

Commands:
  start       Start Sueca (sueca.peixotolabs.com)
  stop        Stop Sueca
  restart     Rebuild and restart Sueca
  logs        Tail container logs
  status      Show running containers and volumes
EOF
}

case "$1" in
  start)
    echo "Starting Sueca..."
    "$SCRIPT_DIR/scripts/check_db_volume.sh" || exit 1
    $COMPOSE_CMD up -d --build
    echo "Started — frontend on port 80 (sueca.peixotolabs.com), containers Sueca_*"
    ;;

  stop)
    echo "Stopping Sueca..."
    $COMPOSE_CMD down
    echo "Stopped."
    ;;

  restart)
    echo "Restarting Sueca with fresh build..."
    "$SCRIPT_DIR/scripts/check_db_volume.sh" || exit 1
    $COMPOSE_CMD down
    $COMPOSE_CMD up -d --build
    echo "Restarted."
    ;;

  logs)
    $COMPOSE_CMD logs -f
    ;;

  status)
    echo "=== Containers ==="
    docker ps --filter "name=^Sueca_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  No containers running"
    echo ""
    echo "=== Volumes ==="
    docker volume ls --filter "name=sueca" --format "table {{.Name}}\t{{.Driver}}"
    ;;

  help|--help|-h)
    show_help
    ;;

  *)
    show_help
    exit 1
    ;;
esac
