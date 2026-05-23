import { MoreVertical } from 'lucide-react'
import { getQueueDisplay } from './plannerUiHelpers'

function WeeklyQueueSection({
  activeQueueItem,
  items,
  onOpenActions,
  onSelectItem,
  recipes,
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="mt-3 rounded-3xl border border-stone-100 bg-white/80 p-3 shadow-[0_8px_24px_rgba(30,41,59,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-stone-900">Meals This Week</p>
          <p className="text-xs font-semibold text-stone-500">
            Tap a meal, then tap a planner slot.
          </p>
        </div>
        <span className="rounded-full bg-[#EAF3DE] px-3 py-1 text-xs font-bold text-[#5A8D2B]">
          {items.length}
        </span>
      </div>

      <div className="no-scrollbar -mx-3 mt-3 overflow-x-auto px-3 pb-1">
        <div className="flex w-max gap-2.5">
          {items.map((item) => {
            const display = getQueueDisplay(item, recipes)
            const isActive = activeQueueItem?.id === item.id

            return (
              <article
                className={`no-touch-callout relative flex w-40 shrink-0 items-center gap-2 rounded-2xl border bg-[#FAF8F3] p-2 text-left shadow-sm transition active:scale-[0.98] ${
                  isActive
                    ? 'border-[#A8C686] ring-2 ring-[#EAF3DE]'
                    : 'border-stone-100'
                }`}
                key={item.id}
              >
                <button
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => onSelectItem(item)}
                  type="button"
                >
                  {display.image ? (
                    <img
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-xl object-cover"
                      src={display.image}
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg">
                      {display.icon}
                    </span>
                  )}

                  <span className="min-w-0">
                    <span className="line-clamp-2 text-xs font-bold leading-tight text-stone-900">
                      {display.name}
                    </span>
                    <span className="mt-0.5 block text-[0.68rem] font-bold text-[#5A8D2B]">
                      Serves {display.servings}
                    </span>
                  </span>
                </button>

                <button
                  aria-label={`Queue actions for ${display.name}`}
                  className="flex h-8 w-6 shrink-0 items-center justify-center text-stone-500"
                  onClick={() => onOpenActions(item)}
                  type="button"
                >
                  <MoreVertical size={16} />
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default WeeklyQueueSection
