# Git Workflow Guide: Web + Mobile Development

## Overview
This guide explains how to manage your SoloLvlUp RPG app with a single GitHub repo that deploys to both Vercel (web) and Google Play (Android).

---

## Initial Setup

### If Your Repo is Already Connected to Vercel

\`\`\`bash
# Clone your existing repo
git clone https://github.com/YOUR_USERNAME/sololevelup-rpg.git
cd sololevelup-rpg

# Install dependencies
npm install

# Your Vercel environment variables are already configured
# No need to reconfigure - they're in Vercel dashboard
\`\`\`

### Environment Variables Strategy

**In Vercel Dashboard:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Locally (.env.local - NEVER COMMIT):**
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
\`\`\`

---

## Branch Strategy

### Recommended Structure

\`\`\`
main (production-ready)
├── features/ui-improvements
├── features/quest-system-v2
└── hotfix/auth-bug

develop (staging for testing)
├── features/gameplay-changes
└── features/analytics
\`\`\`

### Workflow Commands

\`\`\`bash
# Create feature branch
git checkout -b features/your-feature-name

# Make changes
git add .
git commit -m "feat: description of changes"

# Push to GitHub
git push origin features/your-feature-name

# Create Pull Request on GitHub for review

# Once merged to main:
# - Vercel auto-deploys web version
# - You manually build Android from main branch
\`\`\`

---

## Deployment Workflow

### Web Deployment (Automatic)
\`\`\`
1. Push to main branch
2. GitHub triggers Vercel
3. Vercel builds and deploys within 2 minutes
4. Live at your-app.vercel.app
\`\`\`

### Android Deployment (Manual)
\`\`\`bash
# Always build from main branch for production
git checkout main
git pull origin main

# Build Android
npm run build
npm run capacitor:sync
cd android
./gradlew bundleRelease

# Upload APK to Google Play Console
# (See ANDROID_BUILD_GUIDE.md for details)
\`\`\`

---

## .gitignore Important Files

**These are ALREADY configured to be ignored:**
- `android/` - Built files only (source stays ignored)
- `*.jks` - Your signing keystore (NEVER COMMIT)
- `.env.local` - Your local credentials
- `ios/`, `node_modules/`, `.next/`

**CRITICAL: Never commit keystores or keys!**

---

## Version Control Best Practices

### 1. Commit Messages
\`\`\`
feat: add new quest achievement system
fix: resolve auth loading state hang
docs: update Android deployment guide
style: refactor dashboard styling
chore: update dependencies
\`\`\`

### 2. Before Pushing
\`\`\`bash
# Pull latest changes
git pull origin main

# Run lint check
npm run lint

# Build to verify
npm run build

# If no errors, push
git push origin your-branch
\`\`\`

### 3. Pull Request Checklist
- [ ] Feature works locally
- [ ] No console errors
- [ ] Environment variables are correct
- [ ] Builds successfully
- [ ] Mobile-responsive tested

---

## Keeping Both Deployments in Sync

### After Updating Dependencies
\`\`\`bash
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push origin main
# Wait for Vercel to deploy
# Then build Android with updated deps
\`\`\`

### After Auth Changes
\`\`\`bash
# Test on web first (instant on Vercel)
# Then rebuild Android with same changes
# Push web changes to main
# Then do Android release build
\`\`\`

### After Styling Updates
\`\`\`bash
# Vercel deploys immediately
# Android picks up same styles on next build
# Both platforms get the update automatically
\`\`\`

---

## Troubleshooting Git Issues

### "Permission denied (publickey)"
\`\`\`bash
# Your SSH key isn't configured
# Generate new key:
ssh-keygen -t ed25519 -C "your-email@example.com"

# Add to GitHub settings:
# GitHub Settings → SSH and GPG keys → New SSH key
cat ~/.ssh/id_ed25519.pub  # Copy this
\`\`\`

### "Your branch is behind by X commits"
\`\`\`bash
git pull origin main
git rebase origin/main  # OR git merge if you prefer
\`\`\`

### Android build fails after Git pull
\`\`\`bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npm run capacitor:sync
npm run build
\`\`\`

---

## Local Development Tips

### Quick local testing
\`\`\`bash
npm run dev
# Open http://localhost:3000
# Test features, then commit if good
\`\`\`

### Before committing
\`\`\`bash
# Check what files changed
git status

# Review exact changes
git diff

# Stage specific files
git add path/to/file.tsx
git commit -m "your message"
\`\`\`

### Comparing versions
\`\`\`bash
# See all commits
git log --oneline

# Compare two versions
git diff main develop

# See what changed in last commit
git show HEAD
\`\`\`

---

## Continuous Deployment Setup

### Automatic Web Deploy (Already Configured)
- Vercel watches your main branch
- Any push to main = automatic deploy
- Build status visible in GitHub

### Semi-Automatic Android Deploy
\`\`\`bash
# Create GitHub Actions workflow for Android builds
# (Optional - manual builds are safer for app releases)
# See ANDROID_BUILD_GUIDE.md for details
\`\`\`

---

## Summary

✅ **Same repo handles everything:**
- Web changes → Vercel deploys automatically
- Mobile changes → You build locally, upload to Google Play
- All changes tracked in Git history

✅ **No conflicts:**
- Each platform reads from same source code
- Environment variables stay separate
- Build outputs are in .gitignore

✅ **Easy to manage:**
- One GitHub repo to maintain
- One set of features/fixes
- Single source of truth
