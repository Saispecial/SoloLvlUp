# Android Build & Deployment Guide for SoloLvlUp

## Prerequisites

1. **Install Android Studio**: Download from https://developer.android.com/studio
2. **Install Java JDK 17+**: Required for Android builds
3. **Install Capacitor CLI**: `npm install -g @capacitor/cli`

---

## Initial Android Setup

### 1. Initialize Android Project

```bash
# Install dependencies
npm install

# Build Next.js app
npm run build

# Add Android platform
npx cap add android

# Sync files to Android
npm run capacitor:sync
```

This creates the `android/` folder with all necessary Android project files.

---

### 2. Configure Android Manifest

The Android manifest (`android/app/src/main/AndroidManifest.xml`) will be auto-generated. Key settings:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="SoloLvlUp"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:exported="true"
            android:label="SoloLvlUp"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <!-- Deep Links for OAuth -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="sololvlup" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

---

## Building for Android

### Development Build (Debug APK)

```bash
# Open in Android Studio
npm run capacitor:open:android

# Or build directly
cd android
./gradlew assembleDebug

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

**Test on device/emulator:**
```bash
# Run on connected device
npm run capacitor:build:android

# Or manually install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

### Production Build (Release APK/AAB)

#### 1. Generate Signing Key

```bash
# Navigate to android/app
cd android/app

# Generate keystore
keytool -genkey -v -keystore sololvlup-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias sololvlup-key

# Enter details when prompted
# Store password securely!
```

#### 2. Configure Signing in Android Studio

Create `android/app/keystore.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=sololvlup-key
storeFile=sololvlup-release.jks
```

**IMPORTANT:** Add `keystore.properties` to `.gitignore`!

#### 3. Update `android/app/build.gradle`

Add before `android` block:

```gradle
def keystorePropertiesFile = rootProject.file("app/keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Add inside `android` block:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

#### 4. Build Release APK

```bash
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

#### 5. Build Release AAB (for Google Play)

```bash
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## Environment Variables for Android

### Option 1: Build-time Variables (Recommended)

Create `android/app/src/main/assets/capacitor.config.json`:

```json
{
  "appId": "com.sololvlup.app",
  "appName": "SoloLvlUp",
  "webDir": "out",
  "plugins": {
    "CapacitorHttp": {
      "enabled": true
    }
  }
}
```

Then in your Next.js app, access environment variables at build time:

```typescript
// Build-time env vars are baked into the static export
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Option 2: Runtime Configuration

Use Capacitor Preferences to store API keys after app launch:

```typescript
import { Preferences } from '@capacitor/preferences'

// Store at runtime
await Preferences.set({
  key: 'supabase_url',
  value: 'https://your-project.supabase.co'
})

// Retrieve
const { value } = await Preferences.get({ key: 'supabase_url' })
```

---

## Testing

### 1. Test on Physical Device

```bash
# Enable USB debugging on Android device
# Connect via USB
adb devices

# Install and run
npm run capacitor:build:android
```

### 2. Test on Android Emulator

```bash
# Create emulator in Android Studio
# AVD Manager → Create Virtual Device
# Select device (Pixel 6) and API 33+

# Run emulator
emulator -avd Pixel_6_API_33

# Deploy app
npm run capacitor:build:android
```

### 3. Test Deep Links (OAuth)

```bash
# Test auth callback
adb shell am start -W -a android.intent.action.VIEW \
  -d "sololvlup://auth/callback?code=test"
```

---

## Google Play Store Submission

### 1. Prepare Store Assets

Required:
- **App Icon**: 512x512 PNG
- **Feature Graphic**: 1024x500 PNG
- **Screenshots**: Min 2, phone & tablet (1080x1920, 1920x1080)
- **Privacy Policy URL**
- **App Description** (4000 chars max)

### 2. Create Google Play Developer Account

- Go to https://play.google.com/console
- Pay $25 one-time fee
- Complete developer profile

### 3. Create App

1. Go to Google Play Console
2. "Create App" → Fill in details
3. Select "App" category
4. Complete Store Listing:
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots
   - Feature graphic

### 4. Upload App Bundle

1. Production → Create new release
2. Upload `app-release.aab`
3. Fill in release notes
4. Review and roll out

**Review Time**: 2-4 hours typically

---

## App Versioning

Update version in `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        versionCode 2        // Increment for each release
        versionName "1.0.1"  // User-facing version
    }
}
```

Also update `package.json`:

```json
{
  "version": "1.0.1"
}
```

Then rebuild:

```bash
npm run build
npm run capacitor:sync
cd android && ./gradlew bundleRelease
```

---

## Common Issues & Fixes

### 1. Build Fails: "SDK not found"

```bash
# Set ANDROID_HOME in ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### 2. Cleartext HTTP Not Allowed

Add to `AndroidManifest.xml`:

```xml
<application android:usesCleartextTraffic="true">
```

Or use `android:scheme="https"` in `capacitor.config.ts`.

### 3. White Screen on Launch

Check:
- `npm run build` completed successfully
- `capacitor:sync` copied files to `android/app/src/main/assets/public`
- No console errors in Android Logcat

### 4. Environment Variables Not Working

Remember: Use `NEXT_PUBLIC_` prefix for client-side variables:

```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

Then rebuild with `npm run build`.

---

## Performance Optimization

### Enable Proguard (Code Shrinking)

Already configured in release build. To customize, edit `android/app/proguard-rules.pro`:

```proguard
# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keep class com.sololvlup.app.** { *; }
```

### Reduce APK Size

```gradle
android {
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
            universalApk true
        }
    }
}
```

This creates separate APKs for each architecture, reducing individual size.

---

## Checklist Before Release

- [ ] Test on multiple Android versions (API 26+)
- [ ] Test on different screen sizes (phone, tablet)
- [ ] Test all features (auth, quests, stats, settings)
- [ ] Test offline mode (if applicable)
- [ ] Verify all permissions are necessary
- [ ] Update version code/name
- [ ] Create signed release AAB
- [ ] Prepare store assets (icon, screenshots, description)
- [ ] Write privacy policy
- [ ] Test deep links/OAuth flow
- [ ] Submit to Google Play Console

---

## Useful Commands

```bash
# Clean build
cd android && ./gradlew clean

# Check signing
jarsigner -verify -verbose -certs app-release.apk

# List device logs
adb logcat | grep Capacitor

# Uninstall from device
adb uninstall com.sololvlup.app

# Check APK size
ls -lh android/app/build/outputs/apk/release/app-release.apk
```

---

Your SoloLvlUp RPG app is now ready for Android deployment!
