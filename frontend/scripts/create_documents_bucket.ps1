Param(
	[switch]$AutoConfirm
)

Write-Host "This script creates the 'documents' bucket in Supabase Storage if it doesn't exist."
Write-Host "Ensure you have the supabase CLI installed and are logged in (or set SUPABASE_ACCESS_TOKEN)."

$proceed = $false
if ($AutoConfirm) { $proceed = $true } else {
	$n = Read-Host "Proceed to create 'documents' bucket? (yes/no)"
	$nl = $n.Trim().ToLower()
	if ($nl -eq 'yes' -or $nl -eq 'y') { $proceed = $true }
}
if (-not $proceed) { Write-Host "Aborted."; exit 0 }

try {
	npx supabase storage create-bucket documents --public=false
	Write-Host "Created documents bucket (or it already exists)."
} catch {
	Write-Host "Bucket creation failed or already exists. Message: $_"
}
Write-Host "Done."
