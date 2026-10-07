# Firebase for Turtle Bay

Demo mode is the default. If the Firebase values below are missing, blank, or still placeholders, the app stays on this browser (`localStorage`) and never calls Google. Set `VITE_FORCE_DEMO=true` to force that even when keys are present.

Parents sign in with Google. Only these two addresses can open the parent dock. The check ignores letter case.

- `brookhouser@gmail.com` (Kevin)
- `bbrookhouser@gmail.com` (Beth)

Kids, including Wally, do not use Google. A parent creates a bay from the dock (or a kid starts one) with a bay name and a PIN. Firebase Auth stores that as email/password: `{bayname}@kid.turtlebay.app` and the PIN as the password. A connected bay needs a PIN of 6 to 12 letters or numbers. Demo mode allows 4 to 12.

Progress, the turtle, coins, and lesson history live in Firestore at `families/{familyId}/kids/{uid}`. The family id comes from `VITE_FAMILY_ID` and defaults to `turtlebay`. Both parents share that family.

## Demo progress import

The first time a kid signs in or starts a synced bay on a browser that still has demo progress in `localStorage`, the app copies that turtle, coins, accessories, lessons, and lesson history into the new bay. It only does this when the synced bay has no progress yet. It picks the demo bay with the same name, or else the demo bay with the most progress. The demo save stays on the device as a backup, and the flag `turtlebay.imported.v1` stops a second import.

## Env vars

Copy `.env.example` to `.env.local`. Do not commit `.env.local`.

Required before Firebase mode turns on:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

Also read by the app, and worth pasting from the same web app config:

- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_PARENT_ALLOWLIST` (already the two Gmail addresses)
- `VITE_FAMILY_ID` (default `turtlebay`)
- `VITE_FORCE_DEMO`

The real web app config for `turtle-bay-wally` is committed in `.env.production`, so `npm run build` makes a synced build. Web API keys are public by design. Firestore rules and the Auth authorized domains list are what protect the data. `.env.local` still overrides it for local work.

## Security rules

`firestore.rules` is the source of truth. Deploy with `firebase deploy --only firestore:rules`.

- A signed-in parent (those two emails, lowercased) can list, read, create, update, and delete every kid document in the family.
- A signed-in kid can get, create, and update only the document whose id is their Auth uid.
- A kid cannot list other kids and cannot delete.
- Everything else is denied.

A parent must sign in with Google (`sign_in_provider == 'google.com'`) and Google must mark the email verified. Email/Password is on for kid bays, so a password account that only claims a parent address is not a parent. The app makes the same check before it opens the parent dock. The rules do not use custom claims. Coin totals are still written by the client. That is fine for this family app. Move awards into Cloud Functions before a public launch.

## Hosting

`firebase.json` publishes the `dist/` folder and rewrites every path to `index.html`.

- `npm run build` writes a GitHub Pages build whose asset URLs start with `/turtle-bay/`.
- `npm run build:hosting` writes a Firebase Hosting build at the site root (`vite build --base /`). Hosting runs this before deploy.

GitHub Pages serves Branch `main`, folder `/docs`. `docs/` is the output of `npm run build` plus `.nojekyll` and the `404.html` deep link helper. To publish a new build: `npm run build`, replace `docs/` with `dist/` (keep `docs/404.html` and `docs/.nojekyll`), commit, and push `main`. Root `index.html` is the Vite source entry, not the Pages bundle. Firebase Hosting can go live later without turning Pages off first.

`.firebaserc` points the default project at `turtle-bay-wally`.

## Kevin checklist

Suggested Firebase project id: `turtle-bay-wally`. The console may adjust that if the id is taken. Use whatever id it actually creates. Do not invent a second one in this repo.

1. Firebase console, Add project, name suggestion `turtle-bay-wally`.
2. Build, Authentication, Sign-in method. Enable Google. Enable Email/Password (kids need it; Wally's PIN is the password).
3. Authentication, Settings, Authorized domains. Keep `localhost`. Add `brookhouser.github.io`. After Hosting exists, add the `web.app` and `firebaseapp.com` domains the console shows.
4. Build, Firestore Database, Create database.
5. Project settings, Your apps, Add web app. Copy the config. You do not need Analytics.
6. Put these into `.env.local` (and into Hosting or GitHub Actions env only if you add a deploy workflow later):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
7. Leave `VITE_PARENT_ALLOWLIST` as `brookhouser@gmail.com,bbrookhouser@gmail.com` unless you edit `firestore.rules` to the same addresses.
8. Install the Firebase CLI, then `firebase login`, `firebase use --add`, and `firebase deploy --only firestore:rules,hosting`.
9. Restart `npm run dev`. The login screen should say Synced bay, not Demo mode. Sign in with Google as Kevin or Beth. Create Wally's bay from the parent dock with a bay name and a PIN of 6 to 12 characters.
10. To keep https://brookhouser.github.io/turtle-bay/ on the current build, set GitHub Pages to the `/docs` folder before merging. Hosting replaces that only when you deploy and share the new Hosting URL.
