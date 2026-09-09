# CabLab — Persistence & Save File Schema

No backend, no database. A project is a single JSON file the user saves/loads
via the browser's file download/upload.

## Save flow

1. User clicks **Save**.
2. Current `Project` state (see `02-domain-model.md`) is serialized to JSON.
3. Browser triggers a file download (e.g. `cablab-project.json`).

## Load flow

1. User clicks **Load** and picks a `.json` file.
2. File is parsed.
3. **Validated against a zod schema** matching the current `Project` shape.
4. If `schemaVersion` is older than current, run migration steps (see below)
   before hydrating the store.
5. If validation fails outright (not a CabLab file, corrupted), show a clear
   error — never silently load partial/garbage data.

## Schema versioning

Every saved project includes a `schemaVersion` integer field. This is the
single most important guard against future breakage: once real features get
added (drawers, new join types, hanger specs), old save files must still load.

```ts
interface Project {
  schemaVersion: number;
  settings: ProjectSettings;
  cabinets: CabinetInput[];
}
```

**Approach:** keep a small ordered list of migration functions, one per version
bump:

```ts
const migrations: Record<number, (old: any) => any> = {
  1: (v0) => ({ ...v0, schemaVersion: 1 /* add new required field with default */ }),
  // 2: (v1) => ...
};

function migrateProject(raw: any): Project {
  let data = raw;
  let version = data.schemaVersion ?? 0;
  while (migrations[version + 1]) {
    data = migrations[version + 1](data);
    version += 1;
  }
  return ProjectSchema.parse(data); // zod validation on the final shape
}
```

Start this pattern from `schemaVersion: 1` on day one, even before any real
migration is needed — retrofitting versioning after the first breaking change
is much more painful than starting with it.

## Autosave (optional, since PWA/offline was ruled out for v1)

Not required for v1 given the "just a normal web page" decision, but worth
noting as a cheap addition later: mirroring current `Project` state to
`localStorage` on change would let the app recover from an accidental tab
close without needing offline/installable support. Purely additive — doesn't
change the save-file format or flow above.
