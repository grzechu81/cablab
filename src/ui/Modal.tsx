import { useEffect, useRef, type ReactNode } from 'react'
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

  // Close only when a click both starts and ends on the backdrop itself.
  // A drag that begins inside the dialog (e.g. selecting text in a field and
  // overshooting the input) must never dismiss it, even when the mouse-up
  // lands on the backdrop.
  const pressOnBackdrop = useRef(false)

  return (
    <div
      className="modal__backdrop"
      onMouseDown={(event) => {
        pressOnBackdrop.current = event.target === event.currentTarget
      }}
      onMouseUp={(event) => {
        if (pressOnBackdrop.current && event.target === event.currentTarget) {
          onClose()
        }
        pressOnBackdrop.current = false
      }}
    >
      <div
        className={wide ? 'modal modal--wide' : 'modal'}
        role="dialog"
        aria-modal="true"
        aria-label={title}
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
