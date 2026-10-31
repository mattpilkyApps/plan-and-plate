import { CheckCircle2 } from 'lucide-react'
import Pressable from './Pressable'

const toneClasses = {
  success: 'border-green-100 bg-[#EAF3DE] text-[#5A8D2B]',
  dark: 'border-stone-800 bg-stone-900 text-white',
  danger: 'border-red-100 bg-red-50 text-red-600',
}

function StatusToast({
  actionLabel,
  className = '',
  icon: Icon = CheckCircle2,
  message,
  onAction,
  positionClassName = 'bottom-[6.25rem]',
  show,
  title,
  tone = 'success',
}) {
  if (!show) {
    return null
  }

  const isDark = tone === 'dark'

  return (
    <div role="status" aria-live="polite"
      className={`toast-motion fixed left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-[430px] -translate-x-1/2 items-center justify-between gap-3 rounded-3xl border px-4 py-3 shadow-[0_14px_34px_rgba(30,41,59,0.16)] ${positionClassName} ${toneClasses[tone]} ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {Icon && <Icon className="shrink-0" size={22} />}
        <div className="min-w-0">
          {title && <p className="text-sm font-bold">{title}</p>}
          {message && (
            <p
              className={`line-clamp-2 font-bold ${
                title && isDark ? 'text-xs text-stone-300' : ''
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>

      {actionLabel && onAction && (
        <Pressable
          className="shrink-0 rounded-full px-4 py-2 text-sm"
          onClick={onAction}
          size="sm"
          variant={isDark ? 'secondary' : 'surface'}
        >
          {actionLabel}
        </Pressable>
      )}
    </div>
  )
}

export default StatusToast
