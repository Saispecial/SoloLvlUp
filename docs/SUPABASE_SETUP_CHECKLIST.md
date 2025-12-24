# SoloLvlUp Supabase Setup Checklist

## Authentication Setup

### Email Verification
- [ ] Create Resend account at https://resend.com
- [ ] Get API key from https://resend.com/api-keys
- [ ] In Supabase Dashboard → Authentication → Email Provider → Enable Custom SMTP
- [ ] Configure SMTP settings:
  - Host: `smtp.resend.com`
  - Port: `465`
  - Username: `resend`
  - Password: Your Resend API key
  - Enable SSL: ✓
  - From Email: `onboarding@resend.dev`
  - From Name: `SoloLvlUp`
- [ ] Test signup flow at `/auth/signup`
- [ ] Verify confirmation email is received

### Authentication Providers
- [ ] Email + Password (default) ✓
- [ ] Magic Link (optional)
- [ ] OAuth (optional - GitHub, Google)

## Database Setup

### Tables Created
- [ ] `profiles` - User hunter profiles
- [ ] `quests` - Active quests
- [ ] `reflections` - Daily reflections
- [ ] `achievements` - User achievements
- [ ] `stats` - User statistics

### Row Level Security (RLS)
- [ ] All tables have RLS enabled
- [ ] Users can only access their own data
- [ ] Service role has full access for admin operations

### Triggers
- [ ] `created_at` auto-timestamp on inserts
- [ ] `updated_at` auto-timestamp on updates
- [ ] Profile auto-creation on user signup

## Cross-Device Sync

### Implemented
- [ ] Real-time subscriptions for live data
- [ ] Local persistence with IndexedDB (browser)
- [ ] Offline support with SWR caching
- [ ] Automatic sync when back online

## Testing Checklist

### Sign Up Flow
- [ ] Create account with email
- [ ] Receive verification email from Resend
- [ ] Click verification link
- [ ] Successfully logged in
- [ ] Profile created in database

### Quest Management
- [ ] Add new quest
- [ ] Complete quest
- [ ] Streak updates
- [ ] Data syncs across devices
- [ ] Data persists after refresh

### Achievements
- [ ] Achievements unlock correctly
- [ ] Achievement data syncs
- [ ] History displays properly

### Analytics
- [ ] Stats update in real-time
- [ ] Cross-device sync works
- [ ] Data persists
