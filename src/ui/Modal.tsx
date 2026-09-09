import { useEffect, type ReactNode } from 'react'
import { t } from '../i18n'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  /** Extra buttons for the footer, left of the Close button. */
  actions?: ReactNode
  /** Widen for table-heavy content like the cut list. */
  wide?: boolean
}

export function Modal({ title, onClose, children, actions, wide }: ModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div
        className={wide ? 'modal modal--wide' : 'modal'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <h2>{title}</h2>
          <button type="button" className="btn btn--icon" onClick={onClose} aria-label={t('actions.close')}>
            ×
          </button>
        </header>
        <div className="modal__body">{children}</div>
        <footer className="modal__footer">
          {actions}
          <button type="button" className="btn" onClick={onClose}>
            {t('actions.close')}
          </button>
        </footer>
      </div>
    </div>
  )
}
