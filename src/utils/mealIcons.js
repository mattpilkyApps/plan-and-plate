export function getMealIcon({ mealSlot = '', mealType = '', name = '' }) {
  const text = `${name} ${mealType} ${mealSlot}`.toLowerCase()

  if (text.includes('pancake')) return '🥞'
  if (text.includes('pizza')) return '🍕'
  if (text.includes('taco')) return '🌮'
  if (text.includes('salmon') || text.includes('fish')) return '🐟'
  if (text.includes('bread') || text.includes('toast')) return '🥖'
  if (text.includes('wrap')) return '🌯'
  if (text.includes('sandwich')) return '🥪'
  if (text.includes('egg')) return '🍳'
  if (text.includes('smoothie')) return '🥤'
  if (text.includes('fruit')) return '🍎'
  if (text.includes('spaghetti') || text.includes('pasta')) return '🍝'
  if (text.includes('salad')) return '🥗'
  if (text.includes('curry') || text.includes('soup')) return '🥣'
  if (text.includes('breakfast')) return '🥣'
  if (text.includes('lunch')) return '🥪'
  if (text.includes('dinner')) return '🍽️'

  return '🍽️'
}
