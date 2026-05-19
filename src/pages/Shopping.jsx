import {
  CheckCircle2,
  ListChecks,
  MoreHorizontal,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import EmptyState from '../components/EmptyState'
import FloatingActionButton from '../components/FloatingActionButton'
import ShoppingCategory from '../components/ShoppingCategory'
import { recipes as sampleRecipes } from '../data/sampleData'
import {
  createLocalId,
  deleteManualShoppingItem,
  deleteManualShoppingItems,
  getClearedShoppingItemIds,
  getManualShoppingItems,
  getPlannedMeals,
  getRemovedRecipeIds,
  getSavedRecipes,
  saveClearedShoppingItemIds,
  saveManualShoppingItem,
} from '../utils/localStorage'
import { getVisibleRecipes } from '../utils/recipeKeys'
import {
  generateShoppingGroups,
  shoppingCategoryOptions,
} from '../utils/shoppingList'

const initialManualItem = {
  name: '',
  quantity: '',
  unit: '',
  category: 'Fresh Produce',
  note: '',
}

function ShoppingHeader({ onOpenOptions }) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[2.45rem] font-bold leading-none tracking-tight text-stone-900">
          Shopping List
        </h1>
        <p className="mt-2 text-base text-stone-500">
          Generated from your weekly planner
        </p>
      </div>

      <div className="flex gap-3">
        <span className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl bg-[#EAF3DE] text-[#5A8D2B] shadow-sm">
          <ListChecks size={25} />
        </span>
        <button
          aria-label="Shopping options"
          className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl bg-[#F8F2EA] text-stone-600 shadow-sm"
          onClick={onOpenOptions}
          type="button"
        >
          <MoreHorizontal size={27} />
        </button>
      </div>
    </header>
  )
}

function ShoppingOptionsSheet({
  checkedItems,
  manualItemsCount,
  onClearChecked,
  onClearManualItems,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-end bg-stone-900/25 px-4 pb-4">
      <div className="mx-auto w-full max-w-[430px] rounded-3xl bg-[#FAF8F3] p-4 shadow-[0_18px_50px_rgba(30,41,59,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#5A8D2B]">
              Shopping options
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              Manage list
            </h2>
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm"
            onClick={onClose}
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <button
            className="flex h-12 items-center gap-3 rounded-2xl bg-white px-4 text-base font-bold text-[#5A8D2B] shadow-sm disabled:text-stone-300"
            disabled={checkedItems === 0}
            onClick={onClearChecked}
            type="button"
          >
            <CheckCircle2 size={21} />
            Clear checked
          </button>

          <button
            className="flex h-12 items-center gap-3 rounded-2xl bg-white px-4 text-base font-bold text-red-600 shadow-sm disabled:text-stone-300"
            disabled={manualItemsCount === 0}
            onClick={onClearManualItems}
            type="button"
          >
            <Trash2 size={21} />
            Clear manual items
          </button>
        </div>
      </div>
    </div>
  )
}

function ShoppingSummary({ totalItems, checkedItems }) {
  return (
    <section className="mt-7 rounded-3xl border border-stone-100 bg-white p-4 shadow-[0_8px_24px_rgba(30,41,59,0.05)]">
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3DE] text-[#5A8D2B]">
          <ShoppingCart size={28} />
        </span>

        <div className="flex-1">
          <p className="text-sm font-semibold text-stone-500">Weekly shop</p>
          <div className="mt-1 flex items-end gap-2">
            <p className="text-3xl font-bold tracking-tight text-[#5A8D2B]">
              {totalItems} items
            </p>
          </div>
          <p className="mt-1 font-semibold text-stone-500">
            {checkedItems} checked
          </p>
        </div>
      </div>
    </section>
  )
}

function ShoppingActions({ checkedItems, onClearChecked }) {
  return (
    <div className="mt-5 flex items-center justify-end">
      <button
        className="flex h-12 items-center gap-2 rounded-2xl border border-stone-100 bg-white px-4 font-bold text-[#5A8D2B] shadow-sm disabled:text-stone-300"
        disabled={checkedItems === 0}
        onClick={onClearChecked}
        type="button"
      >
        <CheckCircle2 size={20} />
        Clear checked
      </button>
    </div>
  )
}

function TextInput({ label, name, onChange, placeholder, value }) {
  return (
    <label>
      <span className="text-sm font-bold text-stone-700">{label}</span>
      <input
        className="mt-2 h-14 w-full rounded-2xl border border-stone-100 bg-white px-4 text-base font-medium text-stone-800 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[#A8C686] focus:ring-4 focus:ring-[#EAF3DE]"
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        value={value}
      />
    </label>
  )
}

function AddManualItemModal({
  errorMessage,
  item,
  onChange,
  onClose,
  onSave,
}) {
  return (
    <div className="fixed inset-0 z-20 flex items-end bg-stone-900/25 px-4 pb-4">
      <div className="mx-auto w-full max-w-[430px] rounded-3xl bg-[#FAF8F3] p-4 shadow-[0_18px_50px_rgba(30,41,59,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#5A8D2B]">
              Manual item
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
              Add shopping item
            </h2>
          </div>

          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-stone-700 shadow-sm"
            onClick={onClose}
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        {errorMessage && (
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {errorMessage}
          </p>
        )}

        <div className="mt-5 grid gap-4">
          <TextInput
            label="Item name"
            name="name"
            onChange={onChange}
            placeholder="Bananas"
            value={item.name}
          />

          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Quantity"
              name="quantity"
              onChange={onChange}
              placeholder="4"
              value={item.quantity}
            />
            <TextInput
              label="Unit"
              name="unit"
              onChange={onChange}
              placeholder="pieces"
              value={item.unit}
            />
          </div>

          <label>
            <span className="text-sm font-bold text-stone-700">Category</span>
            <select
              className="mt-2 h-14 w-full rounded-2xl border border-stone-100 bg-white px-4 text-base font-bold text-stone-800 shadow-sm outline-none transition focus:border-[#A8C686] focus:ring-4 focus:ring-[#EAF3DE]"
              name="category"
              onChange={onChange}
              value={item.category}
            >
              {shoppingCategoryOptions.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <TextInput
            label="Optional note"
            name="note"
            onChange={onChange}
            placeholder="For packed lunches"
            value={item.note}
          />
        </div>

        <button
          className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#5A8D2B] text-base font-bold text-white shadow-[0_12px_24px_rgba(90,141,43,0.3)]"
          onClick={onSave}
          type="button"
        >
          <Plus size={22} />
          Add Item
        </button>
      </div>
    </div>
  )
}

function Shopping() {
  const [checkedItemIds, setCheckedItemIds] = useState([])
  const [clearedItemIds, setClearedItemIds] = useState(() =>
    getClearedShoppingItemIds(),
  )
  const [manualItems, setManualItems] = useState(() =>
    getManualShoppingItems(),
  )
  const [manualItem, setManualItem] = useState(initialManualItem)
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [plannedMeals] = useState(() => getPlannedMeals())
  const [recipes] = useState(() =>
    getVisibleRecipes(getSavedRecipes(), sampleRecipes, getRemovedRecipeIds()),
  )

  const shoppingGroups = generateShoppingGroups(
    plannedMeals,
    recipes,
    clearedItemIds,
    manualItems,
  )

  const visibleItems = shoppingGroups.flatMap((group) => group.items)
  const visibleItemIds = visibleItems.map((item) => item.id)
  const manualItemIds = manualItems.map((item) => item.id)
  const activeCheckedItemIds = checkedItemIds.filter((itemId) =>
    visibleItemIds.includes(itemId),
  )
  const totalItems = shoppingGroups.reduce(
    (total, group) => total + group.items.length,
    0,
  )
  const checkedItems = activeCheckedItemIds.length

  function toggleShoppingItem(itemId) {
    setCheckedItemIds((currentItemIds) => {
      if (currentItemIds.includes(itemId)) {
        return currentItemIds.filter((currentItemId) => currentItemId !== itemId)
      }

      return [...currentItemIds, itemId]
    })
  }

  function clearCheckedItems() {
    const checkedManualItemIds = activeCheckedItemIds.filter((itemId) =>
      manualItemIds.includes(itemId),
    )
    const checkedGeneratedItemIds = activeCheckedItemIds.filter(
      (itemId) => !manualItemIds.includes(itemId),
    )
    const nextClearedItemIds = [...clearedItemIds, ...checkedGeneratedItemIds]
    const savedClearedItemIds = saveClearedShoppingItemIds(nextClearedItemIds)
    const savedManualItems = deleteManualShoppingItems(checkedManualItemIds)

    setClearedItemIds(savedClearedItemIds)
    setManualItems(savedManualItems)
    setCheckedItemIds([])
  }

  function clearCheckedItemsAndCloseOptions() {
    clearCheckedItems()
    setShowOptionsModal(false)
  }

  function clearManualItems() {
    const savedManualItems = deleteManualShoppingItems(
      manualItems.map((item) => item.id),
    )

    setManualItems(savedManualItems)
    setCheckedItemIds((currentItemIds) =>
      currentItemIds.filter((itemId) => !manualItemIds.includes(itemId)),
    )
    setShowOptionsModal(false)
  }

  function openAddItemModal() {
    setManualItem(initialManualItem)
    setErrorMessage('')
    setShowAddItemModal(true)
  }

  function updateManualItem(event) {
    const { name, value } = event.target

    setManualItem((currentItem) => ({
      ...currentItem,
      [name]: value,
    }))
    setErrorMessage('')
  }

  function saveManualItem() {
    const trimmedName = manualItem.name.trim()

    if (!trimmedName) {
      setErrorMessage('Add an item name first.')
      return
    }

    const itemToSave = {
      id: createLocalId('manual-shopping-item'),
      name: trimmedName,
      quantity: manualItem.quantity.trim(),
      unit: manualItem.unit.trim(),
      category: manualItem.category,
      note: manualItem.note.trim(),
    }
    const savedManualItems = saveManualShoppingItem(itemToSave)

    setManualItems(savedManualItems)
    setManualItem(initialManualItem)
    setShowAddItemModal(false)
  }

  function removeManualItem(itemId) {
    const savedManualItems = deleteManualShoppingItem(itemId)

    setManualItems(savedManualItems)
    setCheckedItemIds((currentItemIds) =>
      currentItemIds.filter((currentItemId) => currentItemId !== itemId),
    )
  }

  return (
    <section className="relative">
      <ShoppingHeader onOpenOptions={() => setShowOptionsModal(true)} />
      <ShoppingSummary totalItems={totalItems} checkedItems={checkedItems} />
      <ShoppingActions
        checkedItems={checkedItems}
        onClearChecked={clearCheckedItems}
      />

      {totalItems === 0 ? (
        <div className="mt-4">
          <EmptyState icon={ShoppingCart} title="No items yet">
            Your shopping list is empty. Add meals to your planner to generate
            ingredients.
          </EmptyState>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {shoppingGroups.map((group) => (
            <ShoppingCategory
              checkedItemIds={activeCheckedItemIds}
              group={group}
              key={group.name}
              onRemoveManualItem={removeManualItem}
              onToggleItem={toggleShoppingItem}
            />
          ))}
        </div>
      )}

      <FloatingActionButton label="Add item" onClick={openAddItemModal} />

      {showAddItemModal && (
        <AddManualItemModal
          errorMessage={errorMessage}
          item={manualItem}
          onChange={updateManualItem}
          onClose={() => setShowAddItemModal(false)}
          onSave={saveManualItem}
        />
      )}

      {showOptionsModal && (
        <ShoppingOptionsSheet
          checkedItems={checkedItems}
          manualItemsCount={manualItems.length}
          onClearChecked={clearCheckedItemsAndCloseOptions}
          onClearManualItems={clearManualItems}
          onClose={() => setShowOptionsModal(false)}
        />
      )}
    </section>
  )
}

export default Shopping
