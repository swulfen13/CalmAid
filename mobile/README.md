# CalmAid mobile (Expo)

Native shell for the CalmAid web app. It loads the web app in a WebView and adds:

| Feature | Web browser | CalmAid app |
|---|---|---|
| CPR beat vibration | Android only (iPhone browsers can't vibrate) | **iPhone + Android** (expo-haptics) |
| Screen stays on during an emergency | Wake Lock API (most browsers) | **Always** (expo-keep-awake) |
| Read-aloud | Web Speech (varies) | **Native TTS** (expo-speech) |
| No connection | PWA cache | PWA cache + **native emergency screen** with call buttons and a vibrating CPR beat |

The app and the web share one codebase: everything in `../src` runs in both. `../src/native.ts` detects the app and routes haptics, keep-awake and speech to native code.

## Run locally (with Expo Go)

1. Start the web app so phones on your Wi-Fi can reach it:
   ```bash
   cd ..
   npm run dev:lan          # prints e.g. http://192.168.1.20:5173
   ```
2. Start Expo with that URL:
   ```bash
   cd mobile
   npm install
   EXPO_PUBLIC_WEB_URL=http://192.168.1.20:5173 npx expo start
   ```
3. Install **Expo Go** (App Store / Play Store) and scan the QR code.

## For judges (after deployment)

1. Deploy the web app (Vercel) and put its URL into `app.json` → `expo.extra.webUrl`.
2. Publish an update: `npx eas-cli@latest update --branch production` (free Expo account).
3. Share the QR code / link from the Expo dashboard. Judges open it with Expo Go on iOS or Android, no App Store needed.

## Limits
- Hands-free voice answers use the browser's speech recognition, which iOS/Android WebViews don't provide. In the app the yes/no buttons are used; everything else works.
- iOS: speech is silent when the phone's mute switch is on.

## Checks
```bash
npm run typecheck
npx expo export --platform android --platform ios   # verifies the bundle builds
```
