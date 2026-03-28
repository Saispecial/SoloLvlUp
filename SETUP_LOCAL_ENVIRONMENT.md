# Local Development & Android Build Environment Setup

## Prerequisites

### Windows
\`\`\`bash
# Install Chocolatey first (https://chocolatey.org/install)
# Then run in PowerShell as Administrator:

choco install jdk11
choco install android-sdk
\`\`\`

### macOS
\`\`\`bash
brew install openjdk@11
brew install android-sdk
brew install gradle
\`\`\`

### Linux (Ubuntu/Debian)
\`\`\`bash
sudo apt-get install openjdk-11-jdk
sudo apt-get install android-sdk
\`\`\`

## After Download & Extract

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Create Capacitor Platforms
\`\`\`bash
# Initialize Android platform
npx cap add android

# Sync web build to Android
npm run build
npm run capacitor:sync
\`\`\`

### 3. Set Environment Variables
Copy your `.env.production.example` to `.env.production`:
\`\`\`bash
cp .env.production.example .env.production
\`\`\`

Update with your Supabase credentials:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
\`\`\`

### 4. Generate Android Signing Key
\`\`\`bash
# Create keystore for signing APK
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# Save this file safely! You'll need it for app updates
\`\`\`

### 5. Configure Android Signing
Create `android/app/build.gradle` signing config:
\`\`\`gradle
signingConfigs {
    release {
        storeFile file("../my-release-key.jks")
        storePassword System.getenv("KEYSTORE_PASSWORD")
        keyAlias System.getenv("KEY_ALIAS")
        keyPassword System.getenv("KEY_PASSWORD")
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
    }
}
\`\`\`

### 6. Build Android APK
\`\`\`bash
# Build release APK
cd android
./gradlew assembleRelease

# Build AAB (for Google Play Store)
./gradlew bundleRelease

# Find your APK at: android/app/build/outputs/apk/release/app-release.apk
# Find your AAB at: android/app/build/outputs/bundle/release/app-release.aab
\`\`\`

### 7. Test on Device/Emulator
\`\`\`bash
# Debug build (for testing)
cd android
./gradlew installDebug

# Or open in Android Studio
open android (macOS)
start android (Windows)
\`\`\`

## Environment Variables Needed
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GEMINI_API_KEY` (optional, for AI features)

## Troubleshooting

**"command not found: gradle"**
- Add Android SDK to PATH
- Verify `local.properties` has correct SDK path

**Build fails with Java error**
- Ensure JDK 11+ is installed
- Check `JAVA_HOME` environment variable

**APK won't install**
- Clear app cache: `adb shell pm clear com.sololevelup`
- Ensure device allows unknown sources

## Next Steps
1. Generate signing key
2. Configure signing in `android/app/build.gradle`
3. Run `./gradlew bundleRelease` for Google Play
4. Upload AAB to Google Play Console
