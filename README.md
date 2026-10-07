# Turtle Bay

A kids academic pet game for a Chromebook. A child names a turtle, keeps Hunger, Happy, and Clean in good shape, and earns coins in a typing trainer. Those coins buy care, accessories, and bigger habitats. Parents sign in separately and watch progress.

The turtle is the approved Pebble paint in `public/sprites/` (idle, sad, and eating), with hats and scarves layered from `public/sprites/accessories/`. Habitat scenes are layered WebPs in `public/sprites/habitat/` (a back painting and an RGBA front with Pebble drawn between them; source layers in `art/habitats/`). The title lives in `src/config.ts` as `APP_NAME` if you want to rename the bay.

## Run it

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

`npm run dev` stays in Demo mode unless `.env.local` has Firebase keys. You do not need a Firebase project to play locally.

```bash
npm test
npm run build
```

## Hosted site (GitHub Pages)

`npm run build` writes `dist/` for a project site at `/turtle-bay/`. It reads `.env.production`, which holds the public `turtle-bay-wally` web config, so the hosted build is a Synced bay.

1. Build with `npm run build`.
2. Replace `docs/` with `dist/` (keep `docs/.nojekyll`), commit, and push `main`. Pages serves Branch `main`, folder `/docs`, at `https://brookhouser.github.io/turtle-bay/`.
3. Open that `/turtle-bay/` URL on a Chromebook. `404.html` sends refreshed routes such as `/turtle-bay/home` back into the app.

Serve the same folder locally with any static host whose root contains a `turtle-bay` directory, then open `/turtle-bay/`. A `file://` open of `index.html` will not load the scripts, because the build asks for `/turtle-bay/assets/...`.

## Play the demo

1. Stay on Kid bay. Pick a bay name and a PIN, then choose Start a new bay. The bay name is not a real name, and the app never asks for one.
2. Name the turtle. You can rename it later with the pencil beside the name.
3. Open Challenges and finish lesson 1. Coins land in the jar when the line is done.
4. On Home, feed the turtle. Pet is free. A scrub costs a few coins too.
5. Open Shop and buy the sprout cap or some kelp. Equip it and it shows on the current habitat.
6. Sign out with Switch bay. Open Parent dock and choose a parent on the list. You will see meters, coins, and the typing session.

Demo progress stays in this browser (`localStorage`). PINs are stored as a hash, not as plain text.

## Parent list

Default parents (Google accounts, matched without caring about letter case):

- `brookhouser@gmail.com` (Kevin)
- `bbrookhouser@gmail.com` (Beth)

Set your own in `.env.local`:

```bash
VITE_PARENT_ALLOWLIST=one.parent@example.com,two.parent@example.com
```

An email that is not on the list cannot open the parent dock.

## Typing lessons

Eight lessons start on the home row and then reach for new keys:

1. Left anchors: A S D F
2. Right anchors: J K L and semicolon
3. Both hands together
4. Home row words
5. Home row flow
6. Index fingers reach G and H
7. Middle fingers reach E and I
8. Index fingers reach R and U

The lesson screen shows a full QWERTY keyboard, home row bumps on F and J, and which finger to use. Caps Lock is fine on lowercase lessons. Accuracy of 85% opens the next lesson. Missed keys can be practiced from the results screen or from Tricky keys on the challenge card.

Spelling and math are locked cards. A parent can save a placeholder for them, or add a playable typing drill, from the parent dock. New typing drills use the same lesson screen. You do not have to rewrite the app to add one.

## Habitats and shop

The turtle starts in a pebble bowl. The garden tank costs 500 coins. The reef bay costs 1500. Owned plants and shell beds stay equipped when the tank changes. Hats and scarves stay on the turtle.

Care costs:

- Pet: free, with a short rest between pets
- Basic nibble: 6 coins
- Scrub: 8 coins
- Snacks: bought in the shop, then used from Care

Meters ease down over time while the bay is closed, so coming back to feed and clean matters.

## Firebase

For local work, copy `.env.example` to `.env.local`. Leave the Firebase fields blank to keep demo mode. Do not commit `.env.local`. The parent list is already set to Kevin and Beth. Step by step setup, security rules, and Hosting are in `FIREBASE.md`.

`npm run build` is the GitHub Pages build (`/turtle-bay/`). `npm run build:hosting` is the Firebase Hosting build (site root). GitHub Pages serves `main` `/docs`, the committed output of `npm run build`.

Kid logins do not use Google. The app creates an email/password user at `{bayname}@kid.turtlebay.app` with the PIN as the password. Firebase asks for at least 6 characters, so a connected bay needs a PIN of 6 to 12 letters or numbers. Demo mode allows 4 to 12.

Parents use Google sign in. Only the allowlist can open the dock. Both parents share one family id (`VITE_FAMILY_ID`, default `turtlebay`). Kid profiles live at `families/{familyId}/kids/{uid}`.

What is saved: turtle name, meters, coins, owned and equipped items, habitat tier, lesson progress, custom challenges, and session history (date, WPM, accuracy, coins, tricky keys).

Client rules are a scaffold. A kid who can use the browser console could edit their own document. That is enough for a family demo. Move coin awards into Cloud Functions before a public launch.

Set `VITE_FORCE_DEMO=true` to ignore Firebase keys and stay on this Chromebook.
