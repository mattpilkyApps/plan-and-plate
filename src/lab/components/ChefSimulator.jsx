import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  Timer,
} from 'lucide-react'
import { compileCookingPlan } from '../../domain/cooking/compiler.js'
import {
  createChefSession,
  chefEvent,
  chefSchedule,
  presentationDeck,
  remainingSeconds,
} from '../../domain/cooking/session.js'
import { taskStartBlockers } from '../../domain/cooking/scheduler.js'
import Dialog from './Dialog.jsx'

const formatTime = (seconds) =>
  seconds === null
    ? 'Not started'
    : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
export default function ChefSimulator({
  card,
  plan,
  session,
  preferences,
  onPreferences,
  onCompile,
  onSession,
  notify,
}) {
  const [clockRunning, setClockRunning] = useState(false)
  const [speed, setSpeed] = useState(60)
  const [clockMode, setClockMode] = useState('virtual')
  const [resetPending, setResetPending] = useState(false)
  const [safetyConfirmed, setSafetyConfirmed] = useState([])
  const wakeLock = useRef(null)
  const [awake, setAwake] = useState(false)
  const deck = plan ? presentationDeck(plan) : []
  const slide = session ? deck[session.presentation.index] : null
  const task = plan?.tasks.find((entry) => entry.taskId === slide?.id)
  const currentState = task ? session.taskStates[task.taskId] : null
  const schedule = plan && session ? chefSchedule(plan, session) : null
  const elapsed = session ? session.clock.now - session.createdAt : 0
  const stale =
    plan &&
    (!card ||
      card.id !== plan.recipeId ||
      card.revision !== plan.recipeRevision ||
      card.recipeCardStatus !== 'VALIDATED')
  function dispatch(type, extra = {}) {
    if (!plan || !session) return
    try {
      onSession(
        chefEvent(plan, session, {
          type,
          at:
            session.clock.mode === 'real'
              ? Math.max(Date.now(), session.clock.now)
              : session.clock.now,
          ...extra,
        }),
      )
    } catch (error) {
      notify(error.message)
    }
  }
  useEffect(() => {
    if (!plan || !session || session.clock.mode === 'real' || !clockRunning)
      return
    const id = setInterval(() => {
      const at =
        session.clock.mode === 'real'
          ? Math.max(Date.now(), session.clock.now)
          : session.clock.now + speed * 1000
      try {
        onSession(chefEvent(plan, session, { type: 'CLOCK', at }))
      } catch (error) {
        notify(error.message)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [plan, session, clockRunning, speed, onSession, notify])
  useEffect(
    () => () => {
      wakeLock.current?.release().catch(() => {})
    },
    [],
  )
  function compile() {
    try {
      const next = compileCookingPlan(card, preferences)
      onCompile(
        next,
        createChefSession(next, {
          now: clockMode === 'real' ? Date.now() : 0,
          clockMode,
          speed,
        }),
      )
      setClockRunning(false)
      setSafetyConfirmed([])
      setResetPending(false)
      notify(
        'Cooking plan compiled from the approved recipe. Source instructions remain in order.',
      )
    } catch (error) {
      notify(error.message)
    }
  }
  async function keepAwake() {
    if (awake) {
      await wakeLock.current?.release()
      setAwake(false)
      return
    }
    if (!navigator.wakeLock) {
      notify('This browser does not support keeping the screen awake.')
      return
    }
    try {
      wakeLock.current = await navigator.wakeLock.request('screen')
      wakeLock.current.addEventListener('release', () => setAwake(false))
      setAwake(true)
    } catch {
      notify(
        'The screen could not be kept awake. Timers still use saved target times.',
      )
    }
  }
  const ready = card?.recipeCardStatus === 'VALIDATED'
  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">One reviewed recipe. A dependable sequence.</p>
          <h1>The kitchen, in motion.</h1>
          <p>
            A real dependency engine with a virtual clock for repeatable
            testing.
          </p>
        </div>
        <button
          className="primary-button"
          disabled={!ready}
          onClick={() => (session ? setResetPending(true) : compile())}
        >
          <RotateCcw size={16} />
          {plan ? 'Compile a new session' : 'Compile cooking plan'}
        </button>
      </div>
      {!ready && (
        <p className="notice warm">
          Approve the recipe in the workspace before creating a cooking plan.
        </p>
      )}
      <section className="chef-setup panel">
        <div className="form-row">
          <label className="field">
            Preparation style
            <select
              value={preferences.preparation}
              onChange={(event) =>
                onPreferences({
                  ...preferences,
                  preparation: event.target.value,
                })
              }
            >
              <option value="everything-first">Prepare everything first</option>
              <option value="smart">Smart timing</option>
              <option value="my-order">My preferred order</option>
            </select>
          </label>
          {preferences.preparation === 'my-order' && (
            <label className="field">
              Preparation order
              <select
                value={preferences.order}
                onChange={(event) =>
                  onPreferences({ ...preferences, order: event.target.value })
                }
              >
                <option value="vegetables-first">Vegetables first</option>
                <option value="meat-first">
                  Meat first · hygiene checks required
                </option>
              </select>
            </label>
          )}
          <label className="field">
            Experience
            <select
              value={preferences.experience}
              onChange={(event) =>
                onPreferences({
                  ...preferences,
                  experience: event.target.value,
                })
              }
            >
              <option value="beginner">Beginner</option>
              <option value="standard">Standard</option>
              <option value="confident">Confident</option>
            </select>
          </label>
          <label className="field">
            New session clock
            <select
              value={clockMode}
              onChange={(event) => setClockMode(event.target.value)}
            >
              <option value="virtual">Virtual simulation</option>
              <option value="real">Real time</option>
            </select>
          </label>
        </div>
        <p className="helper">
          Preferences apply when you compile a new session. Smart Timing
          currently overlaps safe preheating with preparation; uncertain method
          actions retain source order. Generic estimates are adjustable and not
          personalised culinary timings.
        </p>
      </section>
      {plan && session && (
        <>
          {stale && (
            <p className="notice warm">
              This session uses an earlier reviewed recipe snapshot. Finish
              inspecting it or compile the newly approved card to use your
              changes.
            </p>
          )}
          <div className="chef-clock-bar">
            <span className="badge">
              <Timer size={14} />
              {session.clock.mode === 'virtual'
                ? 'VIRTUAL CLOCK'
                : 'REAL CLOCK'}{' '}
              · {formatTime(Math.floor(elapsed / 1000))}
            </span>
            {session.clock.mode === 'virtual' && (
              <>
                <label className="field inline-field">
                  Speed
                  <select
                    aria-label="Simulation speed"
                    value={speed}
                    onChange={(event) => setSpeed(Number(event.target.value))}
                  >
                    {[1, 10, 60, 300].map((value) => (
                      <option key={value} value={value}>
                        {value}×
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="secondary-button"
                  onClick={() => setClockRunning(!clockRunning)}
                >
                  {clockRunning ? <Pause size={16} /> : <Play size={16} />}
                  {clockRunning ? 'Stop virtual clock' : 'Run virtual clock'}
                </button>
                <button
                  className="secondary-button"
                  onClick={() =>
                    dispatch('CLOCK', { at: session.clock.now + 60000 })
                  }
                >
                  Advance 1 min
                </button>
              </>
            )}
            <button className="text-button" onClick={keepAwake}>
              {awake ? 'Release screen lock' : 'Keep screen awake'}
            </button>
          </div>
          <div className="chef-grid">
            <section className="chef-current">
              <div className="chef-progress">
                <span className="eyebrow">
                  {task?.phase || slide?.instruction}
                </span>
                <span>
                  {session.presentation.index + 1} / {deck.length}
                </span>
              </div>
              <span className="badge">
                {task
                  ? currentState.status.replaceAll('-', ' ')
                  : 'Information · autoplay eligible'}
              </span>
              <h2>{slide?.instruction}</h2>
              {task?.heat?.length > 0 && (
                <div className="heat-setting">
                  <Flame size={18} />
                  {task.heat.join(' · ')}
                  <span>from recipe</span>
                </div>
              )}
              {task?.quantities.length > 0 && (
                <div className="chef-quantities">
                  {task.quantities.map((entry) => (
                    <p key={entry.ingredientId}>{entry.rawLine}</p>
                  ))}
                </div>
              )}
              {task && (
                <p className="duration-label">
                  <Clock size={15} />
                  {formatTime(Math.ceil(task.duration.seconds))} ·{' '}
                  {task.duration.status === 'estimate'
                    ? 'Estimated'
                    : task.duration.status === 'source-range'
                      ? 'Upper end of source range'
                      : 'Source duration'}
                  <span>{task.duration.label}</span>
                </p>
              )}
              {task?.safetyFlags.length > 0 && (
                <div className="safety-check">
                  <p>
                    <ShieldCheck size={17} />
                    {task.provenance === 'safety-policy'
                      ? 'Safety policy checkpoint · separate from recipe instructions'
                      : 'Safety checkpoint · check safe handling and the recipe'}
                  </p>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={safetyConfirmed.includes(task.taskId)}
                      onChange={(event) =>
                        setSafetyConfirmed(
                          event.target.checked
                            ? [...safetyConfirmed, task.taskId]
                            : safetyConfirmed.filter(
                                (id) => id !== task.taskId,
                              ),
                        )
                      }
                    />
                    I have checked and completed this safely.
                  </label>
                </div>
              )}
              {task && currentState.status === 'pending' && (
                <>
                  <button
                    className="primary-button full-width"
                    disabled={
                      Boolean(stale) ||
                      taskStartBlockers(plan, session.taskStates, task.taskId)
                        .length > 0 ||
                      session.presentation.paused
                    }
                    onClick={() => dispatch('START', { taskId: task.taskId })}
                  >
                    <Play size={17} />
                    Start this task
                  </button>
                  {taskStartBlockers(plan, session.taskStates, task.taskId)
                    .length > 0 && (
                    <p className="helper blocked-note">
                      Waiting for:{' '}
                      {taskStartBlockers(
                        plan,
                        session.taskStates,
                        task.taskId,
                      ).join(' · ')}
                    </p>
                  )}
                </>
              )}
              {task &&
                ['running', 'paused', 'awaiting-confirmation'].includes(
                  currentState.status,
                ) && (
                  <>
                    <div className="current-countdown">
                      {formatTime(
                        remainingSeconds(currentState, session.clock.now),
                      )}
                      <span>
                        {currentState.status === 'awaiting-confirmation'
                          ? 'Time elapsed · confirm the physical task'
                          : 'Task timer'}
                      </span>
                    </div>
                    <div className="form-row">
                      <button
                        className="secondary-button"
                        onClick={() =>
                          dispatch('EXTEND', {
                            taskId: task.taskId,
                            seconds: 60,
                          })
                        }
                      >
                        <Plus size={15} />1 minute
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() =>
                          dispatch('EXTEND', {
                            taskId: task.taskId,
                            seconds: 180,
                          })
                        }
                      >
                        <Plus size={15} />3 minutes
                      </button>
                    </div>
                    <div className="form-row">
                      <button
                        className="primary-button"
                        disabled={
                          task.safetyFlags.length > 0 &&
                          !safetyConfirmed.includes(task.taskId)
                        }
                        onClick={() =>
                          dispatch('COMPLETE', {
                            taskId: task.taskId,
                            safetyConfirmed: safetyConfirmed.includes(
                              task.taskId,
                            ),
                          })
                        }
                      >
                        <Check size={17} />
                        Done / Next task ready
                      </button>
                      <button
                        className="text-button"
                        onClick={() =>
                          dispatch('DONE_EARLY', {
                            taskId: task.taskId,
                            safetyConfirmed: safetyConfirmed.includes(
                              task.taskId,
                            ),
                          })
                        }
                      >
                        Done early
                      </button>
                    </div>
                    <button
                      className="text-button"
                      onClick={() =>
                        dispatch('RUNNING_BEHIND', { taskId: task.taskId })
                      }
                    >
                      I’m running behind (+3 min)
                    </button>
                  </>
                )}
              {task && currentState.status === 'done' && (
                <p className="notice good">
                  <Check size={17} />
                  Task confirmed complete. Use Next to view the next
                  instruction.
                </p>
              )}
              <div className="presentation-controls">
                <button
                  className="secondary-button"
                  disabled={session.presentation.index === 0}
                  onClick={() => dispatch('PRESENT_PREVIOUS')}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  className="secondary-button"
                  onClick={() =>
                    dispatch(
                      session.presentation.paused
                        ? 'RESUME_SESSION'
                        : 'PAUSE_SESSION',
                    )
                  }
                >
                  {session.presentation.paused ? (
                    <Play size={16} />
                  ) : (
                    <Pause size={16} />
                  )}
                  {session.presentation.paused ? 'Resume' : 'Pause'}
                </button>
                <button
                  className="primary-button"
                  disabled={session.presentation.index === deck.length - 1}
                  onClick={() => dispatch('PRESENT_NEXT')}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
              <label className="checkbox-label autoplay-control">
                <input
                  type="checkbox"
                  checked={session.presentation.autoplay}
                  onChange={(event) =>
                    dispatch('AUTOPLAY', { enabled: event.target.checked })
                  }
                />
                Autoplay information cards
              </label>
              <p className="helper">
                Previous/Next changes the displayed card. Pause holds
                instructions; food timers continue. No countdown confirms
                preparation or doneness.
              </p>
              <p className="upcoming">
                <span>COMING NEXT</span>
                {deck[session.presentation.index + 1]?.instruction ||
                  'End of the plan'}
              </p>
            </section>
            <aside className="timer-dock panel">
              <div className="section-heading">
                <h2>On the go</h2>
                <Timer size={21} />
              </div>
              <p className="eta">
                {Math.ceil((schedule.estimatedEnd - session.clock.now) / 60000)}{' '}
                min<span>estimated remaining · confirmation required</span>
              </p>
              {plan.tasks
                .filter((entry) =>
                  ['running', 'paused', 'awaiting-confirmation'].includes(
                    session.taskStates[entry.taskId].status,
                  ),
                )
                .map((entry) => {
                  const value = session.taskStates[entry.taskId]
                  return (
                    <div className="timer-tile" key={entry.taskId}>
                      <button
                        className="text-button"
                        onClick={() =>
                          dispatch('PRESENT_TASK', { taskId: entry.taskId })
                        }
                      >
                        {entry.instruction}
                      </button>
                      <strong>
                        {formatTime(remainingSeconds(value, session.clock.now))}
                      </strong>
                      <span>{value.status}</span>
                      <div className="form-row">
                        <button
                          className="secondary-button"
                          aria-label={`Add one minute to ${entry.taskId}`}
                          onClick={() =>
                            dispatch('EXTEND', {
                              taskId: entry.taskId,
                              seconds: 60,
                            })
                          }
                        >
                          +1 min
                        </button>
                        <button
                          className="secondary-button"
                          aria-label={`Add three minutes to ${entry.taskId}`}
                          onClick={() =>
                            dispatch('EXTEND', {
                              taskId: entry.taskId,
                              seconds: 180,
                            })
                          }
                        >
                          +3 min
                        </button>
                        <button
                          className="secondary-button"
                          onClick={() =>
                            dispatch(
                              value.status === 'paused'
                                ? 'RESUME_TIMER'
                                : 'PAUSE_TIMER',
                              { taskId: entry.taskId },
                            )
                          }
                        >
                          {value.status === 'paused'
                            ? 'Resume timer'
                            : 'Pause timer'}
                        </button>
                      </div>
                      <p className="helper small">
                        Pausing this countdown does not stop heat or food
                        cooking.
                      </p>
                    </div>
                  )
                })}
              {!plan.tasks.some((entry) =>
                ['running', 'paused', 'awaiting-confirmation'].includes(
                  session.taskStates[entry.taskId].status,
                ),
              ) && (
                <p className="helper">
                  Start a task to put its timer here. Timers keep their own
                  identity when the schedule changes.
                </p>
              )}
              <details>
                <summary>Compiler decisions</summary>
                {plan.diagnostics.map((entry, index) => (
                  <p className="helper" key={index}>
                    {entry.message}
                  </p>
                ))}
              </details>
              <a
                className="source-url"
                href={plan.safetyPolicy.cooking}
                target="_blank"
                rel="noreferrer"
              >
                Reviewed FSA cooking guidance ↗
              </a>
            </aside>
          </div>
          <section className="panel timeline-panel">
            <div className="section-heading">
              <h2>The cooking timeline</h2>
              <span>Source order + explicit dependencies</span>
            </div>
            <p className="helper">
              Stripes show estimated durations. A pending task stays blocked
              until its prerequisites are physically confirmed.
            </p>
            <div className="timeline-list">
              {schedule.timeline.map((row) => {
                const entry = plan.tasks.find(
                  (item) => item.taskId === row.taskId,
                )
                const span = Math.max(
                  1,
                  schedule.estimatedEnd - session.createdAt,
                )
                return (
                  <div className="timeline-row" key={row.taskId}>
                    <button
                      onClick={() =>
                        dispatch('PRESENT_TASK', { taskId: row.taskId })
                      }
                    >
                      <span className="tiny-label">
                        {entry.phase} ·{' '}
                        {session.taskStates[entry.taskId].status}
                      </span>
                      <strong>{entry.instruction}</strong>
                      <small>
                        {entry.active ? 'Active' : 'Passive'} ·{' '}
                        {entry.resources.join(', ') || 'No shared equipment'} ·{' '}
                        {entry.duration.status}
                      </small>
                    </button>
                    <div className="timeline-track">
                      <span
                        className={
                          entry.duration.status === 'estimate'
                            ? 'estimated'
                            : ''
                        }
                        style={{
                          left: `${Math.max(0, ((row.start - session.createdAt) / span) * 100)}%`,
                          width: `${Math.max(1, ((row.end - row.start) / span) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="timeline-time">
                      {Math.round((row.start - session.createdAt) / 60000)}–
                      {Math.round((row.end - session.createdAt) / 60000)}m
                    </span>
                    <details>
                      <summary>Why this order?</summary>
                      <p className="helper">
                        {entry.dependencies.length
                          ? 'Requires: ' + entry.dependencies.join(', ')
                          : 'No recipe prerequisites.'}
                      </p>
                      <p className="helper">
                        Resources: {entry.resources.join(', ') || 'none'}.{' '}
                        {entry.conservative
                          ? 'Uncertain instruction: source order retained.'
                          : ''}
                      </p>
                      <pre className="json-view">
                        {JSON.stringify(row.blockedBy, null, 2)}
                      </pre>
                    </details>
                  </div>
                )
              })}
            </div>
            <details>
              <summary>Replayable session event log</summary>
              <pre className="json-view">
                {JSON.stringify(session.events, null, 2)}
              </pre>
            </details>
          </section>
        </>
      )}
      {!plan && (
        <div className="empty-card">
          <Timer size={34} />
          <h2>A sequence built from evidence.</h2>
          <p>
            Approve a recipe, choose a preparation style and compile it. Timers,
            safety checkpoints and equipment constraints will be real engine
            output.
          </p>
        </div>
      )}
      {resetPending && (
        <Dialog
          title="Start a new simulation?"
          eyebrow="Current session is saved until you replace it"
          onClose={() => setResetPending(false)}
        >
          <p className="helper">
            Compiling uses the latest approved card and selected preferences. It
            replaces the current simulation and its timers. Capture an issue
            first if you need this session for debugging.
          </p>
          <button className="primary-button" onClick={compile}>
            Compile and start a fresh session
          </button>
        </Dialog>
      )}
    </>
  )
}
