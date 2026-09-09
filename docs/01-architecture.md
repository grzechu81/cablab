# CabLab — Architecture

## Tech stack

- **Framework:** React (TypeScript)
- **3D rendering:** three.js via react-three-fiber (+ `@react-three/drei` for
  `OrbitControls` and helpers)
- **State management:** Zustand (or React Context + useReducer if we want zero
  extra dependencies — decide when bootstrapping; Zustand is the lean default)
- **Validation:** zod (for validating loaded project JSON against the schema)
- **Testing:** Vitest (or Jest) for the calculation engine; React Testing Library
  for component-level tests if needed
- **Hosting:** static build, deployed to Netlify/Vercel/GitHub Pages — no server,
  no database, no auth

## System diagram

```
┌─────────────────────────────────────────────────────────┐
│                        UI Layer                         │
│  Sidebar (cabinet list + Add/Project/Save/Load/Cutouts) │
│  Property panel (edit selected cabinet's inputs)         │
│  Project settings modal · Cutout list modal               │
└───────────────────────┬───────────────────────────────────┘
                         │ reads/writes
┌───────────────────────▼───────────────────────────────────┐
│                   App State (Zustand store)                │
│  Project { cabinets: CabinetInput[], settings: ProjectSettings } │
│  CabinetInput = RAW INPUTS ONLY                              │
│  (width, height, depth, joinType, doorConfig, shelfConfig,   │
│   backConfig, hangerConfig, position, positionMode)           │
└───────────────────────┬───────────────────────────────────────┘
                         │ derives (pure function, memoized per cabinet)
┌───────────────────────▼───────────────────────────────────────┐
│              Domain / Calculation Engine (pure TS)              │
│  computeCabinetGeometry(input: CabinetInput): CabinetGeometry {  │
│    panels: Panel[]        // dims, position, edge-banding flags  │
│    hardware: HardwareCount // hinges, screws, shelf pins          │
│  }                                                                  │
│  No React. No three.js. No DOM. Fully unit-testable in isolation.  │
└───────────────────────┬───────────────────────────────────────────┘
                         │ feeds
┌───────────────────────▼───────────────────────────────────────────┐
│                  3D Scene (react-three-fiber)                       │
│  One mesh group per cabinet, built from panels[]                    │
│  OrbitControls for camera · raycasting for selection                 │
│  Axis-constrained drag-to-move (X/Y free, Z while holding Ctrl)       │
└───────────────────────────────────────────────────────────────────────┘

Persistence (no backend):
  Save → serialize Project state → trigger browser download of .json
  Load → user picks .json → parse → validate with zod → hydrate store
```

## Layer responsibilities

### UI Layer
Owns nothing but presentation and user input. Reads from the store, writes user
edits back to the store. Never computes panel dimensions or hardware counts itself.

### App State
Holds only what the user actually configured — never derived data. This is the
thing that gets serialized to the save file. Keeping it input-only (rather than
also caching computed geometry) means the cut list and 3D view can never drift
out of sync with the actual settings: they are recomputed, not stored.

### Calculation Engine
The core value of the app. Pure functions, no framework dependencies, so they can
be unit tested directly with plain input/output assertions (e.g. "600×720×400mm,
top-first join → these exact 6 panels"). See `03-calculation-engine.md` for the
approach and formulas.

### 3D Scene
Consumes `CabinetGeometry` (already-computed panel list) and renders it — it does
not do any cabinet math itself. Handles camera, selection, and dragging.

## Key architectural decision: derive, don't store

`CabinetInput` (raw settings) is the single source of truth. `CabinetGeometry`
(panels, hardware, cutout entries) is always recomputed from it — never persisted,
never mutated directly. This avoids an entire class of bugs where the displayed
cut list or 3D model falls out of sync with what the user actually configured.
