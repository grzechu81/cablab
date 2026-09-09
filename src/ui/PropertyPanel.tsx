import { t } from '../i18n'
import { useProjectStore } from '../state/store'
import { useUiStore } from '../state/uiStore'
import { newId } from '../state/defaults'
import { evenShelfHeightOffsets } from '../domain/shelves'
import {
  CheckboxField,
  NumberField,
  SelectField,
  TextField,
} from './fields'
import type {
  CabinetInput,
  DoorConfig,
  JoinType,
  OverlayType,
  ShelfInput,
} from '../domain/types'

const JOIN_TYPES: JoinType[] = ['top-first', 'side-first']
const DOOR_CONFIGS: DoorConfig[] = ['none', 'single', 'double']
const OVERLAY_TYPES: OverlayType[] = ['full-overlay', 'half-overlay', 'inset']

export function PropertyPanel() {
  const selectedId = useUiStore((s) => s.selectedCabinetId)
  const select = useUiStore((s) => s.select)
  const cabinet = useProjectStore((s) =>
    s.project.cabinets.find((c) => c.id === selectedId),
  )
  const defaultBoardThickness = useProjectStore(
    (s) => s.project.settings.defaultBoardThickness,
  )
  const updateCabinet = useProjectStore((s) => s.updateCabinet)
  const removeCabinet = useProjectStore((s) => s.removeCabinet)

  if (!cabinet) {
    return (
      <aside className="property-panel property-panel--empty">
        <p>{t('propertyPanel.empty')}</p>
      </aside>
    )
  }

  const patch = (changes: Partial<CabinetInput>) =>
    updateCabinet(cabinet.id, changes)

  const setShelves = (shelves: ShelfInput[]) => patch({ shelves })
  const updateShelf = (index: number, changes: Partial<ShelfInput>) =>
    setShelves(
      cabinet.shelves.map((shelf, i) =>
        i === index ? { ...shelf, ...changes } : shelf,
      ),
    )

  // Adding a shelf re-spaces the whole set evenly; each heightOffset stays
  // editable afterwards.
  const addShelf = () => {
    const boardThickness = cabinet.boardThickness || defaultBoardThickness
    const heights = evenShelfHeightOffsets(
      cabinet.shelves.length + 1,
      cabinet.height,
      boardThickness,
    )
    setShelves([
      ...cabinet.shelves.map((shelf, i) => ({ ...shelf, heightOffset: heights[i] })),
      {
        id: newId(),
        frontOffset: 0,
        heightOffset: heights[heights.length - 1],
        structural: false,
      },
    ])
  }

  return (
    <aside className="property-panel">
      <header className="property-panel__head">
        <TextField
          label={t('cabinet.nameLabel')}
          value={cabinet.name}
          onChange={(name) => patch({ name })}
        />
        <button
          type="button"
          className="btn btn--danger btn--small"
          onClick={() => {
            removeCabinet(cabinet.id)
            select(null)
          }}
        >
          {t('actions.delete')}
        </button>
      </header>

      <section className="property-panel__group">
        <h3>{t('propertyPanel.body')}</h3>
        <NumberField
          label={t('propertyPanel.width')}
          value={cabinet.width}
          min={1}
          suffix={t('units.mm')}
          onChange={(width) => patch({ width })}
        />
        <NumberField
          label={t('propertyPanel.height')}
          value={cabinet.height}
          min={1}
          suffix={t('units.mm')}
          onChange={(height) => patch({ height })}
        />
        <NumberField
          label={t('propertyPanel.depth')}
          value={cabinet.depth}
          min={1}
          suffix={t('units.mm')}
          onChange={(depth) => patch({ depth })}
        />
        <SelectField
          label={t('propertyPanel.joinType')}
          value={cabinet.joinType}
          options={JOIN_TYPES.map((value) => ({
            value,
            label: t(`joinType.${value}`),
          }))}
          onChange={(joinType) => patch({ joinType })}
        />
        <NumberField
          label={t('propertyPanel.boardThickness')}
          value={cabinet.boardThickness}
          min={0}
          step={0.5}
          suffix={t('units.mm')}
          hint={t('propertyPanel.boardThicknessAuto', {
            value: defaultBoardThickness,
          })}
          onChange={(boardThickness) => patch({ boardThickness })}
        />
      </section>

      <section className="property-panel__group">
        <h3>{t('propertyPanel.doors')}</h3>
        <SelectField
          label={t('propertyPanel.doorConfig')}
          value={cabinet.doors.config}
          options={DOOR_CONFIGS.map((value) => ({
            value,
            label: t(`doorConfig.${value}`),
          }))}
          onChange={(config) =>
            patch({ doors: { ...cabinet.doors, config } })
          }
        />
        {cabinet.doors.config !== 'none' ? (
          <SelectField
            label={t('propertyPanel.overlayType')}
            value={cabinet.doors.overlayType}
            options={OVERLAY_TYPES.map((value) => ({
              value,
              label: t(`overlayType.${value}`),
            }))}
            onChange={(overlayType) =>
              patch({ doors: { ...cabinet.doors, overlayType } })
            }
          />
        ) : null}
      </section>

      <section className="property-panel__group">
        <h3>{t('propertyPanel.back')}</h3>
        <CheckboxField
          label={t('propertyPanel.backEnabled')}
          checked={cabinet.back.enabled}
          onChange={(enabled) =>
            patch({ back: { ...cabinet.back, enabled } })
          }
        />
        {cabinet.back.enabled ? (
          <NumberField
            label={t('propertyPanel.hdfThickness')}
            value={cabinet.back.hdfThickness}
            min={1}
            step={0.5}
            suffix={t('units.mm')}
            onChange={(hdfThickness) =>
              patch({ back: { ...cabinet.back, hdfThickness } })
            }
          />
        ) : null}
      </section>

      <section className="property-panel__group">
        <h3>{t('propertyPanel.hanger')}</h3>
        <CheckboxField
          label={t('propertyPanel.hangerEnabled')}
          checked={cabinet.hanger.enabled}
          onChange={(enabled) => patch({ hanger: { enabled } })}
        />
      </section>

      <section className="property-panel__group">
        <div className="property-panel__group-head">
          <h3>{t('propertyPanel.shelves')}</h3>
          <button type="button" className="btn btn--small" onClick={addShelf}>
            + {t('propertyPanel.addShelf')}
          </button>
        </div>

        {cabinet.shelves.length === 0 ? (
          <p className="property-panel__empty">{t('propertyPanel.noShelves')}</p>
        ) : (
          cabinet.shelves.map((shelf, index) => (
            <div key={shelf.id} className="shelf-row">
              <div className="shelf-row__head">
                <span>{t('propertyPanel.shelfN', { n: index + 1 })}</span>
                <button
                  type="button"
                  className="btn btn--icon btn--danger"
                  aria-label={t('actions.delete')}
                  onClick={() =>
                    setShelves(cabinet.shelves.filter((_, i) => i !== index))
                  }
                >
                  ×
                </button>
              </div>
              <NumberField
                label={t('propertyPanel.frontOffset')}
                value={shelf.frontOffset}
                min={0}
                suffix={t('units.mm')}
                onChange={(frontOffset) => updateShelf(index, { frontOffset })}
              />
              <NumberField
                label={t('propertyPanel.heightOffset')}
                value={shelf.heightOffset}
                min={0}
                suffix={t('units.mm')}
                onChange={(heightOffset) => updateShelf(index, { heightOffset })}
              />
              <CheckboxField
                label={t('propertyPanel.structural')}
                checked={shelf.structural}
                onChange={(structural) => updateShelf(index, { structural })}
              />
            </div>
          ))
        )}
      </section>
    </aside>
  )
}
