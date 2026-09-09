/**
 * English strings — the only locale that ships initially.
 *
 * Every user-visible string in the app lives here (see `docs/00-overview.md`:
 * "i18n-ready from day one"). Nothing else should hold display text. A second
 * locale is added by writing a sibling file of the same shape and registering
 * it in `./index.ts`.
 */

export const en = {
  app: {
    title: 'CabLab',
    tagline: 'Plan cabinets before you cut',
  },
  actions: {
    newProject: 'New',
    save: 'Save',
    load: 'Load',
    settings: 'Settings',
    cutList: 'Cut list',
    addCabinet: 'Add cabinet',
    delete: 'Delete',
    close: 'Close',
    cancel: 'Cancel',
    print: 'Print',
  },
  sidebar: {
    cabinets: 'Cabinets',
    empty: 'No cabinets yet — add one above.',
  },
  scene: {
    loading: 'Loading 3D view…',
    empty: 'Add a cabinet to start a project.',
    dragHint: 'Drag a cabinet to slide it on the floor · hold Alt to lift',
  },
  cabinet: {
    defaultName: 'New cabinet',
    nameLabel: 'Name',
    roles: {
      top: 'Top',
      bottom: 'Bottom',
      'left-side': 'Left side',
      'right-side': 'Right side',
      shelf: 'Shelf',
      back: 'Back',
      door: 'Door',
    },
  },
  propertyPanel: {
    empty: 'Select a cabinet to edit it.',
    body: 'Body',
    size: 'Size',
    width: 'Width',
    height: 'Height',
    depth: 'Depth',
    joinType: 'Panel join',
    boardThickness: 'Board thickness',
    boardThicknessAuto: 'Uses project default ({value} mm) when 0',
    doors: 'Doors',
    doorConfig: 'Configuration',
    overlayType: 'Overlay',
    doorsSeeThrough: 'See-through doors',
    back: 'Back panel',
    backEnabled: 'Has a back panel',
    hdfThickness: 'HDF thickness',
    hanger: 'Wall hanger',
    hangerEnabled: 'Has a wall hanger',
    shelves: 'Shelves',
    addShelf: 'Add shelf',
    noShelves: 'No shelves.',
    shelfN: 'Shelf {n}',
    frontOffset: 'Front offset',
    heightOffset: 'Height offset',
    structural: 'Structural (screwed, not pinned)',
  },
  joinType: {
    'top-first': 'Top / bottom over sides',
    'side-first': 'Sides over top / bottom',
  },
  doorConfig: {
    none: 'None',
    single: 'Single door',
    double: 'Double door',
  },
  overlayType: {
    'full-overlay': 'Full overlay',
    'half-overlay': 'Half overlay',
    inset: 'Inset',
  },
  settings: {
    title: 'Project settings',
    showDimensions: 'Show dimensions in the 3D view',
    defaultBoardThickness: 'Default board thickness',
    defaultShelfFrontOffset: 'Default shelf front offset',
    doorEdgeMargin: 'Door edge margin',
    doorCenterGap: 'Double-door centre gap',
    grooveWidth: 'Back groove width',
    grooveDepth: 'Back groove depth',
    grooveOffsetFromBack: 'Back groove offset',
    screwsPerJoint: 'Screws per joint',
    screwWasteMarginPercent: 'Screw waste margin',
  },
  cutList: {
    title: 'Cut list',
    empty: 'Add a cabinet to see its cut list.',
    columns: {
      cabinet: 'Cabinet',
      part: 'Part',
      width: 'Width',
      height: 'Height',
      thickness: 'Thickness',
      edgeBanding: 'Edge banding',
      quantity: 'Qty',
    },
    noBanding: '—',
    edgeBandingLegend:
      'Edge banding: W = a tape run the length of the Width, H = the length of the Height.',
  },
  hardware: {
    title: 'Hardware',
    hinges: 'Hinges',
    screws: 'Screws (incl. waste margin)',
    shelfPins: 'Shelf pins',
    hangers: 'Wall hangers',
  },
  units: {
    mm: 'mm',
    percent: '%',
  },
  persistence: {
    invalidJson: 'This file is not valid JSON.',
    notACablabFile: 'This file is not a CabLab project.',
    validationFailed: 'This CabLab project could not be loaded:\n{details}',
    loadFailedTitle: 'Could not load project',
  },
} as const
