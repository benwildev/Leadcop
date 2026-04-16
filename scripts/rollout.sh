#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

echo "==> Applying database schema"
pnpm --filter @workspace/db run push

echo "==> Running idempotent database migrations"
pnpm --filter @workspace/db run migrate:backfill-usage-period
pnpm --filter @workspace/db run migrate:seed-site-settings
pnpm --filter @workspace/db run migrate:add-max-bulk-emails

echo "==> Verifying required database objects"
pnpm --filter @workspace/db run migrate:verify-rollout

echo "==> Building workspace"
pnpm run build

echo "Rollout preparation complete."
echo "Next step: restart the app process, for example:"
echo "  pm2 restart leadcop-live --update-env"
