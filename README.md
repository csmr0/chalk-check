# Chalk Check

A live classroom quiz/polling app. Host runs it from the front of the room;
students join from their own phones with a 5-character code.

This version talks to **Firebase Firestore** , so it runs as a normal static site — VS Code locally, GitHub Pages
in production, on your own domain.

## 1. Set up Firebase (free)

1. Go to https://console.firebase.google.com → **Add project**.
2. In the project: **Build → Firestore Database → Create database → Start in
   test mode** (test mode = open read/write for 30 days; see security note
   below before your event).
3. **Project settings** (gear icon) → scroll to **Your apps** → click the
   web icon `</>` → register an app (nickname doesn't matter, no hosting
   needed) → copy the `firebaseConfig` object it gives you.
4. Paste those values into `src/firebase.js`, replacing the placeholder
   `YOUR_API_KEY` etc.

### Security rules

Test mode opens your database to anyone who has the config for 30 days, then
locks it. For a one-off classroom activity that's usually fine. To make it
explicit and not time-bound, use these rules instead
(Firestore → Rules tab):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /chalkcheck/{docId} {
      allow read, write: if true;
    }
  }
}
```

This is still wide open — anyone with your Firebase config could write to
it. Firebase API keys aren't secret by design (security is meant to live in
the rules, not the key), but if you'll run this repeatedly, consider adding
Firebase App Check or tightening rules to validate document shape.

## 2. Run it locally in VS Code

You need [Node.js](https://nodejs.org) (v18+) installed.

```bash
npm install
npm run dev
```

Open the printed `localhost` URL. To test host + student on one machine,
open a second tab (or your phone on the same Wi-Fi, using the "Network" URL
Vite prints).

## 3. Put it on GitHub

```bash
git init
git add .
git commit -m "Chalk Check"
gh repo create chalk-check --public --source=. --push
# or create the repo on github.com and:
# git remote add origin https://github.com/YOUR_USER/chalk-check.git
# git branch -M main
# git push -u origin main
```

## 4. Deploy to GitHub Pages

A GitHub Actions workflow is already included
(`.github/workflows/deploy.yml`) and deploys on every push to `main`.

One-time setup on GitHub:
1. Repo → **Settings → Pages** → under **Build and deployment**, set
   **Source** to **GitHub Actions**.
2. Push to `main` (or re-run the workflow from the **Actions** tab). Your
   site will be live at `https://YOUR_USER.github.io/chalk-check/`.

(Alternative: `npm run deploy` uses the included `gh-pages` package to push
`dist/` to a `gh-pages` branch instead, if you'd rather not use Actions.)

## 5. Point your own domain at it

1. Edit `public/CNAME` — replace `yourdomain.com` with your actual domain
   (e.g. `quiz.example.com`) and push. Vite copies it into `dist/` on build.
2. At your domain registrar/DNS provider, add:
   - For a subdomain (`quiz.example.com`): a **CNAME** record pointing to
     `YOUR_USER.github.io`.
   - For an apex domain (`example.com`): four **A** records pointing to
     GitHub Pages' IPs — 185.199.108.153, 185.199.109.153,
     185.199.110.153, 185.199.111.153.
3. Back in **Settings → Pages**, enter the same custom domain in the
   **Custom domain** field and enable **Enforce HTTPS** once it's verified
   (can take a few minutes to a few hours for DNS to propagate).

Students on any device just visit that domain, tap **Join with a code**,
and enter what's on your screen.

## Notes

- The app polls Firestore every ~1.5s per screen. For real instant sync you
  could swap `storeGet`/`storeList` calls for Firestore's `onSnapshot`
  listeners in `src/firebase.js` — ask if you want that wired in.
- A student's name/score lives only in that browser tab's memory — a page
  refresh means rejoining as a new participant.
