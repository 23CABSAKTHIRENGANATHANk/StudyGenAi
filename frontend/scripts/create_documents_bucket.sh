#!/usr/bin/env bash
set -e

echo "This script creates the 'documents' bucket in Supabase Storage if it doesn't exist."
echo "Ensure you have the supabase CLI installed and are logged in (or set SUPABASE_ACCESS_TOKEN)."

read -p "Proceed to create 'documents' bucket? (yes/no) " n
if [ "$n" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

npx supabase storage create-bucket documents --public=false || true
echo "Done."
