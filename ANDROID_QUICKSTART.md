# Android Quick Start - SoloLvlUp

Get your RPG app running on Android in under 10 minutes!

---

## Prerequisites

- Node.js installed
- Android Studio installed (https://developer.android.com/studio)
- USB device with developer mode enabled OR Android emulator

---

## Steps

### 1. Build Next.js App

```bash
npm install
npm run build
```

This creates the `out/` folder with your static site.

### 2. Add Android Platform

```bash
npx cap add android
```

This creates the `android/` folder with the complete Android Studio project.

### 3. Sync Files to Android

```bash
npm run capacitor:sync
```

This copies your Next.js build to the Android project.

### 4. Open in Android Studio

```bash
npm run capacitor:open:android
```

Android Studio will open automatically.

### 5. Run on Device

In Android Studio:
1. Click the **Play** button (green triangle) at the top
2. Select your connected device or emulator
3. App will install and launch

**OR** use CLI:

```bash
npm run capacitor:build:android
```

---

## Testing Your App

### Test Auth Flow
1. Sign up with a new account
2. Verify it creates profile in Supabase
3. Log out and log back in
4. Check username displays correctly

### Test RPG Features
1. Add a quest via "Arise" button
2. Complete a quest
3. Check stats update
4. Check completed count increments
5. Reset and verify everything clears

### Test Offline
1. Enable airplane mode
2. App should load (uses localStorage)
3. Disable airplane mode
4. Auth and quest generation should work

---

## Common Issues

**Issue:** White screen on launch
**Fix:** Run `npm run build && npm run capacitor:sync` again

**Issue:** Environment variables not working
**Fix:** Ensure they start with `NEXT_PUBLIC_` and rebuild

**Issue:** Android Studio won't open
**Fix:** Set ANDROID_HOME environment variable:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
```

---

## Next Steps

- Read `ANDROID_BUILD_GUIDE.md` for production builds
- Read `DEPLOYMENT_GUIDE.md` for Google Play submission
- Test on multiple Android versions (API 26-34)

---

**You're ready to ship!** 🚀
