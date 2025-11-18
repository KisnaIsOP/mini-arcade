# 🚀 GitHub Setup Instructions

Follow these simple steps to upload your Mini Arcade to GitHub:

## Step 1: Create GitHub Repository

1. **Go to GitHub.com** and sign in to your account
2. **Click the "+" icon** in the top right corner
3. **Select "New repository"**
4. **Fill out the form:**
   - Repository name: `mini-arcade` (or your preferred name)
   - Description: `Fun collection of 4 browser-based mini games`
   - Set to **Public** (so others can see your awesome games!)
   - **Don't** initialize with README, .gitignore, or license (we already have these)
5. **Click "Create repository"**

## Step 2: Get Your Repository URL

After creating the repository, GitHub will show you a page with setup instructions. 

**Copy the HTTPS URL** that looks like:
```
https://github.com/YOUR_USERNAME/mini-arcade.git
```

## Step 3: Run Setup Scripts

### Option A: Automatic Setup (Recommended)

1. **Double-click** `setup-github.bat` in your mini-arcade folder
2. This will initialize your local Git repository
3. **Double-click** `upload-to-github.bat`
4. **Paste your repository URL** when prompted
5. Press Enter and wait for upload to complete

### Option B: Manual Setup

If the batch files don't work, open Command Prompt in your mini-arcade folder and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Mini Arcade with 4 games"

# Add your GitHub repository as remote (replace with your URL)
git remote add origin https://github.com/YOUR_USERNAME/mini-arcade.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Enable GitHub Pages (Optional)

To host your games online for free:

1. **Go to your repository** on GitHub.com
2. **Click "Settings"** tab
3. **Scroll down to "Pages"** in the left sidebar
4. **Under "Source"**, select "Deploy from a branch"
5. **Choose "main"** branch and "/ (root)" folder
6. **Click "Save"**
7. **Your games will be available** at: `https://YOUR_USERNAME.github.io/mini-arcade/`

## 🎉 You're Done!

Your Mini Arcade is now on GitHub! You can:

- **Share the repository** with friends and potential employers
- **Show off your coding skills** with a live demo via GitHub Pages
- **Continue developing** and push updates with `git push`
- **Accept contributions** from other developers

## 📝 Updating Your Games

To upload changes in the future:

```bash
git add .
git commit -m "Description of your changes"
git push
```

## 🔧 Troubleshooting

**If you get authentication errors:**
- Make sure you're signed in to GitHub
- You may need to use a Personal Access Token instead of password
- Go to GitHub Settings > Developer settings > Personal access tokens

**If push is rejected:**
- Make sure the repository is empty when you first push
- Try `git pull origin main` first, then `git push`

**Need help?** Feel free to search GitHub's documentation or ask for assistance!

---

**Happy coding! 🎮✨**