@echo off
echo Setting up Mini Arcade GitHub Repository...
echo.

REM Initialize git repository
git init

REM Add all files
git add .

REM Create initial commit
git commit -m "Initial commit: Mini Arcade with 4 games"

echo.
echo Git repository initialized successfully!
echo.
echo Next steps:
echo 1. Create a new repository on GitHub.com named "mini-arcade"
echo 2. Copy your repository URL (should look like: https://github.com/USERNAME/mini-arcade.git)
echo 3. Run the upload-to-github.bat file with your repository URL
echo.
pause