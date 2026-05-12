@echo off
title MCreport Local Server
cd /d "%~dp0"

:: Find Node.js
set "NODE_DIR=%~dp0..\node-v22.15.0-win-x64"
if exist "%NODE_DIR%\node.exe" (
    set "PATH=%NODE_DIR%;%PATH%"
) else (
    where node >nul 2>&1
    if errorlevel 1 (
        echo ERROR: Node.js not found. Install it or place it in %NODE_DIR%
        pause
        exit /b 1
    )
)

echo.
echo  Starting MCreport server...
echo  Open http://localhost:3000/mcreport.html in your browser.
echo  Press Ctrl+C to stop.
echo.

npx --yes serve . -l 3000
pause
