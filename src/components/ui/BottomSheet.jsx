import { X } from 'lucide-react'
import Pressable from './Pressable'

function BottomSheet({
  children,
  className = '',
  eyebrow,
  footer,
  onClose,
  panelClassName = '',
  placement = 'bottom',
  title,
  tone = 'default',
  zIndex = 'z-20',
}) {
  const eyebrowClass = tone === 'danger' ? 'text-red-600' : 'text-[#5A8D2B]'
  const placementClass =
    placement === 'top'
      ? 'items-start pb-4 pt-4'
      : 'items-end pb-4'
  const panelMotionClass =
    placement === 'top' ? 'sheet-panel sheet-panel-top' : 'sheet-panel'

  return (
    <div
      className={`sheet-backdrop fixed inset-0 ${zIndex} flex ${placementClass} bg-stone-900/25 px-4 backdrop-blur-[2px]`}
      onClick={onClose}
    >
      <div
        className={`${panelMotionClass} mx-auto max-h-[calc(100vh-2rem)] w-full max-w-[430px] overflow-y-auto rounded-3xl bg-[#FAF8F3] p-4 shadow-[0_18px_50px_rgba(30,41,59,0.25)] ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-stone-300/80" />

        {(eyebrow || title || onClose) && (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {eyebrow && (
                <p
                  className={`text-sm font-bold uppercase tracking-wide ${eyebrowClass}`}
                >
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2 className="mt-1 line-clamp-2 text-2xl font-bold tracking-tight text-stone-900">
                  {title}
                </h2>
              )}
            </div>

            {onClose && (
              <Pressable
                aria-label="Close"
                className="shrink-0"
                onClick={onClose}
                size="icon"
                variant="icon"
              >
                <X size={22} />
              </Pressable>
            )}
          </div>
        )}

        <div className={className}>{children}</div>
        {footer}
      </div>
    </div>
  )
}

export default BottomSheet
