import {
  Apple,
  ChevronUp,
  Fish,
  Milk,
  MoreVertical,
  Package,
  Snowflake,
} from 'lucide-react'
import { useState } from 'react'

const categoryStyles = {
  green: {
    Icon: Apple,
    iconClass: 'bg-green-50 text-[#5A8D2B]',
    countClass: 'bg-green-50 text-[#5A8D2B]',
  },
  red: {
    Icon: Fish,
    iconClass: 'bg-red-50 text-red-600',
    countClass: 'bg-red-50 text-red-600',
  },
  amber: {
    Icon: Milk,
    iconClass: 'bg-amber-50 text-amber-600',
    countClass: 'bg-amber-50 text-amber-700',
  },
  violet: {
    Icon: Package,
    iconClass: 'bg-violet-50 text-violet-600',
    countClass: 'bg-violet-50 text-violet-600',
  },
  blue: {
    Icon: Snowflake,
    iconClass: 'bg-blue-50 text-blue-600',
    countClass: 'bg-blue-50 text-blue-600',
  },
}

function ShoppingItem({
  checkedItemIds,
  item,
  onRemoveManualItem,
  onToggleItem,
}) {
  const isChecked = checkedItemIds.includes(item.id)

  return (
    <div className="flex items-start gap-3 border-t border-stone-100 px-4 py-3">
      <input
        checked={isChecked}
        className="mt-1 h-5 w-5 rounded border-stone-300 accent-[#5A8D2B]"
        onChange={() => onToggleItem(item.id)}
        type="checkbox"
      />

      <div className="min-w-0 flex-1">
        <p
          className={`font-semibold leading-tight ${
            isChecked ? 'text-stone-400 line-through' : 'text-stone-900'
          }`}
        >
          {item.name}
        </p>
        {item.note && <p className="mt-1 text-sm text-stone-500">{item.note}</p>}
      </div>

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap text-sm font-semibold text-stone-700">
          {item.quantity}
        </span>
        {item.isManual && (
          <button
            className="rounded-full p-1 text-stone-500"
            onClick={() => onRemoveManualItem(item.id)}
            title="Remove manual item"
            type="button"
          >
            <MoreVertical size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

function ShoppingCategory({
  checkedItemIds,
  group,
  onRemoveManualItem,
  onToggleItem,
}) {
  const style = categoryStyles[group.color]
  const Icon = style.Icon
  const [isOpen, setIsOpen] = useState(true)

  return (
    <article className="overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-[0_8px_24px_rgba(30,41,59,0.05)]">
      <button
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${style.iconClass}`}
        >
          <Icon size={22} />
        </span>

        <h2 className="flex-1 text-xl font-bold tracking-tight text-stone-900">
          {group.name}
        </h2>

        <span
          className={`rounded-full px-3 py-1 text-sm font-bold ${style.countClass}`}
        >
          {group.items.length}
        </span>

        <ChevronUp
          size={21}
          className={`text-stone-800 transition ${
            isOpen ? '' : 'rotate-180'
          }`}
        />
      </button>

      {isOpen && (
        <div>
          {group.items.map((item) => (
            <ShoppingItem
              checkedItemIds={checkedItemIds}
              item={item}
              key={item.id}
              onRemoveManualItem={onRemoveManualItem}
              onToggleItem={onToggleItem}
            />
          ))}
        </div>
      )}
    </article>
  )
}

export default ShoppingCategory
