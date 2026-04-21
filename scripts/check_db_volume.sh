#!/usr/bin/env bash
set -euo pipefail

VOLUME_NAME="sueca_postgres_data"

if ! docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
  echo "[DB GUARD] Missing volume '$VOLUME_NAME'. Refusing to start to avoid wiping data." >&2
  echo "Create/restore the volume before retrying. If you intended to reset data, remove this guard or recreate the volume manually." >&2
  exit 1
fi
exit 0
