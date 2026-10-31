import {
  Apple,
  Beef,
  Milk,
  Croissant,
  Package,
  Snowflake,
  CupSoda,
  SprayCan,
  Sparkles,
  Baby,
  PawPrint,
  Leaf,
  MoreHorizontal,
} from 'lucide-react'
const icons = {
  'Fresh Produce': Apple,
  'Meat & Fish': Beef,
  'Dairy & Eggs': Milk,
  Bakery: Croissant,
  Frozen: Snowflake,
  Drinks: CupSoda,
  'Household Cleaning': SprayCan,
  Toiletries: Sparkles,
  'Baby & Family': Baby,
  'Pet Supplies': PawPrint,
  'Herbs & Spices': Leaf,
}
const displayNames = {
  'Fresh Produce': 'Fruit & vegetables',
  'Pantry / Tins / Dry Goods': 'Cupboard essentials',
  'Household Cleaning': 'Household cleaning',
  'Baby & Family': 'Baby & family',
  'Pet Supplies': 'Pet supplies',
}
export default function ShoppingCategory({
  group,
  checkedItemIds,
  onToggleItem,
  onOpenItem,
}) {
  const Icon = icons[group.name] || Package
  const complete = group.items.filter((item) =>
    checkedItemIds.includes(item.id),
  ).length
  return (
    <section
      className="shopping-category"
      aria-label={displayNames[group.name] || group.name}
    >
      <header>
        <span className="aisle-icon">
          <Icon size={18} strokeWidth={1.6} />
        </span>
        <h2>{displayNames[group.name] || group.name}</h2>
        <span>
          {complete}/{group.items.length}
        </span>
      </header>
      <ul>
        {group.items.map((item) => (
          <li
            key={item.id}
            className={
              checkedItemIds.includes(item.id) ? 'shopping-checked' : ''
            }
          >
            <label>
              <input
                type="checkbox"
                checked={checkedItemIds.includes(item.id)}
                onChange={() => onToggleItem(item.id)}
              />
              <span className="shopping-item-copy">
                <strong>{item.name}</strong>
                {item.note && <small>{item.note}</small>}
              </span>
              {item.quantity && (
                <span className="shopping-quantity">{item.quantity}</span>
              )}
            </label>
            <button
              className="icon-button"
              aria-label={`Options for ${item.name}`}
              onClick={() => onOpenItem(item)}
            >
              <MoreHorizontal size={18} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
