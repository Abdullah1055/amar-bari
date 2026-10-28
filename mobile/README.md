# আমার বাড়ি — Android app (Expo / React Native)

Mobile-first client for the same Supabase backend as the web app (`../supabase/migrations`). No backend changes were needed.

## Run
```bash
cd mobile
cp .env.example .env            # EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY (public values only)
npm install                     # .npmrc sets legacy-peer-deps (expo-router peer conflict)
npx expo start --android        # Expo Go or an emulator
```
Build an installable APK with EAS: `npx eas build -p android --profile preview` (eas.json is provided but untested here).

## Security notes
- Only the anon key ships in the app. The service-role key must never be in a mobile app.
- Session tokens are stored in Android Keystore via expo-secure-store (chunked), not AsyncStorage. `allowBackup` is false.
- `RoleGate` is a UX guard only. Real enforcement is RLS + SECURITY DEFINER functions in the database.
- Signup can only choose Bari Ala or Varatiye; the DB trigger rejects every other role.
- Creating a Manager needs the service role, so it stays on the web portal (or a future server endpoint). The app lists, approves and manages Manager permissions.

## Checks
```bash
npm run typecheck
npm run bundle:check            # Metro Android bundle
```

## Known limitations
- Not run on a device or emulator yet; only typechecked and bundled.
- No email deep links yet (confirmation / password-reset links open the Site URL, not the app).
- No app icon/splash assets, no push notifications, no automated UI tests.
- `src/lib/roles.ts` duplicates the web app's role constants; extract a shared package if drift becomes a risk.
