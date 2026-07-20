<<<<<<< HEAD
# audhdadventure
=======
# An AuDHD Adventure — web app

A Next.js + Supabase implementation of the full prototype: solo and party
(system) mode, daily check-ins, XP-based stat growth, masks, buffs & debuffs,
Actions & Spells, quests, history with edit/delete/undo, settings, reset
tools, and PWA installability. This app was hand-authored directly from the
already-verified HTML prototype and the product spec
(`../audhd_adventure_spec.md`) in an environment without npm registry access,
so **no dependency install or build has been run yet** — do that first, per
the steps below, before deploying.

## 1. Install

```bash
cd webapp
npm install
```

If `npm run build` turns up type errors, they'll be small — every formula
(pool math, XP growth, buff/mask costing) was ported unchanged from the
already-tested prototype, so issues are most likely narrow TypeScript nits
rather than logic bugs.

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the SQL Editor, paste and run the contents of
   `supabase/migrations/0001_init.sql`. This creates the `accounts`,
   `characters`, `history`, and `switch_log` tables, enables Row Level
   Security, and installs the trigger that auto-provisions a starting
   character for every new user.
3. In **Authentication → Settings**, turn on **Anonymous sign-ins**. This
   powers the "Continue as guest" option — without it, guest sign-in will
   fail with an explicit error message telling you to do this.

## 3. Set up Discord OAuth

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   and create a new application.
2. Under **OAuth2**, note the **Client ID** and **Client Secret**.
3. In Supabase, go to **Authentication → Providers → Discord**, enable it,
   and paste in the Client ID and Client Secret.
4. Supabase will show you a **Redirect URL** (something like
   `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`). Copy it into the
   Discord application's OAuth2 **Redirects** list.
5. In Supabase **Authentication → URL Configuration**, add your app's own
   callback route as a redirect URL too:
   - `http://localhost:3000/auth/callback` for local dev
   - `https://YOUR-DEPLOYED-DOMAIN/auth/callback` for production

## 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
your Supabase project's **Settings → API** page. Leave
`NEXT_PUBLIC_SITE_URL` as `http://localhost:3000` for local dev; set it to
your real domain in production (Vercel project env vars).

## 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` — it redirects to `/dashboard`, which redirects
to `/sign-in` until you authenticate.

## 6. Deploy

Per the spec's deployment plan: push this repo to GitHub, import it into
[Vercel](https://vercel.com), and set the same three env vars in the Vercel
project's **Settings → Environment Variables** (with `NEXT_PUBLIC_SITE_URL`
set to the real deployed domain). Add the production `/auth/callback` URL to
Supabase's redirect allow-list as described in step 3.

## PWA icons

`public/icons/icon.svg` and `icon-maskable.svg` are hand-drawn placeholder
icons — they work today (SVG icons are valid manifest icons and the app is
installable as-is), but for the best cross-platform install experience,
generate proper PNG icons (192×192, 512×512, and a 512×512 maskable variant)
from a tool like [realfavicongenerator.net](https://realfavicongenerator.net),
drop them into `public/icons/`, and add them to the `icons` array in
`src/app/manifest.ts`.

## Project structure

- `src/app/(app)/*` — authenticated pages (dashboard, check-in, growth,
  buffs, quests, history, settings), sharing the `AppShell` layout.
- `src/app/sign-in`, `src/app/help` — accessible signed out.
- `src/app/auth/callback` — OAuth code exchange route.
- `src/lib/game/*` — pure game-logic functions (pools, growth/XP, helpers,
  constants), ported directly from the prototype.
- `src/lib/store/useAppStore.ts` — Zustand store; every mutating action
  updates local state and writes through to Supabase.
- `src/lib/supabase/*` — browser/server Supabase clients (`@supabase/ssr`).
- `supabase/migrations/0001_init.sql` — schema, RLS policies, and the
  new-user provisioning trigger.
>>>>>>> 7c9ea5f (Initial commit: An AuDHD Adventure web app)
