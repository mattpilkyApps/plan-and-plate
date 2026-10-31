import { useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarPlus } from 'lucide-react'
import BottomSheet from './ui/BottomSheet'
import Pressable from './ui/Pressable'
import { createLocalId, getPlannerSettings, markRecipeUsed, savePlannedMeal, savePlannerSettings } from '../utils/localStorage'
import { getCurrentWeekKey, getDisplayDaysForWeek, shiftWeekKey } from '../utils/plannerWeeks'

export default function AddToPlannerModal({ recipe, initialServings, onClose, onSaved }) {
  const [week, setWeek] = useState(() => { const settings = getPlannerSettings(); return settings.selectedWeekStartDate || getCurrentWeekKey(settings.weekStartDay) })
  const days = getDisplayDaysForWeek(week)
  const [day, setDay] = useState(days[0].weekday)
  const [slot, setSlot] = useState(['Breakfast','Lunch'].includes(recipe.mealType) ? recipe.mealType.toLowerCase() : 'dinner')
  const [servings, setServings] = useState(initialServings || recipe.servings || 4)
  const [error, setError] = useState('')
  function save(event) {
    event.preventDefault()
    if (Number(servings) < 1 || Number(servings) > 100) return
    const date = days.find((date) => date.weekday === day) || days[0]
    const meal = { id: createLocalId('planned-meal'), day: date.weekday, dateKey: date.dateKey, mealSlot: slot, recipeName: recipe.name, recipeId: recipe.id || recipe.name, image: recipe.image || '', icon: recipe.icon || '', plannedServings: Number(servings) }
    const result = savePlannedMeal(meal, week)
    if (!result.some((saved) => saved.id === meal.id)) { setError('Your meal couldn’t be saved. Please try again.'); return }
    markRecipeUsed(meal.recipeId)
    savePlannerSettings({ selectedWeekStartDate: week })
    onSaved?.(`${recipe.name} planned for ${date.dayName} ${date.date}.`)
  }
  return <BottomSheet title="Make it a date" eyebrow={recipe.name} onClose={onClose}><form className="form-stack" onSubmit={save}>
    <div className="plan-sheet-week"><button type="button" className="icon-button" aria-label="Previous planning week" onClick={() => setWeek(shiftWeekKey(week,-1))}><ArrowLeft size={18} /></button><span>{new Date(`${days[0].dateKey}T12:00:00`).toLocaleDateString('en-GB',{day:'numeric',month:'short'})} – {new Date(`${days[6].dateKey}T12:00:00`).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span><button type="button" className="icon-button" aria-label="Next planning week" onClick={() => setWeek(shiftWeekKey(week,1))}><ArrowRight size={18} /></button></div>
    <label className="field">Day<select value={day} onChange={(event) => setDay(event.target.value)}>{days.map((day) => <option key={day.dateKey} value={day.weekday}>{new Date(`${day.dateKey}T12:00:00`).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'short'})}</option>)}</select></label>
    <div className="form-row"><label className="field">Meal<select value={slot} onChange={(event) => setSlot(event.target.value)}><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option></select></label><label className="field">Servings<input type="number" min="1" max="100" required value={servings} onChange={(event) => setServings(event.target.value)} /></label></div>
    <p className="helper">Your ingredients join the shopping list for this week. Any meal already in this slot stays in the plan.</p>
    {error && <p className="error" role="alert">{error}</p>}<Pressable variant="primary" type="submit"><CalendarPlus size={18} />Add to planner</Pressable>
  </form></BottomSheet>
}
