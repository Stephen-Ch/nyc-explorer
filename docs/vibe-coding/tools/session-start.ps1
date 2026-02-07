<#
.SYNOPSIS
  Session-start wrapper: updates vibe-coding-kit subtree > syncs forGPT packet > prints 5-line Doc Audit.
.DESCRIPTION
  Run this from ANY consumer repo (any subdirectory). It detects repo root and DOCS_ROOT automatically.
  Designed to be invoked by Copilot when the user says: RUN START OF SESSION DOCS AUDIT
.PARAMETER SkipUpdate
  Skip the subtree pull even if the vibe-coding-kit remote exists.
.PARAMETER Force
  Continue on dirty tree instead of hard-stopping. Tree=DIRTY will still be reported.
.PARAMETER WhatIf
  Print commands that would run without executing subtree pull or forGPT sync.
#>
[CmdletBinding()]
param(
    [switch]$SkipUpdate,
    [switch]$Force,
    [switch]$WhatIf
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# -- 0. Repo root ----------------------------------------------
try {
    $repoRoot = (git rev-parse --show-toplevel 2>&1) -replace '/', '\'
} catch {
    Write-Error "HARD STOP: Not inside a git repository."
    exit 1
}
if (-not (Test-Path $repoRoot)) {
    Write-Error "HARD STOP: git rev-parse returned invalid path: $repoRoot"
    exit 1
}
Push-Location $repoRoot

try {

# -- 1. Branch + tree state ------------------------------------
$branch = (git branch --show-current 2>$null) -join ""
$dirtyFiles = git status --porcelain | Where-Object { $_ -notmatch '^\?\?' }
$treeState = if ($dirtyFiles) { "DIRTY" } else { "CLEAN" }

if ($treeState -eq "DIRTY" -and -not $Force) {
    Write-Host "HARD STOP: Working tree is dirty. Commit or stash first, or use -Force." -ForegroundColor Red
    Write-Host "Dirty files:" -ForegroundColor Yellow
    $dirtyFiles | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
    exit 1
}

# -- 2. Detect DOCS_ROOT --------------------------------------
$docsRoot = $null
$docsReason = ""

$deDir = Join-Path $repoRoot "docs-engineering"
$docsDir = Join-Path $repoRoot "docs"

if ((Test-Path $deDir) -and ((Test-Path (Join-Path $deDir "vibe-coding")) -or (Test-Path (Join-Path $deDir "forGPT")))) {
    $docsRoot = "docs-engineering"
    $docsReason = "docs-engineering/ contains vibe-coding or forGPT"
} elseif (Test-Path $docsDir) {
    $docsRoot = "docs"
    $docsReason = "docs/ exists"
} else {
    Write-Error "HARD STOP: Neither docs-engineering/ nor docs/ found at repo root: $repoRoot"
    exit 1
}

$subtreePrefix = "$docsRoot/vibe-coding"
if (-not (Test-Path (Join-Path $repoRoot $subtreePrefix))) {
    Write-Error "HARD STOP: Subtree prefix $subtreePrefix does not exist. Has the kit been added as a subtree?"
    exit 1
}

# -- 3. Kit update (subtree pull) ------------------------------
$kitUpdateResult = "NOOP"
$kitRemoteUrl = "https://github.com/Stephen-Ch/vibe-coding-kit.git"
$kitRemoteName = $null

if ($SkipUpdate) {
    $kitUpdateResult = "SKIPPED(Flag)"
} else {
    # Find existing remote whose URL matches vibe-coding-kit
    $remotes = git remote -v 2>$null
    foreach ($line in $remotes) {
        if ($line -match '(\S+)\s+.*vibe-coding-kit.*\(fetch\)') {
            $kitRemoteName = $Matches[1]
            break
        }
    }

    if (-not $kitRemoteName) {
        # Add the remote automatically
        $kitRemoteName = "vibe-coding-kit"
        if ($WhatIf) {
            Write-Host "[WhatIf] Would run: git remote add $kitRemoteName $kitRemoteUrl" -ForegroundColor Cyan
        } else {
            Write-Host "Adding remote '$kitRemoteName'..." -ForegroundColor Yellow
            git remote add $kitRemoteName $kitRemoteUrl 2>&1
        }
    }

    if ($WhatIf) {
        Write-Host "[WhatIf] Would run: git fetch $kitRemoteName" -ForegroundColor Cyan
        Write-Host "[WhatIf] Would run: git subtree pull --prefix $subtreePrefix $kitRemoteName main --squash" -ForegroundColor Cyan
        $kitUpdateResult = "SKIPPED(WhatIf)"
    } else {
        Write-Host "Fetching $kitRemoteName..." -ForegroundColor Yellow
        git fetch $kitRemoteName 2>&1 | Out-Null

        Write-Host "Pulling subtree ($subtreePrefix)..." -ForegroundColor Yellow
        try {
            $pullOutput = git subtree pull --prefix $subtreePrefix $kitRemoteName main --squash 2>&1
            $pullText = ($pullOutput | Out-String).Trim()
            if ($pullText -match "Already up to date") {
                $kitUpdateResult = "NOOP"
            } else {
                $kitUpdateResult = "DONE"
            }
            Write-Host $pullText -ForegroundColor Gray
        } catch {
            Write-Host "HARD STOP: Subtree pull failed." -ForegroundColor Red
            Write-Host "Error: $_" -ForegroundColor Red
            Write-Host "Suggested fix: Ensure '$subtreePrefix' was originally added with 'git subtree add --prefix $subtreePrefix $kitRemoteName main --squash'" -ForegroundColor Yellow
            exit 1
        }
    }
}

# -- 4. forGPT sync -------------------------------------------
$forGptStatus = "MISSING"
$vmDate = "MISSING"
$vmCommit = "MISSING"

# Check two possible locations for sync-forgpt.ps1
$syncScript = Join-Path $repoRoot "$docsRoot/forGPT/sync-forgpt.ps1"
if (-not (Test-Path $syncScript)) {
    $syncScript = Join-Path $repoRoot "$docsRoot/vibe-coding/tools/sync-forgpt.ps1"
}

if (Test-Path $syncScript) {
    $forGptStatus = "PRESENT"
    if ($WhatIf) {
        Write-Host "[WhatIf] Would run: $syncScript -Force" -ForegroundColor Cyan
    } else {
        Write-Host "Running forGPT sync..." -ForegroundColor Yellow
        try {
            & $syncScript -Force 2>&1 | Out-Null
        } catch {
            Write-Host "  Warning: forGPT sync failed: $_" -ForegroundColor Yellow
        }
    }
}

# Parse VERSION-MANIFEST if present
$vmPath = Join-Path $repoRoot "$docsRoot/forGPT/VERSION-MANIFEST.md"
if (Test-Path $vmPath) {
    $vmContent = Get-Content $vmPath -Raw
    if ($vmContent -match '\*\*Generated\*\*\s*\|\s*(\d{4}-\d{2}-\d{2})') {
        $vmDate = $Matches[1]
    }
    if ($vmContent -match '\*\*Git Commit\*\*\s*\|\s*`([^`]+)`') {
        $vmCommit = $Matches[1]
    }
}

# -- 5. ResearchIndex -----------------------------------------
$riPath = "MISSING"
$riDate = "MISSING"
$riCandidate = Join-Path $repoRoot "$docsRoot/research/ResearchIndex.md"
if (Test-Path $riCandidate) {
    $riPath = "$docsRoot/research/ResearchIndex.md"
    $riContent = Get-Content $riCandidate -Raw
    if ($riContent -match 'Last updated:\s*(\d{4}-\d{2}-\d{2})') {
        $riDate = $Matches[1]
    }
}

# -- 6. Open PRs ----------------------------------------------
$prCount = "UNKNOWN"
$prList = "gh CLI not available"
try {
    $ghVersion = gh --version 2>$null
    if ($ghVersion) {
        $prs = gh pr list --state open --json number,title 2>$null | ConvertFrom-Json
        if ($null -eq $prs -or $prs.Count -eq 0) {
            $prCount = "0"
            $prList = "none"
        } else {
            $prCount = "$($prs.Count)"
            $prList = ($prs | ForEach-Object { "#$($_.number) $($_.title)" }) -join "; "
        }
    }
} catch {
    # gh not available or auth issue - UNKNOWN is fine
}

# -- 7. Print 5-line audit ------------------------------------
Write-Host ""
Write-Host "========== SESSION START AUDIT ==========" -ForegroundColor Cyan
Write-Host "RepoRoot=$repoRoot | Branch=$branch | Tree=$treeState"
Write-Host "DOCS_ROOT=$docsRoot | Reason=$docsReason"
Write-Host "forGPT=$forGptStatus | VERSION-MANIFEST=$vmDate | Commit=$vmCommit | KitUpdate=$kitUpdateResult"
Write-Host "ResearchIndex=$riPath | LastUpdated=$riDate"
Write-Host "OpenPRs=$prCount - $prList"
Write-Host "=========================================" -ForegroundColor Cyan

} finally {
    Pop-Location
}
