#!/bin/sh
set -eu

until pg_isready -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE"; do
  sleep 1
done

psql -v ON_ERROR_STOP=1 -c \
  "CREATE TABLE IF NOT EXISTS schema_migrations (
     id TEXT PRIMARY KEY,
     applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );"

for file in /migrations/*.sql; do
  id=$(basename "$file")
  already=$(psql -tAc "SELECT 1 FROM schema_migrations WHERE id = '$id'")
  if [ "$already" = "1" ]; then
    continue
  fi
  psql -v ON_ERROR_STOP=1 -f "$file"
  psql -v ON_ERROR_STOP=1 -c "INSERT INTO schema_migrations (id) VALUES ('$id')"
done

if [ -f /seed/fixtures.sql ]; then
  psql -v ON_ERROR_STOP=1 -f /seed/fixtures.sql
fi
