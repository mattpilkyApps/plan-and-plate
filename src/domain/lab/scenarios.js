import { createRecipeCard, approveRecipeCard } from '../recipe/card.js'
import {
  createChefSession,
  chefEvent,
  chefSchedule,
  replayChefSession,
} from '../cooking/session.js'
import { scheduleCookingPlan } from '../cooking/scheduler.js'
import { generateCanonicalShopping } from '../shopping/adapter.js'

// Synthetic, reviewed engine contracts, shared by the browser and Node runner.
// These are test tasks, not claims about a copied publisher recipe.
const task = (
  taskId,
  seconds,
  dependencies,
  resources,
  order,
  safetyFlags = [],
) => ({
  taskId,
  instruction: taskId,
  duration: { seconds, status: 'source', label: 'Synthetic fixture duration' },
  dependencies,
  resources,
  equipment: resources,
  originalOrder: order,
  phase: 'Cooking',
  safetyFlags,
  requiresConfirmation: true,
})
const parallel = {
  planId: 'fixture-parallel',
  resourceCapacities: { oven: 1, pan: 1, person: 1 },
  tasks: [
    task('oven', 120, [], ['oven'], 0),
    task('pan', 300, [], ['pan'], 1),
    task('finish', 60, ['oven'], ['person'], 2),
  ],
}
const startBoth = [
  { type: 'START', at: 0, taskId: 'oven' },
  { type: 'START', at: 0, taskId: 'pan' },
]
const cookingCase = (id, events, expected, options = {}) => ({
  id,
  kind: 'cooking-simulation',
  layout: 'synthetic deterministic cooking scenario',
  plan: parallel,
  events,
  expected,
  ...options,
})
export const cookingScenarios = [
  cookingCase(
    'chef-normal-confirmed',
    [...startBoth, { type: 'COMPLETE', at: 120000, taskId: 'oven' }],
    { 'session.taskStates.oven.status': 'done', 'starts.finish': 120000 },
  ),
  cookingCase(
    'chef-expiry-needs-confirmation',
    [...startBoth, { type: 'CLOCK', at: 180000 }],
    {
      'session.taskStates.oven.status': 'awaiting-confirmation',
      'session.taskStates.finish.status': 'pending',
    },
  ),
  cookingCase(
    'chef-extend-only-descendants',
    [...startBoth, { type: 'EXTEND', taskId: 'oven', seconds: 180, at: 10000 }],
    {
      'session.taskStates.oven.targetAt': 300000,
      'session.taskStates.pan.targetAt': 300000,
      'starts.finish': 300000,
    },
  ),
  cookingCase(
    'chef-done-early',
    [...startBoth, { type: 'DONE_EARLY', taskId: 'oven', at: 10000 }],
    { 'starts.finish': 10000, 'session.taskStates.pan.targetAt': 300000 },
  ),
  cookingCase(
    'chef-running-behind',
    [...startBoth, { type: 'RUNNING_BEHIND', taskId: 'oven', at: 10000 }],
    {
      'session.taskStates.oven.targetAt': 300000,
      'session.taskStates.pan.targetAt': 300000,
    },
  ),
  cookingCase(
    'chef-pause-one-timer',
    [
      ...startBoth,
      { type: 'PAUSE_TIMER', taskId: 'oven', at: 20000 },
      { type: 'RESUME_TIMER', taskId: 'oven', at: 80000 },
    ],
    {
      'session.taskStates.oven.targetAt': 180000,
      'session.taskStates.pan.targetAt': 300000,
    },
  ),
  cookingCase(
    'chef-hold-is-not-food-pause',
    [
      ...startBoth,
      { type: 'PAUSE_SESSION', at: 10000 },
      { type: 'CLOCK', at: 150000 },
    ],
    {
      'session.presentation.paused': true,
      'session.taskStates.oven.status': 'awaiting-confirmation',
    },
  ),
  cookingCase(
    'chef-presentation-is-not-completion',
    [
      { type: 'AUTOPLAY', enabled: true, at: 0 },
      { type: 'CLOCK', at: 10000 },
      { type: 'PRESENT_NEXT', at: 10000 },
    ],
    {
      'session.taskStates.oven.status': 'pending',
      'session.taskStates.pan.status': 'pending',
    },
  ),
  cookingCase(
    'chef-interrupted-replay',
    [...startBoth, { type: 'CLOCK', at: 400000 }],
    {
      replayMatches: true,
      'session.taskStates.oven.status': 'awaiting-confirmation',
    },
    { verifyReplay: true },
  ),
  cookingCase(
    'chef-prerequisite-blocked',
    [{ type: 'START', taskId: 'finish', at: 0 }],
    {},
    { expectedError: 'Finish oven' },
  ),
  cookingCase(
    'chef-equipment-conflict',
    [
      { type: 'START', taskId: 'first', at: 0 },
      { type: 'START', taskId: 'second', at: 0 },
    ],
    {},
    {
      plan: {
        ...parallel,
        tasks: [
          task('first', 120, [], ['pan'], 0),
          task('second', 60, [], ['pan'], 1),
        ],
      },
      expectedError: 'pan is in use',
    },
  ),
  cookingCase(
    'chef-safety-not-confirmed',
    [
      { type: 'START', taskId: 'check', at: 0 },
      { type: 'CLOCK', at: 120000 },
      { type: 'COMPLETE', taskId: 'check', at: 120000 },
    ],
    {},
    {
      plan: {
        ...parallel,
        tasks: [task('check', 60, [], ['person'], 0, ['safe-doneness-check'])],
      },
      expectedError: 'Confirm the safety checkpoint',
    },
  ),
  cookingCase(
    'chef-cycle-rejected',
    [],
    {},
    {
      plan: {
        ...parallel,
        tasks: [task('a', 60, ['b'], [], 0), task('b', 60, ['a'], [], 1)],
      },
      expectedError: 'cycle',
    },
  ),
]

const shoppingRaw =
  'Bean pot\nServes 2\nIngredients\n100g beans\n1 garlic clove, crushed\n1 lime (optional)\nMethod\nHeat the beans in a pan. Serve with lime.'
export const shoppingScenarios = [
  {
    id: 'shopping-scale-and-household',
    kind: 'shopping-simulation',
    layout: 'synthetic canonical → production shopping contract',
    raw: shoppingRaw,
    plannedServings: 4,
    manualItems: [
      { id: 'manual-test', name: 'Toilet rolls', quantity: '2', unit: 'packs' },
    ],
    expected: {
      'quantities.beans': '200 g',
      'quantities.garlic': '2 cloves',
      'categories.Toilet rolls': 'Toiletries',
      sourceCount: 3,
    },
  },
  {
    id: 'shopping-optional-keeps-evidence',
    kind: 'shopping-simulation',
    layout: 'synthetic optional exclusion contract',
    raw: shoppingRaw,
    options: { includeOptional: false },
    expected: { sourceCount: 2, excludedCount: 1 },
  },
  {
    id: 'shopping-incompatible-units',
    kind: 'shopping-simulation',
    layout: 'synthetic non-conversion contract',
    raw: 'Flour mix\nServes 2\nIngredients\n100g flour\n2 tbsp flour\nMethod\nMix in a bowl.',
    expected: { 'quantities.flour': '100 g + 2 tbsp', sourceCount: 2 },
  },
]
export const engineScenarios = [...cookingScenarios, ...shoppingScenarios]

function path(object, key) {
  return key.split('.').reduce((value, part) => value?.[part], object)
}
export function runEngineScenario(entry) {
  const assertions = []
  let output = null
  let error = null
  try {
    if (entry.kind === 'cooking-simulation') {
      const initial = createChefSession(entry.plan)
      const session = entry.events.reduce(
        (current, event) => chefEvent(entry.plan, current, event),
        initial,
      )
      const schedule = chefSchedule(entry.plan, session)
      output = {
        session,
        schedule,
        starts: Object.fromEntries(
          schedule.timeline.map((row) => [row.taskId, row.start]),
        ),
        replayMatches: entry.verifyReplay
          ? JSON.stringify(
              replayChefSession(entry.plan, initial, session.events),
            ) === JSON.stringify(session)
          : null,
      }
    } else {
      const card = approveRecipeCard(
        createRecipeCard([entry.raw], {
          id: entry.id,
          now: '2026-11-03T00:00:00Z',
        }),
      )
      const shopping = generateCanonicalShopping(
        [
          {
            card,
            plannedServings: entry.plannedServings || card.servings.value,
          },
        ],
        { ...entry.options, manualItems: entry.manualItems || [] },
      )
      const items = shopping.allGroups.flatMap((group) =>
        group.items.map((item) => ({ ...item, category: group.name })),
      )
      output = {
        shopping,
        quantities: Object.fromEntries(
          items.map((item) => [item.name, item.quantity]),
        ),
        categories: Object.fromEntries(
          items.map((item) => [item.name, item.category]),
        ),
        sourceCount: shopping.sourceCount,
        excludedCount: shopping.excluded.length,
      }
    }
  } catch (caught) {
    error = caught.message
  }
  if (entry.expectedError)
    assertions.push({
      field: 'expectedError',
      expected: entry.expectedError,
      actual: error,
      passed: Boolean(error?.includes(entry.expectedError)),
    })
  else {
    assertions.push({
      field: 'runtime',
      expected: null,
      actual: error,
      passed: error === null,
    })
    for (const [field, expected] of Object.entries(entry.expected)) {
      const actual = path(output, field)
      assertions.push({
        field,
        expected,
        actual,
        passed: JSON.stringify(expected) === JSON.stringify(actual),
      })
    }
  }
  if (entry.expectedError === 'cycle')
    assertions.push({
      field: 'safeFallback',
      expected: false,
      actual: scheduleCookingPlan(entry.plan).valid,
      passed: scheduleCookingPlan(entry.plan).valid === false,
    })
  return {
    id: entry.id,
    passed: assertions.every((assertion) => assertion.passed),
    assertions,
    warnings: [],
    card: null,
    output,
  }
}
