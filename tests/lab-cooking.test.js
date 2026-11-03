import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createRecipeCard,
  approveRecipeCard,
} from '../src/domain/recipe/card.js'
import {
  compileCookingPlan,
  extractTaskDuration,
} from '../src/domain/cooking/compiler.js'
import {
  scheduleCookingPlan,
  topologicalTasks,
  taskStartBlockers,
} from '../src/domain/cooking/scheduler.js'
import {
  createChefSession,
  chefEvent,
  remainingSeconds,
  replayChefSession,
  chefSchedule,
} from '../src/domain/cooking/session.js'

const approved = (text) => approveRecipeCard(createRecipeCard([text]))
const duration = (seconds) => ({
  seconds,
  status: 'source',
  label: 'test source duration',
})
const task = (id, seconds, dependencies = [], resources = ['person']) => ({
  taskId: id,
  originalOrder: Number(id.replace(/\D/g, '')) || 0,
  phase: 'Cooking',
  instruction: id,
  duration: duration(seconds),
  dependencies,
  resources,
  equipment: [],
  safetyFlags: [],
  requiresConfirmation: true,
})
const makePlan = (tasks) => ({
  planId: 'synthetic-test-plan',
  tasks,
  resourceCapacities: { person: 1, oven: 1, pan: 1 },
})
const concurrent = makePlan([
  task('t1', 120, [], ['oven']),
  task('t2', 300, [], ['pan']),
  task('t3', 60, ['t1'], ['person']),
])
const event = (plan, session, type, at, extra = {}) =>
  chefEvent(plan, session, { type, at, ...extra })

test('Chef compiler rejects unapproved/incomplete recipes', () => {
  assert.throws(
    () =>
      compileCookingPlan(createRecipeCard(['Title\nIngredients\n1 carrot'])),
    /Approve/,
  )
})

test('Chef default prepares source-supported ingredient notes before cooking', () => {
  const plan = compileCookingPlan(
    approved(
      'Onions\nServes 2\nIngredients\n2 onions, finely chopped\n1 tbsp oil\nMethod\nHeat the oil in a pan. Add the onions and fry for 5 minutes. Serve.',
    ),
  )
  const prep = plan.tasks.find((item) => item.actionType === 'preparation')
  assert.ok(prep.instruction.includes('finely chopped'))
  assert.equal(prep.duration.status, 'estimate')
  assert.ok(
    plan.tasks
      .find((item) => item.provenance === 'recipe-step')
      .dependencies.includes(prep.taskId),
  )
  assert.equal(scheduleCookingPlan(plan).valid, true)
})

test('Chef smart preheat overlaps preparation but baking still depends on preheat', () => {
  const recipe = approved(
    'Carrots\nServes 2\nIngredients\n2 carrots, peeled\nMethod\nPreheat the oven to 180°C. Roast the carrots for 20 minutes. Serve.',
  )
  const normal = compileCookingPlan(recipe)
  const smart = compileCookingPlan(recipe, { preparation: 'smart' })
  const preheat = smart.tasks.find((item) => item.actionType === 'preheat')
  const roast = smart.tasks.find((item) => /Roast/.test(item.instruction))
  assert.ok(roast.dependencies.includes(preheat.taskId))
  assert.ok(
    scheduleCookingPlan(smart).estimatedEnd <
      scheduleCookingPlan(normal).estimatedEnd,
  )
})

test('Chef meat-first inserts cleaning and doneness checkpoints before serving', () => {
  const recipe = approved(
    'Chicken supper\nServes 2\nIngredients\n300g chicken, diced\n2 carrots, sliced\nMethod\nFry the chicken in a pan for 15 minutes. Add the carrots and cook for 5 minutes. Serve.',
  )
  const plan = compileCookingPlan(recipe, {
    preparation: 'my-order',
    order: 'meat-first',
  })
  const ordered = topologicalTasks(plan.tasks)
  assert.ok(ordered[0].instruction.includes('chicken'))
  assert.equal(ordered[1].actionType, 'safety-check')
  const check = plan.tasks.find((item) => item.taskId === 'safety-doneness')
  const serve = plan.tasks.find((item) => item.instruction === 'Serve.')
  assert.ok(serve.dependencies.includes(check.taskId))
  assert.equal(check.provenance, 'safety-policy')
})

test('Chef final cooking instruction precedes doneness check when there is no serve step', () => {
  const plan = compileCookingPlan(
    approved(
      'Chicken\nServes 2\nIngredients\n300g chicken\nMethod\nRoast the chicken for 30 minutes.',
    ),
  )
  const check = plan.tasks.find((item) => item.taskId === 'safety-doneness')
  assert.ok(
    check.dependencies.includes(
      plan.tasks.find((item) => /Roast/.test(item.instruction)).taskId,
    ),
  )
})

test('Chef explicit raw-food preparation is followed by a hygiene dependency', () => {
  const plan = compileCookingPlan(
    approved(
      'Chicken\nServes 2\nIngredients\n300g chicken\n2 carrots\nMethod\nDice the chicken. Chop the carrots. Fry everything for 15 minutes. Serve.',
    ),
  )
  const dice = plan.tasks.find(
    (item) => item.instruction === 'Dice the chicken.',
  )
  const chop = plan.tasks.find(
    (item) => item.instruction === 'Chop the carrots.',
  )
  assert.ok(chop.dependencies.includes('clean-' + dice.taskId))
  assert.ok(dice.safetyFlags.includes('raw-food-handling'))
})

test('Chef includes cutting preparation specified on an ingredient line', () => {
  const plan = compileCookingPlan(
    approved(
      'Paneer\nServes 2\nIngredients\n200g paneer, cut into 1cm cubes\nMethod\nFry the paneer in a pan for 5 minutes.',
    ),
  )
  assert.ok(
    plan.tasks.some(
      (task) =>
        task.phase === 'Preparation' &&
        task.instruction.includes('cut into 1cm cubes'),
    ),
  )
})

test('Chef timing provenance distinguishes source, source range, word durations and estimates', () => {
  assert.equal(extractTaskDuration('Cook for five minutes').seconds, 300)
  assert.equal(extractTaskDuration('Cook for another minute').seconds, 60)
  assert.equal(extractTaskDuration('Roast for 20-25 mins').seconds, 1500)
  assert.equal(
    extractTaskDuration('Roast for 20-25 mins').status,
    'source-range',
  )
  assert.equal(extractTaskDuration('Chop onions').status, 'estimate')
  assert.equal(extractTaskDuration('Bake at 180°C').status, 'estimate')
  assert.ok(
    extractTaskDuration('chop', 'beginner').seconds >
      extractTaskDuration('chop', 'confident').seconds,
  )
})

test('Chef scheduler enforces DAG and equipment resources', () => {
  const plan = makePlan([
    task('t1', 120, [], ['pan']),
    task('t2', 60, [], ['pan']),
    task('t3', 30, ['t2']),
  ])
  const result = scheduleCookingPlan(plan)
  assert.equal(result.timeline.find((row) => row.taskId === 't2').start, 120000)
  assert.equal(result.timeline.find((row) => row.taskId === 't3').start, 180000)
  assert.equal(
    scheduleCookingPlan(concurrent).timeline.find((row) => row.taskId === 't2')
      .start,
    0,
  )
})

test('Chef cycles and missing prerequisites are surfaced with inspection-only original fallback', () => {
  const cyclic = makePlan([task('t1', 10, ['t2']), task('t2', 10, ['t1'])])
  assert.throws(() => createChefSession(cyclic), /cycle/)
  const result = scheduleCookingPlan(cyclic)
  assert.equal(result.valid, false)
  assert.equal(result.fallback, 'original-sequence')
  assert.equal(
    scheduleCookingPlan(makePlan([task('t1', 10, ['absent'])])).valid,
    false,
  )
})

test('Chef +3 minutes shifts descendants without touching unrelated running timer', () => {
  let session = createChefSession(concurrent)
  session = event(concurrent, session, 'START', 0, { taskId: 't1' })
  session = event(concurrent, session, 'START', 0, { taskId: 't2' })
  const target = session.taskStates.t2.targetAt
  const before = chefSchedule(concurrent, session)
  session = event(concurrent, session, 'EXTEND', 10000, {
    taskId: 't1',
    seconds: 180,
  })
  const after = chefSchedule(concurrent, session)
  assert.equal(session.taskStates.t2.targetAt, target)
  assert.equal(
    after.timeline.find((row) => row.taskId === 't3').start -
      before.timeline.find((row) => row.taskId === 't3').start,
    180000,
  )
  assert.equal(session.taskStates.t1.targetAt, 300000)
})

test('Chef expired timer never completes physical task or unlocks prerequisite', () => {
  let session = event(concurrent, createChefSession(concurrent), 'START', 0, {
    taskId: 't1',
  })
  session = event(concurrent, session, 'CLOCK', 150000)
  assert.equal(session.taskStates.t1.status, 'awaiting-confirmation')
  assert.ok(taskStartBlockers(concurrent, session.taskStates, 't3').length)
  assert.throws(
    () => event(concurrent, session, 'START', 150000, { taskId: 't3' }),
    /Finish/,
  )
  assert.equal(remainingSeconds(session.taskStates.t1, 150000), 0)
})

test('Chef done early reschedules dependents and preserves independent running timer', () => {
  let session = createChefSession(concurrent)
  session = event(concurrent, session, 'START', 0, { taskId: 't1' })
  session = event(concurrent, session, 'START', 0, { taskId: 't2' })
  session = event(concurrent, session, 'DONE_EARLY', 10000, { taskId: 't1' })
  assert.equal(
    chefSchedule(concurrent, session).timeline.find(
      (row) => row.taskId === 't3',
    ).start,
    10000,
  )
  assert.equal(session.taskStates.t2.targetAt, 300000)
})

test('Chef per-timer pause/resume uses absolute timestamps and session hold leaves food timers running', () => {
  let session = event(concurrent, createChefSession(concurrent), 'START', 0, {
    taskId: 't1',
  })
  session = event(concurrent, session, 'PAUSE_TIMER', 20000, { taskId: 't1' })
  assert.equal(session.taskStates.t1.remainingMs, 100000)
  session = event(concurrent, session, 'RESUME_TIMER', 80000, { taskId: 't1' })
  assert.equal(session.taskStates.t1.targetAt, 180000)
  session = event(concurrent, session, 'PAUSE_SESSION', 90000)
  session = event(concurrent, session, 'CLOCK', 200000)
  assert.equal(session.taskStates.t1.status, 'awaiting-confirmation')
})

test('Chef safety checks require explicit confirmation even after a countdown', () => {
  const plan = makePlan([
    { ...task('t1', 10), safetyFlags: ['safe-doneness-check'] },
  ])
  let session = event(plan, createChefSession(plan), 'START', 0, {
    taskId: 't1',
  })
  session = event(plan, session, 'CLOCK', 20000)
  assert.throws(
    () => event(plan, session, 'COMPLETE', 20000, { taskId: 't1' }),
    /Confirm/,
  )
  session = event(plan, session, 'COMPLETE', 20000, {
    taskId: 't1',
    safetyConfirmed: true,
  })
  assert.equal(session.taskStates.t1.status, 'done')
})

test('Chef autoplay and previous/next only change presentation', () => {
  let session = event(
    concurrent,
    createChefSession(concurrent),
    'AUTOPLAY',
    0,
    { enabled: true },
  )
  session = event(concurrent, session, 'CLOCK', 10000)
  assert.equal(session.presentation.index, 1)
  session = event(concurrent, session, 'CLOCK', 100000)
  assert.equal(session.presentation.index, 1)
  session = event(concurrent, session, 'PRESENT_NEXT', 100000)
  assert.equal(session.taskStates.t1.status, 'pending')
  assert.equal(session.taskStates.t2.status, 'pending')
})

test('Chef interrupted sessions and event replay are deterministic', () => {
  const initial = createChefSession(concurrent, {
    now: 1000,
    clockMode: 'real',
  })
  let session = event(concurrent, initial, 'START', 1000, { taskId: 't1' })
  session = event(
    concurrent,
    JSON.parse(JSON.stringify(session)),
    'CLOCK',
    200000,
  )
  const replayed = replayChefSession(concurrent, initial, session.events)
  assert.deepEqual(session, replayed)
  assert.equal(session.taskStates.t1.status, 'awaiting-confirmation')
})

test('Chef invalid clocks and mismatched recipe revisions are rejected', () => {
  const session = createChefSession(concurrent, { now: 1000 })
  assert.throws(() => event(concurrent, session, 'CLOCK', 0), /monotonic/)
  assert.throws(
    () => event({ ...concurrent, planId: 'changed' }, session, 'CLOCK', 1000),
    /different recipe/,
  )
})
