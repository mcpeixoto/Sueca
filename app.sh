#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Check if docker compose command exists, otherwise try docker-compose
if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
else
  echo "Error: neither 'docker compose' nor 'docker-compose' found."
  exit 1
fi

# Parse environment argument (default to prod)
parse_env() {
  local env="$1"
  case "$env" in
    dev|development)
      echo "dev"
      ;;
    prod|production|"")
      echo "prod"
      ;;
    *)
      echo "Error: Invalid environment '$env'. Use 'dev' or 'prod'." >&2
      exit 1
      ;;
  esac
}

# Get compose command with environment-specific env file
get_compose_cmd() {
  local env="$1"
  echo "$DOCKER_COMPOSE --env-file $SCRIPT_DIR/.env.$env"
}

# Get volume name for environment
get_volume_name() {
  local env="$1"
  if [ "$env" = "dev" ]; then
    echo "sueca-dev_postgres_data"
  else
    echo "sueca_postgres_data"
  fi
}

# Show help
show_help() {
  echo "Usage: $0 <command> [environment]"
  echo ""
  echo "Commands:"
  echo "  start [dev|prod]    Start the specified environment (default: prod)"
  echo "  stop [dev|prod]     Stop the specified environment (default: prod)"
  echo "  restart [dev|prod]  Restart the specified environment (default: prod)"
  echo "  logs [dev|prod]     Show logs for the specified environment (default: prod)"
  echo "  status              Show status of all containers"
  echo ""
  echo "Examples:"
  echo "  $0 start dev        Start development environment"
  echo "  $0 start prod       Start production environment"
  echo "  $0 start            Start production environment (default)"
  echo "  $0 logs dev         Show development logs"
  echo ""
  echo "Environments:"
  echo "  prod (default)      sueca.peixotolabs.com - Port 80"
  echo "  dev                 dev-sueca.peixotolabs.com - Port 8280"
}

case "$1" in
  start)
    ENV=$(parse_env "$2")
    COMPOSE_CMD=$(get_compose_cmd "$ENV")
    VOLUME_NAME=$(get_volume_name "$ENV")

    echo "Starting Sueca ($ENV environment)..."

    # Check if volume exists (for production, keep existing guard)
    if [ "$ENV" = "prod" ]; then
      "$SCRIPT_DIR/scripts/check_db_volume.sh" prod || exit 1
    else
      # For dev, create volume if it doesn't exist (first time setup)
      if ! docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
        echo "[DEV] Creating new database volume: $VOLUME_NAME"
        docker volume create "$VOLUME_NAME"
      fi
    fi

    $COMPOSE_CMD up -d --build

    if [ "$ENV" = "dev" ]; then
      echo ""
      echo "Development environment started!"
      echo "  Frontend: http://localhost:8280"
      echo "  Configure dev-sueca.peixotolabs.com in Nginx Proxy Manager to point to Sueca_dev_frontend:80"
      echo "  Containers: Sueca_dev_*"
    else
      echo ""
      echo "Production environment started!"
      echo "  Frontend: http://localhost:80 (sueca.peixotolabs.com)"
      echo "  Containers: Sueca_*"
    fi
    ;;

  stop)
    ENV=$(parse_env "$2")
    COMPOSE_CMD=$(get_compose_cmd "$ENV")

    echo "Stopping Sueca ($ENV environment)..."
    $COMPOSE_CMD down
    echo "Stopped."
    ;;

  restart)
    ENV=$(parse_env "$2")
    COMPOSE_CMD=$(get_compose_cmd "$ENV")
    VOLUME_NAME=$(get_volume_name "$ENV")

    echo "Restarting Sueca ($ENV environment) with fresh build..."

    if [ "$ENV" = "prod" ]; then
      "$SCRIPT_DIR/scripts/check_db_volume.sh" prod || exit 1
    fi

    $COMPOSE_CMD down
    $COMPOSE_CMD up -d --build
    echo "Restarted."
    ;;

  logs)
    ENV=$(parse_env "$2")
    COMPOSE_CMD=$(get_compose_cmd "$ENV")

    echo "Showing logs for Sueca ($ENV environment)..."
    $COMPOSE_CMD logs -f
    ;;

  status)
    echo "=== Sueca Container Status ==="
    echo ""
    echo "Production (Sueca_*):"
    docker ps --filter "name=^Sueca_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | grep -v "Sueca_dev" || echo "  No production containers running"
    echo ""
    echo "Development (Sueca_dev_*):"
    docker ps --filter "name=^Sueca_dev" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  No development containers running"
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
