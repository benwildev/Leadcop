#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

echo "==> Applying database schema"
pnpm --filter @workspace/db run push-force

echo "Post-merge setup complete."
