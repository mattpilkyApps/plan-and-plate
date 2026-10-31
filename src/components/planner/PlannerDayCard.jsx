import { Clock, MoreVertical, Plus, Users, PencilLine } from 'lucide-react'
import RecipeImage from '../RecipeImage'
const labels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }
export default function PlannerDayCard({ day, meals, recipes, view, onAdd, onActions, onView }) {
  const slots = view === 'dinners' ? ['dinner'] : ['breakfast','lunch','dinner']
  return <section className={`planner-day ${day.isToday ? 'planner-today' : ''}`} aria-label={`${day.dayName} ${day.date}`}>
    <div className="day-label"><strong>{day.dayName}</strong><span>{new Date(`${day.dateKey}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>{day.isToday && <i aria-label="Today" />}</div>
    <div className="day-slots">{slots.map((slot) => {
      const items = meals.filter((meal) => meal.dateKey === day.dateKey && meal.mealSlot === slot)
      return <div className={`meal-slot meal-slot-${slot} ${view === 'all' ? 'slot-detailed' : ''}`} key={slot}>
        {view === 'all' && <span className="slot-label">{labels[slot]}</span>}
        {items.map((meal) => {
          const recipe = recipes.find((recipe) => (recipe.id || recipe.name) === meal.recipeId)
          return <div className="planned-meal" key={meal.id}>
            <button className="meal-main" aria-label={recipe ? `View ${meal.recipeName} recipe` : `Edit ${meal.recipeName}`} onClick={() => recipe ? onView(recipe) : onActions(meal)}>
              {recipe ? <RecipeImage recipe={recipe} className="recipe-thumb" /> : <span className="simple-meal-icon"><PencilLine size={21} strokeWidth={1.3} /></span>}
              <span className="meal-copy"><strong>{meal.recipeName}</strong><span className="meal-meta">{recipe ? <><Clock size={11} />{recipe.time || recipe.cookTime || recipe.prepTime || 'Recipe'}<span><Users size={11} />{meal.plannedServings || recipe.servings}</span></> : <><PencilLine size={11} />Simple meal<span><Users size={11} />{meal.plannedServings || 4}</span></>}</span></span>
            </button>
            <button className="meal-more icon-button" aria-label={`Actions for ${meal.recipeName}`} onClick={() => onActions(meal)}><MoreVertical size={18} /></button>
          </div>
        })}
        {items.length === 0 ? <button className="empty-meal" onClick={() => onAdd(day, slot)} aria-label={`Add ${slot} for ${day.dayName} ${day.date}`}><span className="empty-plus"><Plus size={20} strokeWidth={1.5} /></span><span>Add {slot}</span></button>
        : view === 'all' && <button className="add-another" aria-label={`Add another ${slot} for ${day.dayName}`} onClick={() => onAdd(day, slot)}><Plus size={15} /></button>}
      </div>
    })}</div>
  </section>
}
