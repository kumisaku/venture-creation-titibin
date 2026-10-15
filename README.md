# TitiBin — Binusian P2P Jastip

Android app built from the Figma prototype (`design/`).

- `mobile/` — React Native (Expo SDK 57, Expo Router, TypeScript)
- `backend/` — Node + Express API with built-in SQLite (`node:sqlite`, Node 22.5+)

## Run it

```bash
# 1. Backend (terminal 1)
cd backend
npm install
npm run seed      # resets the DB with the demo data from the designs
npm start         # http://localhost:4000

# 2. App (terminal 2)
cd mobile
npm install
npx expo start
```

Install **Expo Go** from the Play Store, keep the phone on the same Wi-Fi as this PC, and scan the QR code.
The app finds the API automatically at `http://<your-PC-IP>:4000`. If Windows Firewall asks, allow Node on private networks.
To point at another server, set `EXPO_PUBLIC_API_URL` before `npx expo start`.

## Demo accounts (seed data)

All seeded accounts use the password `titibin123`.

| Email | Role | What to try |
| --- | --- | --- |
| alvin@binus.ac.id | Buyer | Pesanan Saya, track/chat #TB-8829, review #TB-8810 |
| budi@binus.ac.id | Jastiper | 2 incoming requests, manage Narita trip |
| clarissa@binus.ac.id | Jastiper | Accept Alvin's pending Uniqlo request |

Switch role anytime in **Profil** (Titip / Jastiper toggle).

## Order flow

`pending` → jastiper accepts (`accepted`) or rejects → buyer pays into escrow (`paid`) →
jastiper marks `bought` → `arrived` (lolos bea cukai) → `on_the_way` → buyer confirms receipt (`completed`) → review.

Fees: jastip 20% + app 10% of item price.

## Not real yet

- Payments are simulated (no payment gateway); "escrow" is just order state.
- Google sign-in shows "coming soon"; email must end in `@binus.ac.id`, no email verification.
- Handover QR is the stylised design version; buyer confirms with a button rather than a camera scan.
- Trip cards use gradient artwork unless the jastiper uploads a catalog photo.

## Building an APK

`npx eas-cli@latest build -p android --profile preview` (needs a free Expo account), or install JDK 17 + Android SDK and run `npx expo run:android`.
The API must be reachable over the internet for a standalone build (deploy `backend/` somewhere and set `EXPO_PUBLIC_API_URL`).
