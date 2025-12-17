<#
Revert all shared-cache / shared-env changes script
- Removes SYSTEM env vars (requires Admin)
- Removes USER env vars and config files for current user
- Resets npm/pnpm/pip per-user settings where possible
- Deletes shared folders C:\SharedDev and C:\SharedCaches (optional)
- Safe & idempotent: runs multiple times without harm
#>

# -- Helper functions -------------------------------------------------------
function Remove-IfExists {
    param($Path)
    if (Test-Path $Path) {
        try {
            Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction Stop
            Write-Host "Deleted: $Path"
        } catch {
            Write-Warning "Could not delete $Path : $($_.Exception.Message)"
        }
    } else {
        Write-Host "Not found (skipping): $Path"
    }
}

function Remove-From-Path {
    param(
        [string]$OldPath,
        [ValidateSet('User','Machine')] [string]$Scope = 'User'
    )
    try {
        $current = [Environment]::GetEnvironmentVariable("Path", $Scope)
        if ($null -eq $current) { return }
        # Normalize
        $parts = $current -split ';' | Where-Object { $_ -ne '' } | ForEach-Object { $_.Trim() }
        $newParts = $parts | Where-Object { $_ -ne $OldPath }
        if ($parts.Count -ne $newParts.Count) {
            $newValue = ($newParts -join ';')
            [Environment]::SetEnvironmentVariable("Path", $newValue, $Scope)
            Write-Host "Removed from $Scope PATH: $OldPath"
        } else {
            Write-Host "PATH entry not present in $Scope PATH: $OldPath"
        }
    } catch {
        Write-Warning "Failed to update $Scope PATH: $($_.Exception.Message)"
    }
}

# -- Detect admin / elevation ------------------------------------------------
function Test-IsAdmin {
    $wi = [Security.Principal.WindowsIdentity]::GetCurrent()
    $wp = New-Object Security.Principal.WindowsPrincipal($wi)
    return $wp.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
}

$ISADMIN = Test-IsAdmin

Write-Host "`n=== Revert Shared Environment Script ===`n"

# -- SYSTEM LEVEL CLEANUP (requires Admin) ----------------------------------
if (-not $ISADMIN) {
    Write-Host "NOTE: Running without Administrator privileges. System-level changes will be skipped."
    Write-Host "To fully revert system-wide environment variables and remove machine PATH entries, re-run this script as Administrator."
} else {
    Write-Host "Running with Administrator privileges: performing system-level cleanup..."

    # Remove system environment variables set earlier
    $sysVars = @("NPM_CONFIG_CACHE","PIP_CACHE_DIR","VITE_CACHE_DIR")
    foreach ($v in $sysVars) {
        try {
            [Environment]::SetEnvironmentVariable($v, $null, "Machine")
            Write-Host "Removed system environment variable: $v"
        } catch {
            Write-Warning "Could not remove system env var $v : $($_.Exception.Message)"
        }
    }

    # Remove references to shared folders from the machine PATH
    $sharedPathsToRemove = @(
        "C:\SharedDev\npm-global",
        "C:\SharedDev\npm-cache",
        "C:\SharedDev\pnpm-store",
        "C:\SharedDev\pip-cache",
        "C:\SharedDev\python-packages",
        "C:\SharedCaches\npm-cache",
        "C:\SharedCaches\pip-cache",
        "C:\SharedCaches\vite-cache"
    )

    foreach ($p in $sharedPathsToRemove) {
        Remove-From-Path -OldPath $p -Scope "Machine"
    }
}

# -- USER-LEVEL CLEANUP (runs for the current user) --------------------------
Write-Host "`nPerforming per-user cleanup for user: $env:USERNAME`n"

# Remove per-user environment variables
$userVars = @("NPM_CONFIG_CACHE","PIP_CACHE_DIR","VITE_CACHE_DIR")
foreach ($v in $userVars) {
    try {
        [Environment]::SetEnvironmentVariable($v, $null, "User")
        Write-Host "Removed user environment variable: $v"
    } catch {
        Write-Warning "Could not remove user env var $v : $($_.Exception.Message)"
    }
}

# Remove pip.ini (per-user)
$pipIni = Join-Path $env:APPDATA "pip\pip.ini"
if (Test-Path $pipIni) {
    try {
        Remove-Item -LiteralPath $pipIni -Force
        Write-Host "Deleted pip config: $pipIni"
    } catch {
        Write-Warning "Could not delete pip.ini: $($_.Exception.Message)"
    }
} else {
    Write-Host "No user pip.ini found (skipping)."
}

# Remove user's .npmrc
$npmrc = Join-Path $env:USERPROFILE ".npmrc"
if (Test-Path $npmrc) {
    try {
        Remove-Item -LiteralPath $npmrc -Force
        Write-Host "Deleted user .npmrc: $npmrc"
    } catch {
        Write-Warning "Could not delete .npmrc: $($_.Exception.Message)"
    }
} else {
    Write-Host "No user .npmrc found (skipping)."
}

# Reset npm config (per-user)
try {
    if (Get-Command npm -ErrorAction SilentlyContinue) {
        npm config delete cache 2>$null
        npm config delete prefix 2>$null
        Write-Host "Attempted to reset npm config (user-level)."
    } else {
        Write-Host "npm not found in PATH; skipping npm config reset."
    }
} catch {
    Write-Warning "npm reset failed: $($_.Exception.Message)"
}

# Attempt to remove pnpm per-user store (common per-user path)
$pnpmStore = Join-Path $env:LOCALAPPDATA "pnpm\store"
Remove-IfExists $pnpmStore

# Remove common per-user caches
$perUserDeletes = @(
    (Join-Path $env:LOCALAPPDATA "npm-cache"),
    (Join-Path $env:APPDATA "npm"),                      # user global npm bin folder
    (Join-Path $env:LOCALAPPDATA "pip\Cache"),
    (Join-Path $env:LOCALAPPDATA "pnpm"),
    (Join-Path $env:APPDATA "Python"),                   # sometimes exists
    (Join-Path $env:LOCALAPPDATA "Yarn"),                # if Yarn was used
    (Join-Path $env:USERPROFILE ".cache")                # generic cache
)

foreach ($p in $perUserDeletes) {
    Remove-IfExists $p
}

# Remove specific user PATH entries we may have added
$userPathsToRemove = @(
    "C:\SharedDev\npm-global",
    "C:\SharedDev\npm-cache",
    "C:\SharedDev\pnpm-store",
    "C:\SharedDev\pip-cache",
    "C:\SharedDev\python-packages",
    "C:\SharedCaches\npm-cache",
    "C:\SharedCaches\pip-cache",
    "C:\SharedCaches\vite-cache",
    # if we added roaming python scripts entry earlier:
    (Join-Path $env:APPDATA "Python\Python314\Scripts"),
    # sometimes we added Python314 entries to User PATH
    "C:\Python314",
    "C:\Python314\Scripts"
)

foreach ($p in $userPathsToRemove) {
    Remove-From-Path -OldPath $p -Scope "User"
}

# -- Optionally delete shared folders (askless delete) -----------------------
# If you created shared folders and want them removed, uncomment the next block.
# (They will be deleted only if the current user has permission.)

$deleteSharedFolders = $true   # set to $false if you DO NOT want automatic deletion

if ($deleteSharedFolders) {
    Write-Host "`nAttempting to remove shared folders (if present) ..."
    $sharedFolders = @("C:\SharedDev","C:\SharedCaches")
    foreach ($f in $sharedFolders) {
        Remove-IfExists $f
    }
} else {
    Write-Host "Skipping deletion of shared folders (deleteSharedFolders = $false)."
}

# -- Final pip reset attempts ------------------------------------------------
try {
    if (Get-Command python -ErrorAction SilentlyContinue) {
        python -m pip config unset global.cache-dir 2>$null
        python -m pip config unset global.target 2>$null
        Write-Host "Attempted to unset pip global cache/target settings (if present)."
    } else {
        Write-Host "python not found in PATH; skipping pip config unset."
    }
} catch {
    Write-Warning "pip config unset failed: $($_.Exception.Message)"
}

# -- Summary & next steps ----------------------------------------------------
Write-Host "`n=== Revert script completed for user: $env:USERNAME ===`n"
if (-not $ISADMIN) {
    Write-Host "Note: System-level env vars and Machine PATH entries were NOT changed because this was run without Administrator privileges."
    Write-Host "To remove system-level settings (affects all users/new users), re-run this script with Administrator rights."
} else {
    Write-Host "System-level environment variables and machine PATH entries were updated (Admin run)."
}

Write-Host "`nRecommended: Restart the machine to fully apply changes to all users.`n"
