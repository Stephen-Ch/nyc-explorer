@echo off
setlocal EnableExtensions DisableDelayedExpansion
rem import-prod.cmd  Import research into Neon PRODUCTION (plan 05). Double-click.
cd /d "%~dp0"
title NYC import - PRODUCTION
echo.
echo  NYC Explorer import: PRODUCTION
where node >nul 2>&1 || goto :nonode
for /f "tokens=1 delims=." %%v in ('node -p "process.versions.node"') do set "NODEMAJOR=%%v"
if %NODEMAJOR% LSS 20 goto :oldnode
if not defined NYC_IMPORT_PW goto :nopw
if exist "node_modules\pg\package.json" if exist "node_modules\csv-parse\package.json" goto :run
echo  First run: installing the two helper packages...
call npm ci --no-audit --no-fund
if errorlevel 1 goto :npmfail
:run
node import.mjs prod
set "RC=%errorlevel%"
if "%RC%"=="0" goto :ok
if "%RC%"=="2" goto :nothing
color 4F
echo.
echo  ==================================================
echo   FAILED. Nothing was kept. Tell Claude.
echo  ==================================================
goto :end
:ok
color 2F
echo.
echo  ==================================================
echo   PASS. Tell Claude it is done.
echo  ==================================================
goto :end
:nothing
color 1F
echo.
echo  ==================================================
echo   NOTHING NEW to import. Nothing was kept.
echo  ==================================================
goto :end
:nonode
color 4F
echo  FAILED: Node.js is not installed or not found. Tell Claude.
goto :end
:oldnode
color 4F
echo  FAILED: Node.js 20 or newer is needed. Tell Claude.
goto :end
:nopw
color 4F
echo  FAILED: NYC_IMPORT_PW is not set. Set it in "Edit environment variables for your account", then open a NEW window.
goto :end
:npmfail
color 4F
echo  FAILED: could not install the helper packages. Tell Claude.
goto :end
:end
echo.
echo  You can close this window. The log is import-log.txt in the import folder.
pause
endlocal
