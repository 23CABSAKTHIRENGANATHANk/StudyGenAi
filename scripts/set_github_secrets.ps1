Param(
  [Parameter(Mandatory=$true)] [string]$Owner,
  [Parameter(Mandatory=$true)] [string]$Repo
)

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "gh CLI not found. Install from https://cli.github.com/ and run 'gh auth login'."
  exit 1
}

$secrets = @(
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'SUPABASE_ANON_KEY',
  'DATABASE_URL',
  'GOOGLE_GEMINI_API_KEY',
  'SENTRY_DSN',
  'APP_ORIGIN'
)

Write-Host "This will set repository secrets on ${Owner}/${Repo}:`n" -ForegroundColor Yellow
$secrets | ForEach-Object { Write-Host " - $_" }

$confirm = Read-Host "Proceed? (y/N)"
if ($confirm.ToLower() -ne 'y') { Write-Host 'Aborted.'; exit }

foreach ($key in $secrets) {
  $val = [Environment]::GetEnvironmentVariable($key)
  if ([string]::IsNullOrEmpty($val)) {
    $val = Read-Host -AsSecureString "Enter value for $key (leave blank to skip)"
    if ($val.Length -eq 0) { Write-Host "Skipping $key"; continue }
    $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($val)
    $plain = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    $val = $plain
  }
  if (-not [string]::IsNullOrEmpty($val)) {
    Write-Host "Setting $key..."
    gh secret set $key --repo "$Owner/$Repo" --body "$val"
  }
}

Write-Host "Done. Verify at https://github.com/${Owner}/${Repo}/settings/secrets/actions"
