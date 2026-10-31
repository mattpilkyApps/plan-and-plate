import { CheckCircle2 } from 'lucide-react'
import Pressable from './Pressable'

export default function StatusToast({
  actionLabel,
  className = '',
  icon: Icon = CheckCircle2,
  message,
  onAction,
  positionClassName = '',
  show,
  title,
  tone = 'success',
}) {
  if (!show) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className={`status-toast toast-motion toast-${tone} ${positionClassName} ${className}`}
    >
      {Icon && <Icon size={21} className="toast-icon" />}
      <div className="toast-copy">
        {title && <strong>{title}</strong>}
        {message && <p>{message}</p>}
      </div>
      {actionLabel && onAction && (
        <Pressable
          size="sm"
          variant={tone === 'dark' ? 'secondary' : 'surface'}
          onClick={onAction}
        >
          {actionLabel}
        </Pressable>
      )}
    </div>
  )
}
