@echo off
echo Uploading Mini Arcade to GitHub...
echo.

set /p REPO_URL="Enter your GitHub repository URL (e.g., https://github.com/username/mini-arcade.git): "

if "%REPO_URL%"=="" (
    echo Error: Repository URL cannot be empty!
    pause
    exit /b 1
)

echo.
echo Adding remote origin: %REPO_URL%
git remote add origin %REPO_URL%

echo.
echo Pushing to GitHub...
git branch -M main
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS! Mini Arcade has been uploaded to GitHub!
    echo Your repository is now available at: %REPO_URL%
    echo.
    echo You can now:
    echo - View your code on GitHub
    echo - Share the repository with others
    echo - Enable GitHub Pages to host the games online
    echo.
) else (
    echo.
    echo ❌ Error occurred during upload.
    echo Please check your GitHub credentials and repository URL.
    echo.
    echo Troubleshooting:
    echo 1. Make sure you're logged into Git with: git config --global user.name "Your Name"
    echo 2. Ensure you have access to the repository
    echo 3. Check if the repository URL is correct
    echo.
)

pause