# Ptah Kamgou Calendar — mobile app

Personal 13-month calendar (Aquarian Era, year = Gregorian + 511). Infinite years, moon phases,
Italy + Cameroon holidays, converter, personal events (stored on the phone).

## Build the Android APK (one time setup)
1. Install Node.js LTS from nodejs.org (Windows installer).
2. In this folder:  `npm install`
3. `npx eas-cli@latest login`        (your expo.dev account)
4. `npx eas-cli@latest build -p android --profile preview`
   - first time it asks to create the project and an Android keystore: answer Yes.
5. When the build finishes (~15 min) open the link it prints on your phone, download the APK, install.

## Try it instantly (optional)
`npx expo start` then scan the QR code with the Expo Go app.

Events can be edited, set to repeat yearly (Ptah Kamgou or Gregorian date), given an 08:00 reminder
(local notification, works offline), and backed up/restored as text from the Events tab.

Code: `src/reminders.ts` (notifications), `src/events.ts` (event storage), `src/engine.ts` (calendar rules), `src/screens.tsx` (UI), `App.tsx` (tabs).
