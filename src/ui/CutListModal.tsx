import { t } from '../i18n'
import { useProjectStore } from '../state/store'
import { useUiStore } from '../state/uiStore'
import { selectCutoutList, selectProjectHardware } from '../state/selectors'
import { Modal } from './Modal'

export function CutListModal() {
  const cabinets = useProjectStore((s) => s.project.cabinets)
  const settings = useProjectStore((s) => s.project.settings)
  const closeModal = useUiStore((s) => s.closeModal)

  const rows = selectCutoutList(cabinets, settings)
  const hardware = selectProjectHardware(cabinets, settings)

  const printButton = (
    <button type="button" className="btn" onClick={() => window.print()}>
      {t('actions.print')}
    </button>
  )

  return (
    <Modal title={t('cutList.title')} onClose={closeModal} actions={printButton} wide>
      {rows.length === 0 ? (
        <p>{t('cutList.empty')}</p>
      ) : (
        <div className="cut-list">
          <table className="cut-list__table">
            <thead>
              <tr>
                <th>{t('cutList.columns.cabinet')}</th>
                <th>{t('cutList.columns.part')}</th>
                <th className="num">{t('cutList.columns.width')}</th>
                <th className="num">{t('cutList.columns.height')}</th>
                <th className="num">{t('cutList.columns.thickness')}</th>
                <th>{t('cutList.columns.edgeBanding')}</th>
                <th className="num">{t('cutList.columns.quantity')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td>{row.cabinetName}</td>
                  <td>{t(`cabinet.roles.${row.panelRole}`)}</td>
                  <td className="num">{row.width}</td>
                  <td className="num">{row.height}</td>
                  <td className="num">{row.thickness}</td>
                  <td>{row.edgeBanding || t('cutList.noBanding')}</td>
                  <td className="num">{row.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="cut-list__legend">{t('cutList.edgeBandingLegend')}</p>

          <div className="hardware-summary">
            <h3>{t('hardware.title')}</h3>
            <dl>
              <div>
                <dt>{t('hardware.hinges')}</dt>
                <dd>{hardware.hinges}</dd>
              </div>
              <div>
                <dt>{t('hardware.screws')}</dt>
                <dd>{hardware.screwsWithMargin}</dd>
              </div>
              <div>
                <dt>{t('hardware.shelfPins')}</dt>
                <dd>{hardware.shelfPins}</dd>
              </div>
              <div>
                <dt>{t('hardware.hangers')}</dt>
                <dd>{hardware.hangers}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </Modal>
  )
}
