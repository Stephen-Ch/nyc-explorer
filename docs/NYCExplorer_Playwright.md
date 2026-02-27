# NYCExplorer_Playwright.md (NYC Explorer)

Repo path used during diagnosis:
- `C:\Users\schur\workspaces\NYC Explorer`  (NOTE the space)

Confirmed environment at time of capture:
- Node `v20.19.5`
- npm `10.8.2`
- Local Playwright: `npx --no-install playwright --version` → `1.56.1`

---

## 1) Where Playwright is configured

Config file:
- `playwright.config.ts` (repo root)

Key settings:
- `testDir: './tests'`
- `baseURL: process.env.BASE_URL || 'http://localhost:5000'`
- `webServer.command` should run the MVC csproj (see below)
- `webServer.url: 'http://localhost:5000'`
- Project: `chromium`

So: tests live under `tests/` (including `tests/e2e/...`).

---

## 2) Listing tests

```powershell
Set-Location "C:\Users\schur\workspaces\NYC Explorer"
npx playwright test --list
```

---

## 3) webServer config: why `localhost:5000` appears twice

Yes — it belongs in both places:

```ts
webServer: {
  command: 'dotnet run --project "apps/web-mvc/NYCExplorer.csproj" --urls http://localhost:5000',
  url: 'http://localhost:5000',
  reuseExistingServer: !process.env.CI,
},
```

- `--urls http://localhost:5000` = what ASP.NET binds to.
- `url: 'http://localhost:5000'` = what Playwright waits for.

They must match.

---

## 4) Proving the dotnet server command works (manual)

This was confirmed to return HTTP 200 when run correctly:

```powershell
Set-Location "C:\Users\schur\workspaces\NYC Explorer"
$proj = "C:\Users\schur\workspaces\NYC Explorer\apps\web-mvc\NYCExplorer.csproj"
$arg = "run --project `"$proj`" --urls http://localhost:5000"

$p = Start-Process -FilePath "dotnet" -ArgumentList $arg -WorkingDirectory (Split-Path $proj -Parent) -PassThru
Start-Sleep -Seconds 5
(Invoke-WebRequest "http://localhost:5000" -UseBasicParsing -TimeoutSec 5).StatusCode
Stop-Process -Id $p.Id -ErrorAction SilentlyContinue
```

If you see `The provided file path does not exist: C:\Users\schur\workspaces\NYC.`, that’s broken quoting/argument splitting.

---

## 5) Run one test file (the “No tests found” fix)

This failed:
- `npx playwright test e2e\probe.spec.ts ...` → **No tests found**

Because NYC’s `testDir` is `./tests`, the correct path is:

```powershell
npx playwright test "tests/e2e/probe.spec.ts" --project=chromium --workers=1 --reporter=line
```

---

## 6) Run using normal config (includes webServer)

```powershell
Set-Location "C:\Users\schur\workspaces\NYC Explorer"
npx playwright test "tests/e2e/probe.spec.ts" --project=chromium --workers=1 --reporter=line
```

---

## 7) Port checks

```powershell
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue |
  Select-Object -First 5 LocalAddress,LocalPort,State,OwningProcess | Format-Table -AutoSize
```
