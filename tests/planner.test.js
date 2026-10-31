import test from 'node:test'
import assert from 'node:assert/strict'
import {
  copyMealsToNextWeek,
  mealsInWeek,
  relocateMeal,
  replaceWeekMeals,
} from '../src/utils/plannerData.js'
import {
  getDisplayDaysForWeek,
  getWeekStartDate,
  formatDateKey,
  reanchorWeek,
} from '../src/utils/plannerWeeks.js'
import {
  getPlannedMealsForWeek,
  savePlannedMealsForWeek,
  savePlannerSettings,
  getPlannerSettings,
} from '../src/utils/localStorage.js'
const base = {
  id: 'one',
  day: 'WED',
  mealSlot: 'dinner',
  recipeId: 'r1',
  recipeName: 'Curry',
  plannedServings: 4,
}
const original = {
  '2026-10-26': [base],
  '2026-11-02': [{ ...base, id: 'two', day: 'MON' }],
}

test('legacy weekday records retain their absolute dates across every week-start day', () => {
  for (const day of ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']) {
    const key = formatDateKey(getWeekStartDate(new Date(2026, 9, 28), day))
    assert.equal(
      mealsInWeek(original, key).find((meal) => meal.id === 'one').dateKey,
      '2026-10-28',
    )
  }
  assert.equal(original['2026-10-26'][0].dateKey, undefined)
})
test('saving an overlapping week preserves records outside its visible dates', () => {
  const records = mealsInWeek(original, '2026-10-28')
  const result = replaceWeekMeals(
    original,
    '2026-10-28',
    records.map((meal) => ({ ...meal, plannedServings: 6 })),
  )
  assert.equal(mealsInWeek(result, '2026-10-26').length, 1)
  assert.equal(mealsInWeek(result, '2026-11-02').length, 1)
  assert.equal(mealsInWeek(result, '2026-10-28').length, 2)
  const removed = replaceWeekMeals(
    result,
    '2026-10-28',
    records.filter((meal) => meal.id !== 'one'),
  )
  assert.equal(mealsInWeek(removed, '2026-10-26').length, 0)
  assert.equal(mealsInWeek(removed, '2026-11-02').length, 1)
})
test('move, swap and duplicate retain individual recipe and serving identities', () => {
  const meals = [
    { ...base, dateKey: '2026-10-28' },
    {
      ...base,
      id: 'two',
      day: 'THU',
      dateKey: '2026-10-29',
      plannedServings: 2,
    },
  ]
  const destination = {
    day: 'THU',
    dateKey: '2026-10-29',
    mealSlot: 'lunch',
    targetId: 'two',
  }
  const moved = relocateMeal(meals, 'one', destination)
  assert.equal(moved[0].mealSlot, 'lunch')
  assert.equal(moved[0].plannedServings, 4)
  const swapped = relocateMeal(meals, 'one', destination, 'swap')
  assert.equal(swapped[1].dateKey, '2026-10-28')
  assert.equal(swapped[1].plannedServings, 2)
  const duplicate = relocateMeal(
    meals,
    'one',
    destination,
    'duplicate',
    'three',
  )
  assert.equal(duplicate.length, 3)
  assert.equal(duplicate[2].id, 'three')
  assert.equal(meals[0].dateKey, '2026-10-28')
})
test('copying shifts actual calendar dates across months, years and DST boundaries', () => {
  const copied = copyMealsToNextWeek(
    [{ ...base, dateKey: '2026-12-30' }],
    () => 'copy',
  )
  assert.equal(copied[0].dateKey, '2027-01-06')
  assert.equal(copied[0].id, 'copy')
  assert.deepEqual(
    getDisplayDaysForWeek('2026-10-26').map((day) => day.dateKey),
    [
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ],
  )
})
function storageMock(seed = {}) {
  const data = new Map(
    Object.entries(seed).map(([key, value]) => [key, JSON.stringify(value)]),
  )
  globalThis.window = {
    localStorage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    },
    dispatchEvent: () => {},
  }
  return data
}
test('old single-week data is anchored before navigating, with original data and backup retained', () => {
  const data = storageMock({
    'plan-and-plate-planned-meals': [base],
    'plan-and-plate-planner-settings': {
      weekStartDay: 'MON',
      selectedWeekStartDate: '2026-10-26',
    },
  })
  assert.equal(getPlannedMealsForWeek('2026-10-26')[0].dateKey, '2026-10-28')
  savePlannerSettings({ selectedWeekStartDate: '2026-11-02' })
  assert.equal(getPlannedMealsForWeek('2026-11-02').length, 0)
  assert.equal(getPlannedMealsForWeek('2026-10-26')[0].dateKey, '2026-10-28')
  assert.ok(data.has('plan-and-plate-planned-meals'))
  assert.ok(data.has('plan-and-plate-plans-before-v2'))
})
test('failed writes preserve saved plans and selected week', () => {
  storageMock({
    'plan-and-plate-planned-meals-by-week': original,
    'plan-and-plate-planner-settings': {
      weekStartDay: 'MON',
      selectedWeekStartDate: '2026-10-26',
    },
  })
  window.localStorage.setItem = () => {
    throw new Error('QuotaExceededError')
  }
  assert.equal(savePlannedMealsForWeek('2026-10-26', []).length, 1)
  savePlannerSettings({ selectedWeekStartDate: '2026-11-02' })
  assert.equal(getPlannerSettings().selectedWeekStartDate, '2026-10-26')
})

test('week-start changes keep a future week in view rather than jumping to the previous week', () => {
  assert.equal(
    reanchorWeek('2026-11-02', 'MON', 'WED', new Date(2026, 9, 31)),
    '2026-11-04',
  )
  assert.equal(
    reanchorWeek('2026-10-26', 'MON', 'WED', new Date(2026, 9, 31)),
    '2026-10-28',
  )
})
