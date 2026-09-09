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
  },
  cabinet: {
    defaultName: 'New cabinet',
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
  cutoutList: {
    title: 'Cut list',
    columns: {
      part: 'Part',
      width: 'Width',
      height: 'Height',
      thickness: 'Thickness',
      edgeBanding: 'Edge banding',
      quantity: 'Qty',
    },
    empty: 'Add a cabinet to see its cut list.',
  },
  hardware: {
    title: 'Hardware',
    hinges: 'Hinges',
    screws: 'Screws',
    shelfPins: 'Shelf pins',
    hangers: 'Hangers',
  },
  edges: {
    top: 'top',
    left: 'left',
    right: 'right',
    bottom: 'bottom',
  },
  persistence: {
    invalidJson: 'This file is not valid JSON.',
    notACablabFile: 'This file is not a CabLab project.',
    validationFailed: 'This CabLab project could not be loaded:\n{details}',
  },
} as const
