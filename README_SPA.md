# KO Investor Hub — SPA Conversion

Your multi-page app is now a **hash-routed single-page app**. The logged-in
area (Home, My Product, Invite/Support, Account, Deposit, Chat) loads inside one
shell without full page reloads. Sign-in, sign-up, admin, and legal pages stay
as normal standalone pages.

## How it works

- **`index.html`** is the SPA shell. It initializes Firebase **once**, runs a
  single auth guard, keeps the top bar / ticker / bottom nav persistent, and
  contains the router.
- The router reads the URL hash (`#/account`, `#/deposit?tab=withdraw`, …),
  fetches the matching **`view-<name>.html`** fragment, injects it, and runs
  that page's logic.
- All Firebase access inside pages goes through `window.__fb` (provided by the
  shell), so pages no longer each initialize their own Firebase app.

### Routes
| Hash | View |
|------|------|
| `#/` or `#/home` | `view-index.html` (package list / buy) |
| `#/income` | `view-income.html` (My Product) |
| `#/account` | `view-account.html` |
| `#/deposit` | `view-deposit.html` (supports `?tab=deposit` / `?tab=withdraw`) |
| `#/support` | `view-support.html` (Invite) |
| `#/chat` | `view-chat.html` |

## What to deploy

Upload **all** of these to your host (Netlify drag-and-drop or Firebase Hosting):

**SPA core (generated):**
- `index.html`  ← the shell (replaces your old home page)
- `view-index.html`, `view-income.html`, `view-account.html`,
  `view-deposit.html`, `view-support.html`, `view-chat.html`
- `sw.js`  ← updated, SPA-aware service worker
- `manifest.json`

**Standalone pages (kept separate):**
- `signin.html`, `signup.html`, `admin.html`,
  `privacy.html`, `terms.html`, `security.html`, `revenue.html`

**Config:**
- `netlify.toml` (security headers + SPA fallback) — Netlify
- `firebase.json`, `firestore.rules`, `firestore_indexes.json` — Firebase

**Your existing assets (must be present):**
- `og.png`, the package images `1coke.png`–`9coke.png`,
  `palmpay.png`, `crypto.png`, and any other icons the pages reference.

> These asset files are yours from the current live site — keep them in the
> deploy folder exactly as before. The SPA references them the same way.

## Important: Firestore rules

`firestore.rules` includes the **`wallet_bindings`** collection required by the
one-account-one-address withdrawal feature. Publish the rules (Firebase Console
→ Firestore → Rules, or `firebase deploy --only firestore:rules`) or wallet
binding will fail with permission-denied.

## Notes

- **Auth:** opening the SPA while signed out redirects to `signin.html`.
  After signing in, `signin.html` sends the user to `index.html`, which boots
  the SPA at `#/`.
- **Deep links / refresh:** `netlify.toml` (and your `firebase.json` rewrite)
  fall back to `index.html`, so refreshing on any route keeps working. Hash
  routes never hit the server anyway.
- **Service worker:** the new `sw.js` is network-first for HTML/views (updates
  show immediately) and cache-first for images/fonts. If testing updates,
  hard-refresh once so the old worker is replaced.
- **Admin** stays fully standalone at `admin.html` — it is not part of the SPA.
