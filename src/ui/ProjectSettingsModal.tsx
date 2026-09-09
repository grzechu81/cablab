import { t } from '../i18n'
import { useProjectStore } from '../state/store'
import { useUiStore } from '../state/uiStore'
import { Modal } from './Modal'
import { CheckboxField, NumberField } from './fields'

export function ProjectSettingsModal() {
  const settings = useProjectStore((s) => s.project.settings)
  const updateSettings = useProjectStore((s) => s.updateSettings)
  const closeModal = useUiStore((s) => s.closeModal)

  const mm = t('units.mm')

  return (
    <Modal title={t('settings.title')} onClose={closeModal}>
      <div className="settings-form">
        <CheckboxField
          label={t('settings.showDimensions')}
          checked={settings.showDimensions}
          onChange={(showDimensions) => updateSettings({ showDimensions })}
        />
        <NumberField
          label={t('settings.defaultBoardThickness')}
          value={settings.defaultBoardThickness}
          min={1}
          step={0.5}
          suffix={mm}
          onChange={(defaultBoardThickness) => updateSettings({ defaultBoardThickness })}
        />
        <NumberField
          label={t('settings.doorEdgeMargin')}
          value={settings.doorEdgeMargin}
          min={0}
          step={0.5}
          suffix={mm}
          onChange={(doorEdgeMargin) => updateSettings({ doorEdgeMargin })}
        />
        <NumberField
          label={t('settings.doorCenterGap')}
          value={settings.doorCenterGap}
          min={0}
          step={0.5}
          suffix={mm}
          onChange={(doorCenterGap) => updateSettings({ doorCenterGap })}
        />
        <NumberField
          label={t('settings.grooveWidth')}
          value={settings.grooveWidth}
          min={0}
          step={0.5}
          suffix={mm}
          onChange={(grooveWidth) => updateSettings({ grooveWidth })}
        />
        <NumberField
          label={t('settings.grooveDepth')}
          value={settings.grooveDepth}
          min={0}
          step={0.5}
          suffix={mm}
          onChange={(grooveDepth) => updateSettings({ grooveDepth })}
        />
        <NumberField
          label={t('settings.grooveOffsetFromBack')}
          value={settings.grooveOffsetFromBack}
          min={0}
          step={0.5}
          suffix={mm}
          onChange={(grooveOffsetFromBack) => updateSettings({ grooveOffsetFromBack })}
        />
        <NumberField
          label={t('settings.screwsPerJoint')}
          value={settings.screwsPerJoint}
          min={1}
          onChange={(screwsPerJoint) => updateSettings({ screwsPerJoint })}
        />
        <NumberField
          label={t('settings.screwWasteMarginPercent')}
          value={Math.round(settings.screwWasteMarginPercent * 100)}
          min={0}
          suffix={t('units.percent')}
          onChange={(percent) =>
            updateSettings({ screwWasteMarginPercent: percent / 100 })
          }
        />
      </div>
    </Modal>
  )
}
