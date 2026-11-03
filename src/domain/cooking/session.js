import {
  taskStartBlockers,
  topologicalTasks,
  scheduleCookingPlan,
} from './scheduler.js'

export function presentationDeck(plan) {
  const deck = []
  let phase = null
  for (const task of topologicalTasks(plan.tasks)) {
    if (task.phase !== phase) {
      phase = task.phase
      deck.push({
        id: `phase-${task.taskId}`,
        kind: 'information',
        instruction: phase,
        dwellMs: 9000,
      })
    }
    deck.push({
      id: task.taskId,
      kind: 'task',
      instruction: task.instruction,
      dwellMs: Math.max(9000, task.instruction.length * 55),
    })
  }
  return deck
}

export function createChefSession(
  plan,
  { now = 0, clockMode = 'virtual', speed = 1 } = {},
) {
  topologicalTasks(plan.tasks)
  return {
    schemaVersion: 1,
    planId: plan.planId,
    clock: { mode: clockMode, now, speed },
    taskStates: Object.fromEntries(
      plan.tasks.map((task) => [task.taskId, { status: 'pending' }]),
    ),
    durationOverrides: {},
    presentation: { index: 0, shownAt: now, autoplay: false, paused: false },
    events: [],
    createdAt: now,
  }
}

// Every transition takes an explicit timestamp, so sessions can be replayed
// exactly. CLOCK changes timer readiness, never physical completion.
export function chefEvent(plan, previous, event) {
  if (previous.schemaVersion !== 1 || previous.planId !== plan.planId)
    throw new Error('Session belongs to a different recipe revision or plan.')
  if (!Number.isFinite(event.at) || event.at < previous.clock.now)
    throw new Error('Clock events must be finite and monotonic.')
  const session = structuredClone(previous)
  session.clock.now = event.at
  const task = plan.tasks.find((entry) => entry.taskId === event.taskId)
  const state = task ? session.taskStates[task.taskId] : null
  const deck = presentationDeck(plan)
  switch (event.type) {
    case 'CLOCK':
      break
    case 'START': {
      if (!task || state.status !== 'pending')
        throw new Error('Only a pending task can start.')
      if (session.presentation.paused)
        throw new Error('Resume the session before starting a task.')
      const blockers = taskStartBlockers(plan, session.taskStates, task.taskId)
      if (blockers.length) throw new Error(blockers.join('; '))
      const seconds =
        session.durationOverrides[task.taskId] ?? task.duration.seconds
      Object.assign(state, {
        status: 'running',
        startedAt: event.at,
        targetAt: event.at + seconds * 1000,
      })
      break
    }
    case 'EXTEND':
    case 'RUNNING_BEHIND': {
      if (
        !task ||
        !['running', 'paused', 'awaiting-confirmation'].includes(state.status)
      )
        throw new Error('Choose a running task to change its time.')
      const seconds =
        event.seconds ?? (event.type === 'RUNNING_BEHIND' ? 180 : 60)
      if (!Number.isFinite(seconds) || seconds <= 0)
        throw new Error('Extra time must be positive.')
      session.durationOverrides[task.taskId] =
        (session.durationOverrides[task.taskId] ?? task.duration.seconds) +
        seconds
      if (state.status === 'paused') state.remainingMs += seconds * 1000
      else {
        state.targetAt = Math.max(event.at, state.targetAt) + seconds * 1000
        state.status = 'running'
        delete state.timerNotified
      }
      break
    }
    case 'PAUSE_TIMER':
      if (!task || !['running', 'awaiting-confirmation'].includes(state.status))
        throw new Error('Only a running timer can pause.')
      state.remainingMs = Math.max(0, state.targetAt - event.at)
      state.status = 'paused'
      break
    case 'RESUME_TIMER':
      if (!task || state.status !== 'paused')
        throw new Error('Only a paused timer can resume.')
      state.targetAt = event.at + state.remainingMs
      state.status = 'running'
      delete state.remainingMs
      break
    case 'COMPLETE':
    case 'DONE_EARLY':
      if (
        !task ||
        !['running', 'paused', 'awaiting-confirmation'].includes(state.status)
      )
        throw new Error('Start the task before confirming completion.')
      if (task.safetyFlags.length && !event.safetyConfirmed)
        throw new Error('Confirm the safety checkpoint before continuing.')
      state.status = 'done'
      state.completedAt = event.at
      state.safetyConfirmed = Boolean(event.safetyConfirmed)
      break
    case 'PAUSE_SESSION':
      session.presentation.paused = true
      break
    case 'RESUME_SESSION':
      session.presentation.paused = false
      session.presentation.shownAt = event.at
      break
    case 'AUTOPLAY':
      session.presentation.autoplay = Boolean(event.enabled)
      session.presentation.shownAt = event.at
      break
    case 'PRESENT_NEXT':
      session.presentation.index = Math.min(
        deck.length - 1,
        session.presentation.index + 1,
      )
      session.presentation.shownAt = event.at
      break
    case 'PRESENT_PREVIOUS':
      session.presentation.index = Math.max(0, session.presentation.index - 1)
      session.presentation.shownAt = event.at
      break
    case 'PRESENT_TASK': {
      const index = deck.findIndex((slide) => slide.id === event.taskId)
      if (index < 0) throw new Error('Unknown presentation card.')
      session.presentation.index = index
      session.presentation.shownAt = event.at
      break
    }
    default:
      throw new Error(`Unknown Chef event ${event.type}`)
  }
  session.events.push(event)
  for (const [id, value] of Object.entries(session.taskStates)) {
    if (value.status === 'running' && value.targetAt <= event.at) {
      value.status = 'awaiting-confirmation'
      if (!value.timerNotified) {
        session.events.push({
          type: 'TIMER_FINISHED',
          taskId: id,
          at: event.at,
        })
        value.timerNotified = true
      }
    }
  }
  const slide = deck[session.presentation.index]
  if (
    event.type === 'CLOCK' &&
    !session.presentation.paused &&
    session.presentation.autoplay &&
    slide.kind === 'information' &&
    event.at - session.presentation.shownAt >= slide.dwellMs
  ) {
    session.presentation.index = Math.min(
      deck.length - 1,
      session.presentation.index + 1,
    )
    session.presentation.shownAt = event.at
  }
  return session
}

export function replayChefSession(plan, session, events) {
  // Derived TIMER_FINISHED events are emitted again by the preceding event.
  return events
    .filter((event) => event.type !== 'TIMER_FINISHED')
    .reduce((current, event) => chefEvent(plan, current, event), session)
}

export function chefSchedule(plan, session) {
  return scheduleCookingPlan(plan, {
    now: session.clock.now,
    states: session.taskStates,
    durationOverrides: session.durationOverrides,
  })
}

export function remainingSeconds(state, now) {
  return state.status === 'paused'
    ? Math.ceil(state.remainingMs / 1000)
    : state.targetAt === undefined
      ? null
      : Math.max(0, Math.ceil((state.targetAt - now) / 1000))
}
