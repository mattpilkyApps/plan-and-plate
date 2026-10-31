import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function BottomSheet({
  children,
  className = '',
  eyebrow,
  footer,
  onClose,
  panelClassName = '',
  title,
  tone = 'default',
}) {
  const dialog = useRef(null)
  const close = useRef(onClose)
  const titleId = useId()
  useEffect(() => {
    close.current = onClose
  }, [onClose])
  useEffect(() => {
    const element = dialog.current
    const trigger = document.activeElement
    const overflow = document.body.style.overflow
    element.showModal()
    element.querySelector('[data-autofocus]')?.focus({ preventScroll: true })
    document.body.style.overflow = 'hidden'
    return () => {
      element.close()
      document.body.style.overflow = overflow
      if (trigger?.isConnected) trigger.focus?.({ preventScroll: true })
    }
  }, [])
  return createPortal(
    <dialog
      ref={dialog}
      className={`sheet-dialog ${tone === 'danger' ? 'sheet-danger' : ''}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        close.current?.()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close.current?.()
      }}
    >
      <div className={`sheet-panel ${panelClassName}`}>
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-heading">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 id={titleId}>{title || eyebrow || 'Plan & Plate'}</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className={`sheet-content ${className}`}>{children}</div>
        {footer}
      </div>
    </dialog>,
    document.body,
  )
}
