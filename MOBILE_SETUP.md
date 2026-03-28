# Capacitor Mobile Setup Guide for SoloLvlUp

## Environment Variables
Your existing `.env.local` will be automatically available. Capacitor uses the same environment system:

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
\`\`\`

These will be baked into the static export during the build process.

## Build & Deploy for Mobile

### iOS Setup
\`\`\`bash
npm run build
npm run capacitor:copy
npm run capacitor:open:ios
\`\`\`
Then in Xcode:
- Select your team and signing certificate
- Build and run on device/simulator

### Android Setup
\`\`\`bash
npm run build
npm run capacitor:sync
npm run capacitor:open:android
\`\`\`
Then in Android Studio:
- Select an emulator or connected device
- Click Run

## Key Features Maintained
✅ All authentication (Supabase) - works on mobile  
✅ Local RPG state (Zustand + localStorage)  
✅ All API routes work  
✅ Responsive design already mobile-optimized  
✅ Deep linking support for OAuth redirects  

## Mobile-Specific Considerations
1. **Safe Area**: The app already uses responsive design, but add `viewport-fit=cover` if needed
2. **Networking**: Test on real 3G/4G, not just WiFi
3. **Storage**: localStorage is available; data persists across app restarts
4. **Back Button**: Capacitor handles Android back button automatically
5. **Deep Linking**: Configure in `capacitor.config.ts` for OAuth callbacks

## Auth Flow on Mobile
1. User logs in → generates session token
2. Supabase auth works normally (offline support via CapacitorAuth plugin optional)
3. Token stored in browser storage (shared with Native)
4. OAuth redirects work via deep linking (auto-configured)

## Optional Enhancements
- Add push notifications: `@capacitor/push-notifications`
- Add offline support: Service Workers (already partially supported)
- Add native camera access for profile pictures
- Add native haptics for quest completion feedback

## Testing
\`\`\`bash
# Test on iOS simulator
npm run capacitor:build:ios

# Test on Android emulator
npm run capacitor:build:android
\`\`\`

Your backend authentication and all other API endpoints remain unchanged!
