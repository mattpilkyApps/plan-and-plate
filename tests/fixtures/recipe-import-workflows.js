import { sproutsIngredientsPaste, sproutsMethodPaste, sproutsIngredients } from './recipe-corpus/two-tab-layouts.js'

const title = 'Sprouts fried rice with pigs in blankets'
const header = sproutsIngredientsPaste.slice(0, sproutsIngredientsPaste.lastIndexOf('\nIngredients\n'))
const footer = '\nNutrition\n250 kcal\nReviews\nA reader comment.\nRelated recipes\nIngredients\n8 unrelated products\nMethod\nHeat a pan for another recipe.\nNewsletter\nSign up today.'
export const fullIngredientsTab = sproutsIngredientsPaste + footer
export const fullMethodTab = header + '\n' + sproutsMethodPaste + footer
export const labelledMethodTab = header + '\nMethod\n' + sproutsMethodPaste + footer
const notes = sproutsMethodPaste.split('Cook’s tip\n\n')[1]
const complete = { name: title, servings: '2', prepTime: '15 mins', cookTime: '10 mins', totalTime: '25 mins', ingredients: sproutsIngredients, methodCount: 3, methodEndsWith: 'Serve immediately.', notes }
const excluded = ['250 kcal', 'A reader comment.', 'unrelated products', 'another recipe', 'Sign up today.', 'CourseMain meal', 'Please note,']

function workflow(id, clips, expected = complete) {
  return { id, layout: 'owner fragments with synthetic full-tab wrappers', reason: 'Exercise the paste session as well as extraction; independent page footers must retain their own scope.', clips, raw: clips.join('\n\n'), expected, excluded }
}

export const recipeImportWorkflows = [
  workflow('short-ingredients-then-method', [sproutsIngredientsPaste, sproutsMethodPaste]),
  workflow('short-method-then-ingredients', [sproutsMethodPaste, sproutsIngredientsPaste]),
  workflow('full-tabs-ingredients-first', [fullIngredientsTab, fullMethodTab]),
  workflow('full-tabs-method-first', [fullMethodTab, fullIngredientsTab]),
  workflow('labelled-full-method-first', [labelledMethodTab, fullIngredientsTab]),
  workflow('labelled-full-ingredients-first', [fullIngredientsTab, labelledMethodTab]),
  workflow('short-method-then-full-ingredients', [sproutsMethodPaste, fullIngredientsTab]),
  workflow('full-method-then-short-ingredients', [fullMethodTab, sproutsIngredientsPaste]),
  workflow('duplicate-ingredients-paste', [fullIngredientsTab, fullIngredientsTab, fullMethodTab]),
  workflow('duplicate-method-paste', [fullMethodTab, fullMethodTab, fullIngredientsTab]),
  workflow('noise-paste-after-complete-recipe', [sproutsIngredientsPaste, sproutsMethodPaste, 'Advertisement\nDesk lamp £45\nNewsletter\nSign up today.']),
  workflow('method-tab-only', [fullMethodTab], { name: title, servings: '2', ingredients: [], methodCount: 3, methodEndsWith: 'Serve immediately.', notes }),
  workflow('ingredients-tab-only', [fullIngredientsTab], { name: title, servings: '2', ingredients: sproutsIngredients, method: [] }),
  workflow('method-only-then-unlabelled-ingredient-list', [sproutsMethodPaste, sproutsIngredients.join('\n')], { name: '', ingredients: sproutsIngredients, methodCount: 3, methodEndsWith: 'Serve immediately.', notes }),
  workflow('wrapped-preparations-separate-tabs', ['Onion pot\nServes 2\nIngredients\n1 onion\nfinely chopped\n3 stalks lemongrass\nbashed with the back of a knife\nNutrition\n250 kcal', 'Onion pot\nServes 2\nMethod\nHeat a pan and fry the onion.\n\nStir in the lemongrass and simmer for 5 minutes.\nReviews\nA reader comment.'], { name: 'Onion pot', servings: '2', ingredients: ['1 onion, finely chopped', '3 stalks lemongrass, bashed with the back of a knife'], method: ['Heat a pan and fry the onion.', 'Stir in the lemongrass and simmer for 5 minutes.'] }),
  workflow('retail-tail-stays-out-across-pastes', ['Bean pot\nMethod\nHeat the beans in a pan.\nElevated by design Your autumn wardrobe has arrived.\nDesk lamp £45\nTravel clock £30\nCarbon-Neutral Ad', 'Bean pot\nIngredients\n1 tin beans'], { name: 'Bean pot', ingredients: ['1 tin beans'], method: ['Heat the beans in a pan.'] }),
]

// Structural transformations of owner input, not additional publisher recipes.
// Tests for cursor insertion, replacement, editing and form merging live beside
// this corpus; those operations cannot be represented by one flattened string.
