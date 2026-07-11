#!/usr/bin/env bash
set -e

SCHEMA_FILE="database/schema.sql"

echo "This script will push the DB schema to your linked Supabase project."
echo "Ensure you have the supabase CLI installed and are logged in (or set SUPABASE_ACCESS_TOKEN)."

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Schema file not found: $SCHEMA_FILE" >&2
  exit 1
fi

read -p "Proceed to push schema to Supabase? (yes/no) " n
if [ "$n" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

npx supabase db push --schema "$SCHEMA_FILE"
echo "Schema push complete."
