import { useEffect, useRef } from 'react'

export default function Dialog({ title, eyebrow, onClose, children, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    const dialog = ref.current
    const controls = () => [...dialog.querySelectorAll('button,input,textarea,select,a[href],[tabindex="0"]')].filter((node) => !node.disabled)
    controls()[0]?.focus()
    function keydown(event) {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key !== 'Tab') return
      const elements = controls()
      if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements.at(-1)?.focus() }
      else if (!event.shiftKey && document.activeElement === elements.at(-1)) { event.preventDefault(); elements[0]?.focus() }
    }
    document.addEventListener('keydown', keydown)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = overflow; previous?.focus() }
  }, [onClose])
  return <div className="modal-backdrop" onClick={onClose}><section ref={ref} className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}><div className="section-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div><button className="secondary-button" onClick={onClose}>Close</button></div>{children}</section></div>
}
