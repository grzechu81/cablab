# CabLab — Deployment

The app is a static Vite build. It is published to **GitHub Pages** and is live at:

**<https://grzechu81.github.io/cablab/>**

Anyone with the link can open it; there's no login. Save/Load happens entirely in
the visitor's browser (a JSON file download / upload) — nothing reaches a server.

## How it's wired

| Piece | Where |
|---|---|
| Build + publish | `.github/workflows/deploy.yml` — runs on every push to `main` and on manual dispatch |
| Pages base path | `vite.config.ts` → `base: '/cablab/'` for `build` and `vite preview`, `/` for `dev`. **Must equal the GitHub repo name.** |
| Keep out of search | `<meta name="robots" content="noindex">` in `index.html` |
| Node version | `.nvmrc` (`22`) and `package.json` `engines` (`>=20.19`, the Vite 8 floor) |

The workflow: `npm ci` → `npm run build` → upload `dist/` as a Pages artifact →
`actions/deploy-pages`. No `gh-pages` branch.

## Deploying a change

Just push to `main`:

```bash
git push origin main
```

Watch the run in the repo's **Actions** tab. When it's green the new build is
live (give it a minute for the CDN). The deployed URL also appears in the run's
`deploy` job summary.

## One-time GitHub setup

1. Repo **Settings → Pages → Build and deployment → Source: "GitHub Actions"**
   (NOT "Deploy from a branch" — that serves the raw source tree, so you'd get a
   blank page loading `/src/main.tsx`).
2. That change does not auto-trigger a build — re-run the latest workflow (Actions
   tab → the run → "Re-run all jobs") or push an empty commit.

## Gotchas seen in practice

- **Blank page right after fixing the Pages source.** The browser cached the old
  (source) `index.html`. Hard-reload (Cmd+Shift+R) or wait ~10 min for the Pages
  `Cache-Control` to expire. `curl` the URL to see the real current HTML — the
  built one references `/cablab/assets/index-*.js`, the stale source one
  references `/src/main.tsx`.
- **Renamed the repo?** Update `base` in `vite.config.ts` to match, or every
  asset 404s.

## Running the production build locally

```bash
npm run build
npm run preview   # serves the real build at http://localhost:4173/cablab/
```

`vite preview` uses the same `/cablab/` base as production, so it catches
base-path mistakes before they ship.

## Repo layout

The git repo is rooted at the project folder (`package.json` at the top level).
There is no remote-persistence, no environment variables, and no secrets — the
build is fully reproducible from a checkout.
