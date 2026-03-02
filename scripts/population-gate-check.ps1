param(
  [string]$Root = (Get-Location).Path
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-WordCount([string]$text) {
  if ([string]::IsNullOrWhiteSpace($text)) { return 0 }
  return [regex]::Matches($text, "[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?").Count
}

function Get-SectionsByH2([string[]]$lines) {
  $sections = @()
  $current = $null

  foreach ($line in $lines) {
    if ($line -match '^##\s+(.+)$') {
      if ($null -ne $current) { $sections += $current }
      $current = [pscustomobject]@{ Title = $Matches[1].Trim(); Lines = @() }
      continue
    }
    if ($null -ne $current) { $current.Lines += $line }
  }

  if ($null -ne $current) { $sections += $current }
  return $sections
}

function Get-SectionsByEpic([string[]]$lines) {
  $sections = @()
  $current = $null

  foreach ($line in $lines) {
    if ($line -match '^##\s+(EPIC-[0-9]{3}.*)$') {
      if ($null -ne $current) { $sections += $current }
      $current = [pscustomobject]@{ Id = ($Matches[1].Trim()); Lines = @() }
      continue
    }
    if ($null -ne $current) { $current.Lines += $line }
  }

  if ($null -ne $current) { $sections += $current }
  return $sections
}

function Check-DateFields([string[]]$lines) {
  $results = @()
  foreach ($line in $lines) {
    if ($line -match '^(?<k>.*?(?i)(Date|Last Updated|Created|Updated)\s*:\s*)(?<v>.+?)\s*$') {
      $value = $Matches['v'].Trim()
      $ok = $value -match '^(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$'
      $results += [pscustomobject]@{ Line = $line; Ok = $ok }
    }
  }
  return $results
}

$files = @(
  [pscustomobject]@{ Name='VISION'; Path=(Join-Path $Root 'docs/project/VISION.md') },
  [pscustomobject]@{ Name='EPICS';  Path=(Join-Path $Root 'docs/project/EPICS.md') },
  [pscustomobject]@{ Name='NEXT';   Path=(Join-Path $Root 'docs/project/NEXT.md') }
)

$anyFail = $false

foreach ($file in $files) {
  if (-not (Test-Path $file.Path)) {
    Write-Host "[FAIL] Missing $($file.Name) file: $($file.Path)" -ForegroundColor Red
    $anyFail = $true
    continue
  }

  $lines = Get-Content -LiteralPath $file.Path
  Write-Host "\n=== $($file.Name) ($($file.Path)) ===" -ForegroundColor Cyan

  $dateChecks = @(Check-DateFields $lines)
  if ($dateChecks.Count -gt 0) {
    foreach ($dc in $dateChecks) {
      if ($dc.Ok) {
        Write-Host "[PASS] Date field: $($dc.Line)" -ForegroundColor Green
      } else {
        Write-Host "[FAIL] Date field not YYYY-MM-DD: $($dc.Line)" -ForegroundColor Red
        $anyFail = $true
      }
    }
  } else {
    Write-Host "[WARN] No explicit Date/Updated fields found (rule applies only if present)." -ForegroundColor Yellow
  }

  if ($file.Name -eq 'VISION') {
    $sections = @(Get-SectionsByH2 $lines)
    if ($sections.Count -eq 0) {
      Write-Host "[FAIL] No ## sections found to validate in VISION.md" -ForegroundColor Red
      $anyFail = $true
    } else {
      foreach ($s in $sections) {
        $body = ($s.Lines | Where-Object { $_ -notmatch '^#' }) -join "\n"
        $wc = Get-WordCount $body
        if ($wc -ge 25) {
          Write-Host "[PASS] VISION section '$($s.Title)' has $wc words (>=25)" -ForegroundColor Green
        } else {
          Write-Host "[FAIL] VISION section '$($s.Title)' has $wc words (<25)" -ForegroundColor Red
          $anyFail = $true
        }
      }
    }
  }

  if ($file.Name -eq 'EPICS') {
    $epics = @(Get-SectionsByEpic $lines)
    if ($epics.Count -eq 0) {
      Write-Host "[FAIL] No EPIC-### sections found to validate in EPICS.md" -ForegroundColor Red
      $anyFail = $true
    } else {
      foreach ($e in $epics) {
        $body = ($e.Lines | Where-Object { $_ -notmatch '^#' }) -join "\n"
        $wc = Get-WordCount $body
        if ($wc -ge 15) {
          Write-Host "[PASS] EPIC '$($e.Id)' has $wc words (>=15)" -ForegroundColor Green
        } else {
          Write-Host "[FAIL] EPIC '$($e.Id)' has $wc words (<15)" -ForegroundColor Red
          $anyFail = $true
        }
      }
    }
  }

  if ($file.Name -eq 'NEXT') {
    $sections = @(Get-SectionsByH2 $lines)

    $next = @($sections | Where-Object { $_.Title -match '^(?i)Next Step$' } | Select-Object -First 1)
    if ($next.Count -eq 0) {
      Write-Host "[FAIL] NEXT.md missing a '## Next Step' section" -ForegroundColor Red
      $anyFail = $true
    } else {
      $body = ($next[0].Lines | Where-Object { $_ -notmatch '^#' }) -join "\n"
      $wc = Get-WordCount $body
      if ($wc -ge 10) {
        Write-Host "[PASS] NEXT 'Next Step' has $wc words (>=10)" -ForegroundColor Green
      } else {
        Write-Host "[FAIL] NEXT 'Next Step' has $wc words (<10)" -ForegroundColor Red
        $anyFail = $true
      }
    }

    $done = @($sections | Where-Object { $_.Title -match '^(?i)Done When$' } | Select-Object -First 1)
    if ($done.Count -eq 0) {
      Write-Host "[FAIL] NEXT.md missing a '## Done When' section" -ForegroundColor Red
      $anyFail = $true
    } else {
      $items = @($done[0].Lines | Where-Object { $_ -match '^\s*-\s+\S' })
      if ($items.Count -eq 0) {
        Write-Host "[FAIL] NEXT 'Done When' has no bullet items" -ForegroundColor Red
        $anyFail = $true
      } else {
        $i = 0
        foreach ($item in $items) {
          $i++
          $text = ($item -replace '^\s*-\s+', '').Trim()
          $wc = Get-WordCount $text
          if ($wc -ge 6) {
            Write-Host "[PASS] Done When #$i has $wc words (>=6): $text" -ForegroundColor Green
          } else {
            Write-Host "[FAIL] Done When #$i has $wc words (<6): $text" -ForegroundColor Red
            $anyFail = $true
          }
        }
      }
    }
  }
}

if ($anyFail) {
  Write-Host "\nRESULT: FAIL (one or more minimums not met)" -ForegroundColor Red
  exit 2
}

Write-Host "\nRESULT: PASS (all checked minimums met)" -ForegroundColor Green
exit 0
