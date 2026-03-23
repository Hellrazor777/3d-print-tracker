@echo off
:: ─────────────────────────────────────────────
::  3D Print Tracker — Deploy to GitHub
::  Double-click this file to commit and push
:: ─────────────────────────────────────────────

:: Read version from package.json
for /f "tokens=2 delims=:, " %%a in ('findstr "\"version\"" package.json') do (
    set RAW_VERSION=%%a
    goto :got_version
)
:got_version
:: Strip quotes
set VERSION=%RAW_VERSION:"=%

echo.
echo  3D Print Tracker — Deploy to GitHub
echo  Version: %VERSION%
echo  ─────────────────────────────────────
echo.

:: Check git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Git is not installed.
    echo  Download it from https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

:: Initialise git repo if not already done
if not exist ".git" (
    echo  Setting up git repository for the first time...
    git init
    echo.
    echo  Enter your GitHub repository URL:
    echo  e.g. https://github.com/YourUsername/3d-print-tracker.git
    echo.
    set /p REPO_URL= URL: 
    git remote add origin %REPO_URL%
    echo.
)

:: Stage all files (respects .gitignore — skips node_modules and dist)
echo  Staging files...
git add .

:: Commit with version number
set COMMIT_MSG=v%VERSION%
echo  Committing as: %COMMIT_MSG%
git commit -m "%COMMIT_MSG%"

:: Push to GitHub
echo.
echo  Pushing to GitHub...
git push -u origin main 2>nul || git push -u origin master 2>nul

if errorlevel 1 (
    echo.
    echo  Push failed. If this is your first push you may need to
    echo  authenticate with GitHub. Follow the prompts above.
) else (
    echo.
    echo  Done! v%VERSION% pushed to GitHub.
)

echo.
pause
