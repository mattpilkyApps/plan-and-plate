import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Edit3,
  Leaf,
  ListChecks,
  MoreHorizontal,
  Plus,
  RotateCcw,
  ShoppingBasket,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import ScreenHeader from '../components/ScreenHeader'
import ShoppingCategory from '../components/ShoppingCategory'
import BottomSheet from '../components/ui/BottomSheet'
import Pressable from '../components/ui/Pressable'
import StatusToast from '../components/ui/StatusToast'
import { recipes as samples } from '../data/sampleData'
import {
  createLocalId,
  deleteManualShoppingItem,
  deleteManualShoppingItems,
  getCheckedShoppingItemIds,
  getClearedShoppingItemIds,
  getManualShoppingItems,
  getPlannedMealsForWeek,
  getPlannerSettings,
  getRemovedRecipeIds,
  getSavedRecipes,
  saveCheckedShoppingItemIds,
  saveClearedShoppingItemIds,
  saveManualShoppingItem,
  updateManualShoppingItem,
} from '../utils/localStorage'
import { getCurrentWeekKey, getDisplayDaysForWeek } from '../utils/plannerWeeks'
import { getVisibleRecipes } from '../utils/recipeKeys'
import {
  generateShoppingGroups,
  getIngredientCategory,
  shoppingCategoryOptions,
} from '../utils/shoppingList'

function ItemSheet({ item, onClose, onSave }) {
  const [draft, setDraft] = useState(
    item || { name: '', quantity: '', unit: '', category: 'Other', note: '' },
  )
  const [error, setError] = useState('')
  function update(event) {
    setDraft((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
    setError('')
  }
  function submit(event) {
    event.preventDefault()
    if (!draft.name.trim()) {
      setError('Add an item name first.')
      return
    }
    if (!onSave({ ...draft, name: draft.name.trim() }))
      setError('Your item couldn’t be saved. Please try again.')
  }
  return (
    <BottomSheet
      title={item ? 'A little adjustment' : 'Anything else for home?'}
      eyebrow={item ? 'Edit shopping item' : 'Add to your shop'}
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={submit}>
        <label className="field">
          Item name
          <input
            autoFocus
            data-autofocus
            name="name"
            placeholder="e.g. Toilet roll, bananas, washing powder"
            maxLength={160}
            value={draft.name}
            onChange={update}
          />
        </label>
        <div className="form-row">
          <label className="field">
            Quantity
            <input
              name="quantity"
              placeholder="1"
              inputMode="decimal"
              value={draft.quantity}
              onChange={update}
            />
          </label>
          <label className="field">
            Unit or pack
            <input
              name="unit"
              placeholder="pack, kg, bottle…"
              value={draft.unit}
              onChange={update}
            />
          </label>
        </div>
        <label className="field">
          Category
          <select name="category" value={draft.category} onChange={update}>
            {shoppingCategoryOptions.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Note, if you need one
          <input
            name="note"
            placeholder="Our usual brand, a bigger pack…"
            value={draft.note}
            onChange={update}
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <Pressable variant="primary" type="submit">
          <Plus size={18} />
          {item ? 'Save changes' : 'Add item'}
        </Pressable>
      </form>
    </BottomSheet>
  )
}
export default function Shopping() {
  const [manual, setManual] = useState(getManualShoppingItems)
  const [checked, setChecked] = useState(getCheckedShoppingItemIds)
  const [cleared, setCleared] = useState(getClearedShoppingItemIds)
  const [quick, setQuick] = useState('')
  const [itemSheet, setItemSheet] = useState(null)
  const [activeItem, setActiveItem] = useState(null)
  const [options, setOptions] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(''), 4500)
    return () => window.clearTimeout(timer)
  }, [message])
  const [filter, setFilter] = useState('all')
  const [context] = useState(() => {
    const settings = getPlannerSettings()
    const week =
      settings.selectedWeekStartDate || getCurrentWeekKey(settings.weekStartDay)
    return {
      week,
      meals: getPlannedMealsForWeek(week),
      recipes: getVisibleRecipes(
        getSavedRecipes(),
        samples,
        getRemovedRecipeIds(),
      ),
    }
  })
  const groups = useMemo(
    () =>
      generateShoppingGroups(context.meals, context.recipes, cleared, manual),
    [context, cleared, manual],
  )
  const items = groups.flatMap((group) => group.items)
  const completed = items.filter((item) => checked.includes(item.id))
  const shownGroups =
    filter === 'remaining'
      ? groups
          .map((group) => ({
            ...group,
            items: group.items.filter((item) => !checked.includes(item.id)),
          }))
          .filter((group) => group.items.length)
      : groups
  const simpleMeals = context.meals.filter(
    (meal) =>
      !context.recipes.some(
        (recipe) => (recipe.id || recipe.name) === meal.recipeId,
      ),
  ).length
  const days = getDisplayDaysForWeek(context.week)
  const range = `${new Date(`${days[0].dateKey}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${new Date(`${days[6].dateKey}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
  function toggle(id) {
    setChecked(
      saveCheckedShoppingItemIds(
        checked.includes(id)
          ? checked.filter((value) => value !== id)
          : [...checked, id],
      ),
    )
  }
  function saveManual(draft) {
    const record = {
      ...draft,
      id: draft.id || createLocalId('manual-shopping-item'),
      quantity: String(draft.quantity || '').trim(),
      unit: String(draft.unit || '').trim(),
      note: (draft.note || '').trim(),
    }
    const saved = draft.id
      ? updateManualShoppingItem(record)
      : saveManualShoppingItem(record)
    if (
      !saved.some(
        (item) =>
          item.id === record.id &&
          item.name === record.name &&
          item.quantity === record.quantity &&
          item.unit === record.unit &&
          item.category === record.category &&
          item.note === record.note,
      )
    )
      return false
    setManual(saved)
    setItemSheet(null)
    setQuick('')
    return true
  }
  function quickAdd(event) {
    event.preventDefault()
    const name = quick.trim()
    if (!name) return
    if (
      saveManual({
        name,
        quantity: '1',
        unit: '',
        category: getIngredientCategory(name),
        note: '',
      })
    )
      setMessage(`${name} added to your shop.`)
  }
  function remove(item) {
    if (item.isManual) {
      const result = deleteManualShoppingItem(item.id)
      if (result.some((record) => record.id === item.id)) return
      setManual(result)
    } else {
      const result = saveClearedShoppingItemIds([
        ...new Set([...cleared, ...item.sourceIds]),
      ])
      if (!item.sourceIds.every((id) => result.includes(id))) return
      setCleared(result)
    }
    setChecked(
      saveCheckedShoppingItemIds(checked.filter((id) => id !== item.id)),
    )
    setActiveItem(null)
  }
  function clearCompleted() {
    const generated = completed
      .filter((item) => !item.isManual)
      .flatMap((item) => item.sourceIds)
    const ids = completed.filter((item) => item.isManual).map((item) => item.id)
    const nextCleared = saveClearedShoppingItemIds([
      ...new Set([...cleared, ...generated]),
    ])
    if (!generated.every((id) => nextCleared.includes(id))) return
    const nextManual = deleteManualShoppingItems(ids)
    setCleared(nextCleared)
    setManual(nextManual)
    const remainingIds = ids.filter((id) =>
      nextManual.some((item) => item.id === id),
    )
    setChecked(
      saveCheckedShoppingItemIds(
        checked.filter(
          (id) =>
            !completed.some((item) => item.id === id) ||
            remainingIds.includes(id),
        ),
      ),
    )
    setOptions(false)
    setMessage('Completed items cleared. Nicely done.')
  }
  return (
    <section className="shopping-page">
      <ScreenHeader
        eyebrow="The whole household shop"
        title="A little list. All sorted."
        subtitle="Your meals. Your essentials. One list."
        actions={
          <button
            className="icon-button"
            aria-label="Shopping options"
            onClick={() => setOptions(true)}
          >
            <MoreHorizontal size={22} />
          </button>
        }
      />
      <div className="shopping-status">
        <div className="shop-status-top">
          <span>
            <ShoppingBasket size={17} />
            {range}
          </span>
          <strong>
            {completed.length}
            <small> / {items.length} in your basket</small>
          </strong>
        </div>
        <div
          className="shop-progress"
          role="progressbar"
          aria-label="Shopping progress"
          aria-valuenow={completed.length}
          aria-valuemin={0}
          aria-valuemax={items.length || 1}
        >
          <span
            style={{
              width: `${items.length ? (completed.length / items.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
      <form className="quick-item" onSubmit={quickAdd}>
        <Plus size={19} />
        <input
          aria-label="Quick add shopping item"
          value={quick}
          onChange={(event) => setQuick(event.target.value)}
          placeholder="Milk, washing powder, toilet roll…"
          maxLength={160}
        />
        <button
          type="submit"
          aria-label="Add shopping item"
          disabled={!quick.trim()}
        >
          <ArrowRight size={19} />
        </button>
      </form>
      <div className="shopping-tools">
        <button className="inline-link" onClick={() => setItemSheet({})}>
          <Plus size={14} />
          Add with details
        </button>
        <button
          className="inline-link"
          disabled={!completed.length}
          onClick={clearCompleted}
        >
          <Check size={14} />
          Clear completed{completed.length ? ` (${completed.length})` : ''}
        </button>
      </div>
      {simpleMeals > 0 && (
        <div className="simple-meal-note">
          <Edit3 size={15} />
          <p>
            {simpleMeals} simple{' '}
            {simpleMeals === 1 ? 'meal needs' : 'meals need'} shopping items
            added by hand.
          </p>
          <Link to="/planner">View plan</Link>
        </div>
      )}
      {items.length > 0 && (
        <div className="shopping-filter">
          <h2>Your aisles</h2>
          <button
            className="inline-link"
            onClick={() => setFilter(filter === 'all' ? 'remaining' : 'all')}
          >
            {filter === 'all' ? 'Show remaining' : 'Show all'}
            <ChevronDown size={13} />
          </button>
        </div>
      )}
      <div className="shopping-groups">
        {shownGroups.map((group) => (
          <ShoppingCategory
            key={group.name}
            group={group}
            checkedItemIds={checked}
            onToggleItem={toggle}
            onOpenItem={setActiveItem}
          />
        ))}
      </div>
      {items.length === 0 && (
        <div className="shopping-empty">
          <span>
            <ShoppingBasket size={34} strokeWidth={1.2} />
          </span>
          <h2>A fresh start for your shop</h2>
          <p>
            Add the everyday things your household needs, or plan a recipe and
            its ingredients will appear here.
          </p>
          <Pressable to="/planner" variant="secondary">
            <CalendarIcon />
            Plan something good
          </Pressable>
        </div>
      )}
      {items.length > 0 && shownGroups.length === 0 && (
        <div className="shopping-empty">
          <Check size={32} />
          <h2>That’s everything.</h2>
          <p>All the items on your list are in your basket.</p>
          <Pressable onClick={clearCompleted} variant="secondary">
            Clear completed
          </Pressable>
        </div>
      )}
      <div className="shop-footnote">
        <Leaf size={15} />
        <p>One list for food, family and home.</p>
      </div>
      {itemSheet && (
        <ItemSheet
          item={itemSheet.id ? itemSheet : undefined}
          onClose={() => setItemSheet(null)}
          onSave={saveManual}
        />
      )}
      {activeItem && (
        <BottomSheet
          title={activeItem.name}
          eyebrow={activeItem.isManual ? 'Added by you' : 'From your meal plan'}
          onClose={() => setActiveItem(null)}
        >
          <div className="form-stack">
            {!activeItem.isManual && (
              <p className="helper">
                {activeItem.sources?.join(' · ')}
                <br />
                Change the recipe or its planned servings to update this
                quantity.
              </p>
            )}
            {activeItem.rawText && (
              <p className="helper">
                Original ingredients: {activeItem.rawText}
              </p>
            )}
            <div className="menu-list">
              {activeItem.isManual && (
                <Pressable
                  onClick={() => {
                    setItemSheet(
                      manual.find((item) => item.id === activeItem.id),
                    )
                    setActiveItem(null)
                  }}
                >
                  <Edit3 size={18} />
                  Edit quantity, category or note
                </Pressable>
              )}
              <Pressable variant="danger" onClick={() => remove(activeItem)}>
                <Trash2 size={18} />
                Remove from this list
              </Pressable>
            </div>
          </div>
        </BottomSheet>
      )}
      {options && (
        <BottomSheet
          title="Keep your list tidy"
          eyebrow="Shopping options"
          onClose={() => setOptions(false)}
        >
          <div className="menu-list">
            <Pressable disabled={!completed.length} onClick={clearCompleted}>
              <ListChecks size={18} />
              Clear completed items
            </Pressable>
            <Pressable
              disabled={!cleared.length}
              onClick={() => {
                setCleared(saveClearedShoppingItemIds([]))
                setOptions(false)
              }}
            >
              <RotateCcw size={18} />
              Restore removed recipe ingredients
            </Pressable>
            <Pressable
              variant="danger"
              disabled={!manual.length}
              onClick={() => {
                setOptions(false)
                setConfirmClear(true)
              }}
            >
              <Trash2 size={18} />
              Remove all manual items
            </Pressable>
          </div>
        </BottomSheet>
      )}
      {confirmClear && (
        <BottomSheet
          title="Remove your manual items?"
          eyebrow="Shopping list"
          onClose={() => setConfirmClear(false)}
        >
          <p className="helper mb-5">
            This removes {manual.length} items you added by hand. Recipe
            ingredients stay on the list.
          </p>
          <div className="form-row">
            <Pressable onClick={() => setConfirmClear(false)}>
              Keep items
            </Pressable>
            <Pressable
              variant="dangerSolid"
              onClick={() => {
                setManual(
                  deleteManualShoppingItems(manual.map((item) => item.id)),
                )
                setConfirmClear(false)
              }}
            >
              Remove items
            </Pressable>
          </div>
        </BottomSheet>
      )}
      <StatusToast
        show={Boolean(message)}
        message={message}
        actionLabel="Dismiss"
        onAction={() => setMessage('')}
      />
    </section>
  )
}
function CalendarIcon() {
  return <Leaf size={17} />
}
