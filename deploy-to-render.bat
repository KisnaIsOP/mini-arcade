@echo off
echo 🚀 Deploying Mini Arcade to Render...
echo.

echo Step 1: Adding new files to Git...
git add .

echo.
echo Step 2: Committing changes...
set /p COMMIT_MESSAGE="Enter commit message (or press Enter for default): "
if "%COMMIT_MESSAGE%"=="" set COMMIT_MESSAGE=Add Render deployment configuration

git commit -m "%COMMIT_MESSAGE%"

echo.
echo Step 3: Pushing to GitHub...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SUCCESS! Files pushed to GitHub!
    echo.
    echo 🌐 Next steps for Render deployment:
    echo.
    echo 1. Go to https://render.com and sign up/login
    echo 2. Click "New +" → "Web Service"
    echo 3. Connect your GitHub repository: mini-arcade
    echo 4. Use these settings:
    echo    - Runtime: Node
    echo    - Build Command: npm install
    echo    - Start Command: npm start
    echo    - Plan: Free
    echo 5. Click "Create Web Service"
    echo.
    echo 📖 For detailed instructions, see RENDER_DEPLOYMENT_GUIDE.md
    echo.
    echo Your live URL will be: https://mini-arcade-[random].onrender.com
    echo.
) else (
    echo.
    echo ❌ Error pushing to GitHub. Please check your Git setup.
    echo.
)

pause