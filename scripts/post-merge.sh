#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push
# Backfill approved_at for previously-approved upgrade requests that lack it
psql "$DATABASE_URL" -c "UPDATE upgrade_requests SET approved_at = created_at WHERE status = 'APPROVED' AND approved_at IS NULL;"
# Backfill max_bulk_emails for paid plans (0 = disabled; BASIC→100, PRO→500, other non-FREE→100)
psql "$DATABASE_URL" -c "UPDATE plan_configs SET max_bulk_emails = CASE WHEN plan = 'BASIC' THEN 100 WHEN plan = 'PRO' THEN 500 ELSE 100 END WHERE max_bulk_emails = 0 AND plan != 'FREE';"
