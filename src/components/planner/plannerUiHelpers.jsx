import { Moon, Sun, Sunrise } from 'lucide-react'

export const weekdayOptions = [
  { key: 'MON', label: 'Monday' },
  { key: 'TUE', label: 'Tuesday' },
  { key: 'WED', label: 'Wednesday' },
  { key: 'THU', label: 'Thursday' },
  { key: 'FRI', label: 'Friday' },
  { key: 'SAT', label: 'Saturday' },
  { key: 'SUN', label: 'Sunday' },
]

export const mealTypes = [
  {
    key: 'breakfast',
    label: 'Breakfast',
    Icon: Sunrise,
    textColor: 'text-amber-500',
    cardColor: 'bg-gradient-to-br from-[#FFF3C8] to-[#FFF8E8]',
  },
  {
    key: 'lunch',
    label: 'Lunch',
    Icon: Sun,
    textColor: 'text-orange-500',
    cardColor: 'bg-gradient-to-br from-[#FFE4C6] to-[#FFF2E4]',
  },
  {
    key: 'dinner',
    label: 'Dinner',
    Icon: Moon,
    textColor: 'text-violet-500',
    cardColor: 'bg-gradient-to-br from-[#E9D8FF] to-[#F3E9FF]',
  },
]

export function getMealItemId(item) {
  return item.plannedMealId || item.starterMealId
}

export function getQueueRecipe(queueItem, recipes) {
  return recipes.find(
    (recipe) => (recipe.id || recipe.name) === queueItem.recipeId,
  )
}

export function getQueueDisplay(queueItem, recipes) {
  const recipe = getQueueRecipe(queueItem, recipes)

  return {
    image: recipe?.image || queueItem.image,
    icon: recipe?.icon || queueItem.icon || '\uD83C\uDF7D\uFE0F',
    name: recipe?.name || queueItem.recipeName || 'Recipe',
    servings: queueItem.plannedServings || recipe?.servings || 1,
  }
}
