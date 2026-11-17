# FM Tracker mobile

React Native + TypeScript, running in **Expo Go** on iOS and Android. This is a
separate npm project; the Next.js app and its deployment remain at the repository
root. Use Node.js 22.13+ (or a supported newer LTS).

## Run

```sh
cd mobile
npm ci
cp .env.example .env
# Fill in .env as described below.
npm start
```

Scan the QR code with the Expo Go version supporting SDK 58. No prebuild,
development client, native Firebase SDK, or custom native modules are required.
`npm run android`, `npm run ios`, and `npm run web` are also available.

Set `EXPO_PUBLIC_API_URL` to the existing FM Tracker server origin, **without**
`/api`. Use HTTPS for deployed servers. For local development, start the root
Next.js app on `0.0.0.0` (`npm run dev -- --hostname 0.0.0.0`), put your computer's
LAN address in this URL, and connect your phone to the same network. `localhost`
on your phone points to the phone, not your computer.

Copy the web app's `NEXT_PUBLIC_FIREBASE_*` configuration into the corresponding
`EXPO_PUBLIC_FIREBASE_*` entries. These identify the same Firebase project; enable
Email/Password authentication there. Never put Firebase Admin credentials,
database URLs, or other server secrets in Expo's public environment variables.
Restart Metro with `npx expo start --clear` after changing the environment.

For browser previews, the backend must be same-origin/proxied or explicitly allow
your preview origin and the Authorization header via CORS. Native Expo Go fetches
do not require browser CORS changes.

## Included

- Mandatory email/password login and password reset using the Firebase JS SDK.
  Login restoration and backend account setup finish before any tabs are mounted.
  Sign-out destroys protected navigation and its cached screen state.
- Saves is the default tab, with search, game filtering, and tappable save cards.
- Create saves from the Saves tab: choose an active game version, start with a
  club (country, men's/women's domestic league, team) or unemployed, then review.
  Successful creation opens the save details; returning refreshes the saves list.
- Save details includes appointments, season/league/cup results, trophies, and
  challenge goal progress, with native back navigation.
- Owners can add club/national-team stints, seasons with optional league/cup
  results, and trophies from save details. Season/trophy teams come from career
  history; add a stint first for unemployed saves. Dates use `YYYY-MM-DD`.
  Returning after a successful submission refreshes the save.
- Challenges, achievements, grouped trophies, and account statistics/profile.
- Midnight, violet, and lavender styling matching the web app, safe areas,
  pull-to-refresh, loading, retry, and empty states.

Data comes from the existing `/api` endpoints using refreshed Firebase ID tokens.
There is no sample-data fallback. Creating saves and adding seasons, appointments,
and trophies are available on mobile; editing/deleting entries still uses the
website, then refresh on mobile. Register or sign in with email/password on mobile
or the website; both use the same Firebase account. Email/password authentication must be enabled
in the Firebase project. Browser popup Google sign-in is not used
because it does not work in native Expo Go. Google-only accounts need an
email/password provider linked in Firebase before using this login.

## Dependency policy

Use JavaScript libraries or native modules already shipped in Expo Go. Navigation
uses React Navigation with Expo-supported screens/safe-area modules; Firebase
uses its JavaScript SDK with Expo Go's AsyncStorage for session persistence.
AsyncStorage is not encrypted storage; tokens are managed and refreshed by
Firebase, and passwords are never stored by this app.

Install SDK-managed dependencies with `npx expo install`, not arbitrary versions.
Do not add `@react-native-firebase/*`, native Google Sign-In, or packages requiring
config plugins/prebuild for custom native code. The optional web target resolves
`firebase.web.ts` so it never imports native auth persistence.

```sh
npm run typecheck
npm test
npm run check:expo
npx expo export --platform all
```

Before shipping, also smoke-test a real account in Expo Go: registration, login,
all five tabs, club/unemployed save creation, adding stints/seasons/trophies,
save details, Android back/iOS swipe
back, refresh, restart/session restoration, sign-out, bad credentials, and
offline/retry. Export/type checks do not replace physical-device verification.
