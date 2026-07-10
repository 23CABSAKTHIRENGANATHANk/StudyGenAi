Param(
    [string]$SchemaFile = "database/schema.sql",
    [switch]$AutoConfirm
)

Write-Host "This script will push the DB schema to your linked Supabase project."
Write-Host "Ensure you have the supabase CLI installed and are logged in (or set SUPABASE_ACCESS_TOKEN)."

if (-not (Test-Path $SchemaFile)) {
    Write-Error "Schema file not found: $SchemaFile"
    exit 1
}

$proceed = $false
if ($AutoConfirm) { $proceed = $true } else {
    $n = Read-Host "Proceed to push schema to Supabase? (yes/no)"
    $nl = $n.Trim().ToLower()
    if ($nl -eq 'yes' -or $nl -eq 'y') { $proceed = $true }
}
if (-not $proceed) { Write-Host "Aborted."; exit 0 }

npx supabase db push --schema $SchemaFile

Write-Host "Schema push complete. You may want to run 'npx supabase db remote status' to verify."
