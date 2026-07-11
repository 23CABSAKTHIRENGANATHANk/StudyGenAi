#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install from https://cli.github.com/ and authenticate (gh auth login)."
  exit 1
fi

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <owner> <repo>"
  echo "Example: $0 23CABSAKTHIRENGANATHANk StudyGenAi"
  exit 1
fi

OWNER="$1"
REPO="$2"

SECRETS=(
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
  SUPABASE_ANON_KEY
  DATABASE_URL
  GOOGLE_GEMINI_API_KEY
  SENTRY_DSN
  APP_ORIGIN
)

echo "This script will set the following repository secrets on ${OWNER}/${REPO}:"
for s in "${SECRETS[@]}"; do echo " - $s"; done
echo

read -p "Proceed? (y/N): " proceed
if [[ "${proceed,,}" != "y" ]]; then
  echo "Aborted."
  exit 1
fi

for key in "${SECRETS[@]}"; do
  # If environment variable already set in the shell, use it. Otherwise prompt the user.
  val="${!key-}"
  if [ -z "$val" ]; then
    echo -n "Enter value for $key (leave blank to skip): "
    # read secret without echo
    read -r -s value
    echo
    val="$value"
  fi
  if [ -n "$val" ]; then
    echo "Setting secret $key..."
    gh secret set "$key" --repo "${OWNER}/${REPO}" --body "$val"
  else
    echo "Skipping $key (no value provided)."
  fi
done

echo "Done. Verify at https://github.com/${OWNER}/${REPO}/settings/secrets/actions"
