# SoloLvlUp Deployment Guide

## Web Deployment (Next.js)

### Deploy to Vercel (Recommended)

1. **Connect GitHub Repository**
   \`\`\`bash
   # Push your code to GitHub
   git push origin main
   \`\`\`

2. **Create Vercel Account**
   - Go to vercel.com
   - Click "Sign Up" → "Continue with GitHub"
   - Authorize GitHub

3. **Import Project**
   - Click "New Project"
   - Select your GitHub repository
   - Vercel auto-detects Next.js config

4. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all variables from your `.env.local`:
     \`\`\`
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     \`\`\`

5. **Deploy**
   - Click "Deploy"
   - Vercel builds and deploys automatically
   - Get your live URL: `https://your-project.vercel.app`

### Deploy to Netlify

\`\`\`bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy
netlify deploy --prod
\`\`\`

---

## iOS App Deployment

### Prerequisites
- Mac with Xcode installed
- Apple Developer account ($99/year)
- iPhone for testing

### Step 1: Prepare iOS Build

\`\`\`bash
# Build Next.js static export
npm run build

# Sync with Capacitor
npm run capacitor:sync

# Open Xcode
npm run capacitor:open:ios
\`\`\`

### Step 2: Configure Signing (Xcode)

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select "App" project
3. Go to "Signing & Capabilities"
4. Select your Apple Developer team
5. Update Bundle ID: `com.yourcompany.sololevelup`

### Step 3: Build & Archive

\`\`\`bash
# In Xcode:
# 1. Product → Destination → "Generic iOS Device"
# 2. Product → Archive
# 3. Distribute App → App Store Connect
# 4. Follow signing prompts
\`\`\`

### Step 4: Submit to App Store

1. Go to App Store Connect (appstoreconnect.apple.com)
2. Create new app entry
3. Add screenshots, description, pricing
4. Submit for review (typically 24-48 hours)

### Beta Testing with TestFlight (Easier First Step)

\`\`\`bash
# After archiving:
# 1. In Xcode Organizer, click "Distribute App"
# 2. Select "TestFlight"
# 3. Upload to TestFlight
# 4. Add testers via email
# 5. They install via TestFlight app
\`\`\`

---

## Android App Deployment

### Prerequisites
- Android Studio
- Google Play Developer account ($25 one-time)
- Android device or emulator

### Step 1: Create Signing Key

\`\`\`bash
# Generate keystore for signing
keytool -genkey -v -keystore my-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias

# Move keystore to project
mv my-release-key.jks android/app/
\`\`\`

### Step 2: Prepare Android Build

\`\`\`bash
# Build Next.js
npm run build

# Sync with Capacitor
npm run capacitor:sync

# Open Android Studio
npm run capacitor:open:android
\`\`\`

### Step 3: Build Signed APK/AAB

In Android Studio:
1. Build → Generate Signed APK/Bundle
2. Select keystore: `android/app/my-release-key.jks`
3. Enter keystore password (from Step 1)
4. Select "release" build variant
5. Generate AAB (recommended) or APK

### Step 4: Upload to Google Play

1. Go to Google Play Console
2. Create new app
3. Upload AAB file
4. Add screenshots, description, pricing
5. Submit for review (typically 2-4 hours)

---

## Environment Variables by Platform

### Vercel (Web)
- Set via Project Settings → Environment Variables
- Auto-exposes `NEXT_PUBLIC_*` variables

### iOS App
- Add to `capacitor.config.ts`:
\`\`\`typescript
const config: CapacitorConfig = {
  appId: 'com.yourcompany.sololevelup',
  appName: 'SoloLvlUp',
  webDir: 'out',
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
    },
  },
}
\`\`\`

### Android App
- Handled automatically via `capacitor.config.ts`
- Uses web app environment variables

---

## Recommended Deployment Order

1. **Deploy Web First**
   - Test at `https://your-project.vercel.app`
   - Fix any bugs

2. **Build & Test iOS**
   - Use TestFlight for beta (easier)
   - Submit to App Store

3. **Build & Test Android**
   - Upload to Google Play
   - Both platforms go live simultaneously

---

## Post-Deployment Checklist

- [ ] Test auth flow on web
- [ ] Test auth flow on iOS
- [ ] Test auth flow on Android
- [ ] Verify environment variables are set correctly
- [ ] Test offline functionality (if applicable)
- [ ] Check mobile responsiveness on actual devices
- [ ] Monitor error logs on Vercel dashboard
- [ ] Set up App Store Optimization (ASO) for discoverability

---

## Troubleshooting

### Deployment Issues

**"Environment variable not found"**
- Ensure variable is in Vercel/hosting settings
- Must restart deployment after adding variables
- Check `NEXT_PUBLIC_` prefix for client-side vars

**"Build fails on Vercel"**
- Check build logs
- Ensure `npm run build` works locally
- Check Node version compatibility

**"iOS build fails"**
- Update CocoaPods: `cd ios && pod install && cd ..`
- Check Xcode version (latest recommended)
- Verify Apple Developer account is active

**"Android build fails"**
- Ensure Java 11+ installed
- Update Android SDK tools
- Check keystore password is correct

---

## Monitoring & Updates

### Vercel Deployments
- Enable GitHub auto-deploys
- View deployment logs in Vercel dashboard
- Use `/api/` routes for serverless functions

### App Store Monitoring
- Monitor crash reports in TestFlight/App Store Connect
- Check user reviews and ratings
- Enable push notifications (optional future feature)

### Update Frequency
- Web: Deploy as often as needed
- iOS: Review typically takes 24-48 hours
- Android: Review typically takes 2-4 hours
