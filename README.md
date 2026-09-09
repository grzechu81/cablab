# CabLab

**Live: <https://grzechu81.github.io/cablab/>**

A client-side web app for designing simple, self-built cabinets: enter a body
(width × height × depth), pick how the panels join, add doors / shelves / a back
panel, and get real panel dimensions, a hardware estimate, a printable cut list,
and a 3D scene of the whole project. No backend — a project saves and loads as a
single JSON file.

Built with Vite + React + TypeScript, three.js / react-three-fiber for the 3D
view, Zustand for state, and zod for save-file validation.

## Develop

Requires Node ≥ 20.19 (see `.nvmrc`).

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm test           # Vitest (calculation engine, persistence, collision, …)
npm run lint       # oxlint
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build locally
```

## Deploy

Pushing to `main` publishes to **GitHub Pages** at
<https://grzechu81.github.io/cablab/> via `.github/workflows/deploy.yml`. Setup,
the base-path config, and gotchas are in `docs/06-deployment.md`.

## More

- `CLAUDE.md` — orientation for working in this repo (layout, conventions).
- `docs/` — the design source of truth (`00-overview` → `06-deployment`).
