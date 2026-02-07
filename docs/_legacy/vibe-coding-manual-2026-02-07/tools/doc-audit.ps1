$ErrorActionPreference = "Stop"

function Fail {
    param([string]$Message)
    Write-Host "FAIL: $Message"
    exit 1
}

function Pass {
    param([string]$Message)
    Write-Host "PASS: $Message"
}

# Anchor to repo root
$repoRoot = git rev-parse --show-toplevel
Set-Location $repoRoot

Write-Host "Repo Root: $repoRoot"
$prefix = git rev-parse --show-prefix
if (-not [string]::IsNullOrWhiteSpace($prefix)) {
    Write-Host "Current Prefix: $prefix"
}

# Load config (with defaults)
$configPath = Join-Path $repoRoot "docs/vibe-coding.config.json"
$defaultConfig = [pscustomobject]@{
    controlDeck     = [pscustomobject]@{
        visionPath = "docs/project/VISION.md"
        epicsPath  = "docs/project/EPICS.md"
        nextPath   = "docs/project/NEXT.md"
    }
    testCatalogPath = "docs/testing/test-catalog.md"
    placeholderRegex = "(TBD|TODO|TEMPLATE|PLACEHOLDER|FILL IN|COMING SOON|XXX|FIXME|TO BE DETERMINED|<fill)"
    nextFreshness = [pscustomobject]@{
        mode = "codeChangesOnly"
        docOnlyPrefixes = @("docs/")
        requireOnPullRequest = $true
        requireOnPush = $false
    }
}

$config = $defaultConfig
if (Test-Path $configPath) {
    try {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
    } catch {
        Fail "Could not parse config at ${configPath}: $($_.Exception.Message)"
    }
}

$visionPath = $config.controlDeck.visionPath
$epicsPath  = $config.controlDeck.epicsPath
$nextPath   = $config.controlDeck.nextPath
$testCatalogPath = $config.testCatalogPath
$placeholderRegex = $config.placeholderRegex
$docOnlyPrefixes = $config.nextFreshness.docOnlyPrefixes
$requireOnPullRequest = [bool]$config.nextFreshness.requireOnPullRequest
$requireOnPush = [bool]$config.nextFreshness.requireOnPush
$nextMode = $config.nextFreshness.mode

# A) Required files
$missing = @()
foreach ($p in @($visionPath, $epicsPath, $nextPath, $testCatalogPath)) {
    if (-not (Test-Path (Join-Path $repoRoot $p))) {
        $missing += $p
    }
}
if ($missing.Count -gt 0) {
    Fail "Required files missing: $($missing -join ', ')"
} else {
    Pass "Required files present"
    # Print canonical paths explicitly as proof
    Write-Host "Checked: $visionPath"
    Write-Host "Checked: $epicsPath"
    Write-Host "Checked: $nextPath"
    Write-Host "Checked: $testCatalogPath"
}

# B) Population Gate (Control Deck only)
# Run git at repo root using -C
$grepArgs = @("-C", $repoRoot, "grep", "-n", "-i", "-E", $placeholderRegex, "--", $visionPath, $epicsPath, $nextPath)
& git @grepArgs | Out-String -OutVariable grepOutput | Out-Null
$grepCode = $LASTEXITCODE
if ($grepCode -eq 0) {
    Fail "Population Gate found placeholders:\n$grepOutput"
} elseif ($grepCode -eq 1) {
    Pass "Population Gate: no placeholders in Control Deck"
} else {
    Fail "Population Gate scan error (exit $grepCode)."
}

# C) NEXT freshness (low-noise v1)
$inPrContext = ($env:GITHUB_EVENT_NAME -eq "pull_request") -or ([string]::IsNullOrWhiteSpace($env:GITHUB_BASE_REF) -eq $false)
if ($requireOnPullRequest -and $inPrContext) {
    if ($nextMode -ne "codeChangesOnly") {
        Fail "Unsupported nextFreshness.mode '$nextMode'"
    }
-C $repoRoot fetch --no-tags origin +refs/heads/*:refs/remotes/origin/* | Out-Null
    $mergeBase = git -C $repoRoot merge-base "origin/$baseRef" HEAD
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($mergeBase)) {
        Fail "NEXT freshness: could not compute merge-base with origin/$baseRef"
    }

    $diffPaths = git -C $repoRootags origin +refs/heads/*:refs/remotes/origin/* | Out-Null
    $mergeBase = git merge-base "origin/$baseRef" HEAD
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($mergeBase)) {
        Fail "NEXT freshness: could not compute merge-base with origin/$baseRef"
    }

    $diffPaths = git diff --name-only "$mergeBase"...HEAD
    $diffList = $diffPaths | Where-Object { $_ -ne "" }

    $isDocsOnly = $true
    foreach ($path in $diffList) {
        $prefixed = $false
        foreach ($prefix in $docOnlyPrefixes) {
            if ($path.StartsWith($prefix)) { $prefixed = $true; break }
        }
        if (-not $prefixed) { $isDocsOnly = $false; break }
    }

    if ($isDocsOnly) {
        Pass "NEXT freshness: docs-only PR detected; NEXT change not required"
    } else {
        $nextChanged = $diffList -contains $nextPath
        if ($nextChanged) {
            Pass "NEXT freshness: NEXT.md changed for code-affecting PR"
        } else {
            $joined = ($diffList -join ", ")
            Fail "NEXT freshness: code-affecting PR requires $nextPath in diff; changed: [$joined]"
        }
    }
} elseif ($requireOnPush -and ($env:GITHUB_EVENT_NAME -eq "push")) {
    $hasPrev = (git rev-parse HEAD~1 2>$null)
    if ($LASTEXITCODE -ne 0) {
        Fail "NEXT freshness: HEAD~1 not available to check push diff"
    }
    $pushDiff = git diff --name-only HEAD~1..HEAD
    if ($pushDiff -contains $nextPath) {
        Pass "NEXT freshness: NEXT.md changed on push"
    } else {
        Fail "NEXT freshness: push requires $nextPath in HEAD~1..HEAD"
    }
} else {
    Pass "NEXT freshness: skipped (context does not require)"
}

Pass "DOC-AUDIT: PASS"
exit 0
