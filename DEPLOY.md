# Deployment

Use the repo rollout script so database changes land before the app code is
restarted.

## Standard rollout

```bash
pnpm run rollout
pm2 restart leadcop-live --update-env
```

## What `pnpm run rollout` does

```text
1. Push the current Drizzle schema to the database
2. Run idempotent data/backfill migrations
3. Verify required tables/columns exist
4. Build the workspace
```

## Why this exists

Bulk verification depends on:

- `public.bulk_jobs`
- `public.plan_configs.max_bulk_emails`

If those objects are missing, the API can return `500` even though the frontend
shows a generic network error. The rollout script fails before restart when the
database is not ready.
