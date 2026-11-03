export function topologicalTasks(tasks) {
  const ids = new Set(tasks.map((task) => task.taskId))
  if (ids.size !== tasks.length) throw new Error('Duplicate cooking task IDs.')
  for (const task of tasks)
    if (task.dependencies.some((dependency) => !ids.has(dependency)))
      throw new Error(`Missing prerequisite for ${task.taskId}.`)
  const ordered = []
  const complete = new Set()
  while (ordered.length < tasks.length) {
    const next = tasks
      .filter(
        (task) =>
          !complete.has(task.taskId) &&
          task.dependencies.every((dependency) => complete.has(dependency)),
      )
      .sort(
        (a, b) =>
          a.originalOrder - b.originalOrder || a.taskId.localeCompare(b.taskId),
      )[0]
    if (!next) throw new Error('Cooking dependency cycle detected.')
    ordered.push(next)
    complete.add(next.taskId)
  }
  return ordered
}

function firstResourceSlot(
  start,
  duration,
  resources,
  reservations,
  capacities,
) {
  let cursor = start
  for (let attempt = 0; attempt < 10000; attempt += 1) {
    let blockedUntil = cursor
    for (const resource of resources) {
      const overlaps = reservations.filter(
        (reservation) =>
          reservation.resource === resource &&
          reservation.end > cursor &&
          reservation.start < cursor + duration,
      )
      const points = [
        ...new Set([
          cursor,
          ...overlaps.map((reservation) => Math.max(cursor, reservation.start)),
        ]),
      ].sort((a, b) => a - b)
      const saturated = points.find(
        (point) =>
          overlaps.filter(
            (reservation) =>
              reservation.start <= point && reservation.end > point,
          ).length >= (capacities[resource] || 1),
      )
      if (saturated !== undefined)
        blockedUntil = Math.max(
          blockedUntil,
          Math.min(
            ...overlaps
              .filter(
                (reservation) =>
                  reservation.start <= saturated && reservation.end > saturated,
              )
              .map((reservation) => reservation.end),
          ),
        )
    }
    if (blockedUntil === cursor) return cursor
    cursor = blockedUntil
  }
  throw new Error('Resource schedule could not converge.')
}

export function scheduleCookingPlan(
  plan,
  { now = 0, states = {}, durationOverrides = {} } = {},
) {
  let ordered
  try {
    ordered = topologicalTasks(plan.tasks)
  } catch (error) {
    let end = now
    return {
      valid: false,
      fallback: 'original-sequence',
      diagnostics: [error.message],
      timeline: plan.tasks.map((task) => {
        const start = end
        end += task.duration.seconds * 1000
        return {
          taskId: task.taskId,
          start,
          end,
          blockedBy: ['Invalid graph; original sequence for inspection only'],
        }
      }),
      estimatedEnd: end,
    }
  }
  const rows = new Map()
  const reservations = []
  // Running timers reserve their original interval before pending tasks are
  // scheduled. Replanning never edits their target timestamps.
  for (const task of ordered) {
    const state = states[task.taskId]
    if (!state || state.status === 'pending') continue
    const end =
      state.status === 'done'
        ? state.completedAt
        : state.status === 'paused'
          ? now + state.remainingMs
          : Math.max(now, state.targetAt)
    const row = {
      taskId: task.taskId,
      start: state.startedAt ?? now,
      end,
      status: state.status,
      blockedBy: [],
    }
    rows.set(task.taskId, row)
    if (state.status !== 'done')
      for (const resource of task.resources)
        reservations.push({ resource, start: row.start, end: row.end })
  }
  for (const task of ordered) {
    if (rows.has(task.taskId)) continue
    const duration =
      (durationOverrides[task.taskId] ?? task.duration.seconds) * 1000
    const dependencyEnd = Math.max(
      now,
      ...task.dependencies.map((id) => rows.get(id).end),
    )
    const start = firstResourceSlot(
      dependencyEnd,
      duration,
      task.resources,
      reservations,
      plan.resourceCapacities || {},
    )
    const blockedBy = task.dependencies.map((id) => ({
      type: 'dependency',
      taskId: id,
      confirmed: states[id]?.status === 'done',
    }))
    if (start > dependencyEnd)
      blockedBy.push({ type: 'resource', resources: task.resources })
    const row = {
      taskId: task.taskId,
      start,
      end: start + duration,
      status: 'pending',
      blockedBy,
    }
    rows.set(task.taskId, row)
    for (const resource of task.resources)
      reservations.push({ resource, start: row.start, end: row.end })
  }
  const timeline = ordered.map((task) => rows.get(task.taskId))
  return {
    valid: true,
    timeline,
    estimatedEnd: Math.max(now, ...timeline.map((row) => row.end)),
    diagnostics: [],
    note: 'ETA assumes tasks are confirmed when ready; elapsed timers never satisfy dependencies.',
  }
}

export function taskStartBlockers(plan, states, taskId) {
  const task = plan.tasks.find((entry) => entry.taskId === taskId)
  if (!task) return ['Unknown task']
  const blockers = task.dependencies
    .filter((id) => states[id]?.status !== 'done')
    .map((id) => `Finish ${id}`)
  for (const resource of task.resources) {
    const inUse = plan.tasks.filter(
      (other) =>
        other.taskId !== taskId &&
        other.resources.includes(resource) &&
        ['running', 'paused', 'awaiting-confirmation'].includes(
          states[other.taskId]?.status,
        ),
    ).length
    if (inUse >= (plan.resourceCapacities[resource] || 1))
      blockers.push(`${resource} is in use`)
  }
  return blockers
}
