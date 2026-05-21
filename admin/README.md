# Wewarna Admin

Local-only content editor. Runs at `127.0.0.1:5174`. Never deployed with the site.

## Setup (once)

```sh
npm run admin:setup
```

Enter a password (≥12 chars). Saved to `.env.admin` (gitignored).

## Run

```sh
npm run admin     # admin at http://localhost:5174
npm run dev       # site preview at http://localhost:5173 (separate terminal)
```

## What you can edit

- Nav, Hero, Marquee, Collection, Story, Process, Lookbook, Values, Contact, Footer, WhatsApp.

## Publish

Click **Publish…** in the admin. Stages only `src/data/content.*.json` and `public/uploads/**`, commits, rebases, pushes to `origin/main`. GitHub Actions redeploys automatically.

## Security

- Binds `127.0.0.1` only
- Password hashed with sha256; timing-safe comparison
- 10 failures → 15-min IP lockout
- Session token in server memory only; invalidated on restart
