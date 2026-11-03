import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  Beaker,
  BookOpen,
  Bug,
  CheckCheck,
  ChevronRight,
  ClipboardPaste,
  Code2,
  FileSearch,
  FlaskConical,
  Leaf,
  Library,
  Play,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  ChefHat,
  ShoppingBasket,
  Smartphone,
} from 'lucide-react'
import fixtures from './generated/fixtures.json'
import {
  allIngredients,
  createRecipeCard,
  ENGINE_VERSIONS,
} from '../domain/recipe/card.js'
import { runRegressions } from '../domain/lab/regression.js'
import { createRegressionFixture } from '../domain/lab/issues.js'
import { contentHash } from '../domain/recipe/source.js'
import { readLabState, writeLabState } from './storage.js'
import RecipeCard, {
  EvidenceDrawer,
  SourcePanel,
} from './components/RecipeCard.jsx'
import Issues, { IssueReporter } from './components/Issues.jsx'
import RegressionLibrary from './components/RegressionLibrary.jsx'
import Dialog from './components/Dialog.jsx'
const ChefSimulator = lazy(() => import('./components/ChefSimulator.jsx'))
const ShoppingSimulator = lazy(
  () => import('./components/ShoppingSimulator.jsx'),
)
import { compileCookingPlan } from '../domain/cooking/compiler.js'
import { createChefSession, chefEvent } from '../domain/cooking/session.js'
import { generateCanonicalShopping } from '../domain/shopping/adapter.js'

const commit = __LAB_COMMIT__
const nav = [
  { id: 'recipe', label: 'Recipe card', icon: BookOpen },
  { id: 'chef', label: 'Chef mode', icon: ChefHat },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBasket },
  { id: 'library', label: 'Test library', icon: Library },
  { id: 'diagnostics', label: 'Diagnostics', icon: FlaskConical },
  { id: 'issues', label: 'Issues', icon: Bug },
]
const initialState = () =>
  readLabState() || {
    parts: [],
    caseId: 'unsaved',
    card: null,
    runs: [],
    savedCases: [],
    issues: [],
    lastGood: {},
  }

export default function Lab() {
  const [state, setState] = useState(initialState)
  const [tab, setTab] = useState('recipe')
  const [mobilePane, setMobilePane] = useState('preview')
  const [toast, setToast] = useState('')
  const [storageError, setStorageError] = useState(false)
  const [evidence, setEvidence] = useState(null)
  const [reporting, setReporting] = useState(false)
  const [pendingCard, setPendingCard] = useState(null)
  const [results, setResults] = useState(null)
  const [busy, setBusy] = useState(false)
  const [phonePreview, setPhonePreview] = useState(false)
  const [phoneWidth, setPhoneWidth] = useState(390)
  const notify = (message) => setToast(message)
  const patch = (value) => setState((current) => ({ ...current, ...value }))
  const input = state.pendingInput || ''
  const setInput = (pendingInput) => patch({ pendingInput })
  const sourceUrl = state.sourceUrl || ''
  const setSourceUrl = (value) => patch({ sourceUrl: value })
  const card = state.card
  const chefPreferences = state.chefPreferences || {
    preparation: 'everything-first',
    order: 'vegetables-first',
    experience: 'standard',
  }
  const shoppingBasket = useMemo(
    () => state.shoppingBasket || [],
    [state.shoppingBasket],
  )
  const manualItems = useMemo(
    () => state.manualItems || [],
    [state.manualItems],
  )
  const shoppingOptions = useMemo(
    () =>
      state.shoppingOptions || { includeOptional: true, atHomeSourceIds: [] },
    [state.shoppingOptions],
  )
  const shoppingOutput = useMemo(() => {
    try {
      return {
        result: generateCanonicalShopping(shoppingBasket, {
          ...shoppingOptions,
          manualItems,
        }),
      }
    } catch (error) {
      return { error: error.message }
    }
  }, [shoppingBasket, shoppingOptions, manualItems])
  const cases = useMemo(
    () => [...fixtures, ...state.savedCases],
    [state.savedCases],
  )
  const inputHash = contentHash(state.parts.join('\u0000'))
  const changedSource =
    card &&
    inputHash !==
      contentHash(
        card.sourceFragments.map((fragment) => fragment.rawText).join('\u0000'),
      )
  const snapshot = {
    capturedAt: new Date().toISOString(),
    testCaseId: state.caseId,
    commit,
    engineVersions: ENGINE_VERSIONS,
    inputHash,
    sourceFragments: state.parts,
    pendingInput: input,
    card,
    cookingPlan: state.plan,
    timerState: state.chefSession,
    shoppingOutput,
    shoppingBasket,
    manualItems,
    shoppingOptions,
    pipeline: state.pipeline,
    runtimeError: state.runtimeError,
    failedAssertions:
      results?.results
        .filter((result) => result.id === state.caseId)
        .flatMap((result) =>
          result.assertions.filter((assertion) => !assertion.passed),
        ) || [],
    recentRuns: state.runs.slice(0, 3),
  }
  useEffect(() => {
    const ok = writeLabState(state)
    if (!ok)
      queueMicrotask(() =>
        window.dispatchEvent(new Event('lab-storage-failed')),
      )
  }, [state])
  useEffect(() => {
    const show = () => setStorageError(true)
    window.addEventListener('lab-storage-failed', show)
    return () => window.removeEventListener('lab-storage-failed', show)
  }, [])
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(''), 5500)
    return () => clearTimeout(id)
  }, [toast])
  useEffect(() => {
    if (!state.plan || state.chefSession?.clock.mode !== 'real') return
    const id = setInterval(
      () =>
        setState((current) => {
          try {
            return {
              ...current,
              chefSession: chefEvent(current.plan, current.chefSession, {
                type: 'CLOCK',
                at: Math.max(Date.now(), current.chefSession.clock.now),
              }),
            }
          } catch {
            return current
          }
        }),
      1000,
    )
    return () => clearInterval(id)
  }, [state.plan, state.chefSession?.clock.mode])

  function acceptCard(next, parts = state.parts) {
    const run = {
      runId: `run-${Date.now().toString(36)}`,
      at: new Date().toISOString(),
      testCaseId: next.id,
      commit,
      engineVersions: ENGINE_VERSIONS,
      inputHash: contentHash(parts.join('\u0000')),
      ingredientCount: allIngredients(next).length,
      stepCount: next.steps.length,
      warnings: next.unresolvedIssues.map((entry) => entry.code),
      status: next.recipeCardStatus,
    }
    patch({
      card: next,
      caseId: next.id,
      parts,
      runs: [run, ...state.runs].slice(0, 15),
    })
    setMobilePane('preview')
    notify(
      `${allIngredients(next).length} ingredients · ${next.steps.length} numbered steps. Compare with the source before approval.`,
    )
  }
  function runPipeline() {
    const parts = input.trim() ? [...state.parts, input] : state.parts
    if (!parts.length) {
      notify('Paste some recipe text, or open an owner fixture below.')
      return
    }
    if (parts.join('').length > 200000) {
      notify('This workspace accepts up to 200,000 characters per recipe.')
      return
    }
    setBusy(true)
    // Yield a paint so slower phones show feedback before synchronous parsing.
    setTimeout(() => {
      try {
        const next = createRecipeCard(parts, {
          id:
            card &&
            contentHash(parts.join('\u0000')) ===
              contentHash(
                card.sourceFragments
                  .map((fragment) => fragment.rawText)
                  .join('\u0000'),
              )
              ? card.id
              : undefined,
          sourceUrl: sourceUrl || card?.sourceUrl || '',
        })
        setInput('')
        if (card && (card.edits.length || card.approvals.length))
          setPendingCard({ card: next, parts })
        else acceptCard(next, parts)
      } catch (error) {
        notify('Import failed: ' + error.message)
        patch({ runtimeError: error.message })
      } finally {
        setBusy(false)
      }
    }, 25)
  }
  function loadCase(entry) {
    const parts = entry.clips || [entry.raw]
    try {
      const next = createRecipeCard(parts, {
        id: entry.id,
        sourceUrl: entry.source || '',
      })
      setState((current) => ({
        ...current,
        drafts: current.card
          ? [
              {
                caseId: current.caseId,
                card: current.card,
                parts: current.parts,
                pendingInput: current.pendingInput,
                sourceUrl: current.sourceUrl,
              },
              ...(current.drafts || []).filter(
                (draft) => draft.caseId !== current.caseId,
              ),
            ].slice(0, 15)
          : current.drafts || [],
        card: next,
        parts,
        caseId: entry.id,
        sourceUrl: entry.source || '',
        pendingInput: '',
      }))
      setTab('recipe')
      setMobilePane('preview')
      notify(
        'Fixture loaded. Its original input is available alongside the card.',
      )
    } catch (error) {
      notify(error.message)
    }
  }
  function runSuite() {
    setBusy(true)
    setTimeout(() => {
      try {
        const report = runRegressions(cases, state.lastGood)
        setResults(report)
        notify(
          `${report.passed}/${report.total} fixture cases pass; ${report.regressions.length} new regressions.`,
        )
      } catch (error) {
        notify(error.message)
      } finally {
        setBusy(false)
      }
    }, 25)
  }
  async function importPack(event) {
    const file = event.target.files[0]
    if (!file) return
    try {
      if (file.size > 5000000)
        throw new Error('Choose an issue or fixture JSON under 5 MB.')
      const pack = JSON.parse(await file.text())
      if (pack.schemaVersion !== 1)
        throw new Error('Unsupported issue/fixture schema version.')
      if (pack.format === 'plan-and-plate-lab-fixture') {
        if (
          !Array.isArray(pack.clips) ||
          !pack.clips.every((part) => typeof part === 'string') ||
          !pack.expected ||
          !pack.canonicalExpected
        )
          throw new Error(
            'This fixture has no valid sources or expected outputs.',
          )
        const id = `local-import-${Date.now().toString(36)}`
        patch({ savedCases: [...state.savedCases, { ...pack, id }] })
        notify('Reviewed test fixture imported. Run the library to compare it.')
      } else if (
        pack.format === 'plan-and-plate-lab-issue' &&
        pack.snapshot?.card?.sourceFragments?.length
      ) {
        const parts = pack.snapshot.card.sourceFragments.map(
          (fragment) => fragment.rawText,
        )
        if (!parts.every((part) => typeof part === 'string'))
          throw new Error('Invalid source fragments.')
        loadCase({ id: `replay-${pack.id}`, clips: parts })
        notify(
          'Issue source restored. Current engines have reprocessed the original input.',
        )
      } else
        throw new Error(
          'This is a redacted report or unsupported file. A reproducible issue needs the reviewed recipe snapshot.',
        )
    } catch (error) {
      notify(error.message)
    }
    event.target.value = ''
  }
  function saveFixture() {
    try {
      const entry = createRegressionFixture(
        card,
        `local-${Date.now().toString(36)}`,
      )
      patch({ savedCases: [...state.savedCases, entry] })
      notify(
        'Reviewed expected result saved. It will be tested against future engine runs.',
      )
    } catch (error) {
      notify(error.message)
    }
  }
  function runApprovedPipeline() {
    try {
      const plan = compileCookingPlan(card, chefPreferences)
      const shopping = generateCanonicalShopping([{ card }])
      const pipeline = {
        at: new Date().toISOString(),
        caseId: state.caseId,
        commit,
        cardRevision: card.revision,
        plan,
        shopping,
        status: 'passed',
      }
      const active =
        state.chefSession &&
        Object.values(state.chefSession.taskStates).some(
          (value) => value.status !== 'pending',
        )
      patch({
        pipeline,
        ...(!active ? { plan, chefSession: createChefSession(plan) } : {}),
      })
      notify(
        active
          ? 'Cooking and shopping checks passed. Your active session was preserved.'
          : 'Full approved pipeline passed. Open Chef mode or Shopping to inspect the engines.',
      )
    } catch (error) {
      patch({ runtimeError: error.message })
      notify(error.message)
    }
  }

  return (
    <div className="lab-app">
      <a className="skip-link" href="#lab-main">
        Skip to workspace
      </a>
      <header className="lab-header">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault()
            setTab('recipe')
          }}
        >
          <span className="brand-mark">
            <Leaf size={23} strokeWidth={1.6} />
          </span>
          <span>
            plan <em>&</em> plate<small>DEVELOPMENT LAB</small>
          </span>
        </a>
        <div className="header-status">
          <span className="live-dot" />
          Private test environment
        </div>
        {!window.location.search.includes('phone') && (
          <button
            className="secondary-button phone-preview-button"
            onClick={() => setPhonePreview(true)}
          >
            <Smartphone size={16} />
            Phone preview
          </button>
        )}
        <button
          className="secondary-button report-button"
          onClick={() => setReporting(true)}
        >
          <Bug size={17} />
          <span>Report issue</span>
        </button>
      </header>
      <div className="lab-layout">
        <aside className="lab-sidebar">
          <p className="eyebrow">Recipe quality lab</p>
          <nav aria-label="Lab sections">
            {nav.map(({ id, label, icon: Icon }) => (
              <button
                className={tab === id ? 'active' : ''}
                key={id}
                onClick={() => setTab(id)}
              >
                <Icon size={19} />
                <span>{label}</span>
                {id === 'issues' && state.issues.length > 0 && (
                  <b>{state.issues.length}</b>
                )}
              </button>
            ))}
          </nav>
          <div className="sidebar-note">
            <ShieldCheck size={20} />
            <strong>A safe place to make it better.</strong>
            <p>
              Lab data stays here. Your live meals and planner are separate.
            </p>
            <span className="mono">{commit.slice(0, 7)}</span>
          </div>
        </aside>
        <main id="lab-main" className="lab-main" tabIndex={-1}>
          <Suspense
            fallback={
              <div className="panel" role="status">
                Preparing the simulator…
              </div>
            }
          >
            {storageError && (
              <p className="notice danger" role="alert">
                This browser could not save the latest changes. Export important
                issues or cases before leaving, and free storage space.
              </p>
            )}
            {card && card.parserVersion !== ENGINE_VERSIONS.recipe && (
              <p className="notice warm">
                This saved card uses recipe engine {card.parserVersion}. Rebuild
                from source to compare current extraction. Your corrections
                remain protected.
              </p>
            )}
            {tab === 'recipe' && (
              <>
                <div className="page-intro">
                  <div>
                    <p className="eyebrow">
                      <Beaker size={14} />
                      The recipe comes first
                    </p>
                    <h1>
                      From messy copy
                      <br className="desktop-break" /> to a recipe you can
                      trust.
                    </h1>
                    <p>Paste it. Compare it. Make it kitchen-ready.</p>
                  </div>
                  <div className="workspace-badges">
                    <span className="badge">
                      <ShieldCheck size={14} />
                      Source preserved
                    </span>
                    <span className="badge">
                      <Code2 size={14} />
                      Deterministic engines
                    </span>
                  </div>
                </div>
                <div className="workspace-bar">
                  <div>
                    <span className="tiny-label">CURRENT CASE</span>
                    <span className="mono case-id">{state.caseId}</span>
                  </div>
                  <button
                    className="text-button"
                    disabled={card?.recipeCardStatus !== 'VALIDATED'}
                    onClick={runApprovedPipeline}
                  >
                    <Play size={16} />
                    Run full pipeline
                  </button>
                  <button
                    className="text-button"
                    disabled={!card || card.recipeCardStatus !== 'VALIDATED'}
                    onClick={saveFixture}
                  >
                    <Save size={16} />
                    Save reviewed case
                  </button>
                </div>
                <div
                  className="mobile-segments"
                  role="tablist"
                  aria-label="Workspace view"
                >
                  {[
                    ['source', 'Source & input'],
                    ['preview', 'Recipe card'],
                    [
                      'review',
                      `Review (${card?.unresolvedIssues.filter((entry) => entry.severity !== 'info').length || 0})`,
                    ],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={mobilePane === id}
                      onClick={() => setMobilePane(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="workspace-grid">
                  <section
                    className={
                      'input-panel workspace-pane ' +
                      (mobilePane === 'source' ? 'mobile-visible' : '')
                    }
                  >
                    <div className="section-heading">
                      <div>
                        <p className="eyebrow">01 · Source material</p>
                        <h2>The original recipe</h2>
                      </div>
                      <ClipboardPaste size={21} />
                    </div>
                    <p className="helper">
                      Whole page or separate Ingredients and Method tabs, in
                      either order. Every fragment stays intact.
                    </p>
                    <label className="field source-input-label">
                      Paste recipe material
                      <textarea
                        className="recipe-input"
                        rows={12}
                        placeholder={
                          'Recipe title\nServes 4\n\nIngredients…\n\nMethod…'
                        }
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                      />
                    </label>
                    <div className="input-actions">
                      <button
                        className="secondary-button"
                        disabled={!input.trim()}
                        onClick={() => {
                          patch({ parts: [...state.parts, input] })
                          setInput('')
                          notify(
                            'Fragment kept. Paste the next tab or build the card.',
                          )
                        }}
                      >
                        <Plus size={16} />
                        Keep fragment
                      </button>
                      <span className="helper">{state.parts.length} kept</span>
                    </div>
                    <label className="field compact-field">
                      Source URL (optional)
                      <input
                        type="url"
                        placeholder="Recipe website address"
                        value={sourceUrl}
                        onChange={(event) => setSourceUrl(event.target.value)}
                      />
                    </label>
                    {state.parts.length > 0 && (
                      <div className="fragment-list">
                        {state.parts.map((part, index) => (
                          <details key={index}>
                            <summary>
                              Fragment {index + 1}{' '}
                              <span>{part.length.toLocaleString()} chars</span>
                            </summary>
                            <pre className="raw-preview">{part}</pre>
                            <button
                              className="text-button danger-text"
                              onClick={() =>
                                patch({
                                  parts: state.parts.filter(
                                    (_, position) => position !== index,
                                  ),
                                })
                              }
                            >
                              <Trash2 size={14} />
                              Remove fragment
                            </button>
                          </details>
                        ))}
                      </div>
                    )}
                    <button
                      className="primary-button build-button"
                      disabled={busy}
                      onClick={runPipeline}
                    >
                      <Play size={17} />
                      {busy
                        ? 'Building the recipe…'
                        : card
                          ? 'Rebuild from source'
                          : 'Build recipe card'}
                      <ChevronRight size={16} />
                    </button>
                    {changedSource && (
                      <p className="notice warm">
                        Source changed. Rebuild to compare a new draft with your
                        current card.
                      </p>
                    )}
                    {state.drafts?.length > 0 && (
                      <details className="saved-drafts">
                        <summary>
                          Resume an earlier draft ({state.drafts.length})
                        </summary>
                        {state.drafts.map((draft) => (
                          <button
                            className="text-button"
                            key={draft.caseId}
                            onClick={() => {
                              patch({
                                card: draft.card,
                                caseId: draft.caseId,
                                parts: draft.parts,
                                pendingInput: draft.pendingInput || '',
                                sourceUrl: draft.sourceUrl || '',
                              })
                              setMobilePane('preview')
                            }}
                          >
                            {draft.card.title || draft.caseId}
                          </button>
                        ))}
                      </details>
                    )}
                    <div className="fixture-shortcuts">
                      <p className="eyebrow">Start with a real test</p>
                      {[
                        [
                          'owner-curry-plain',
                          'Pumpkin & chickpea curry',
                          'BBC Good Food · owner copy',
                        ],
                        [
                          'owner-paneer-phone',
                          'Paneer, chickpea & spinach curry',
                          'BBC Good Food · owner copy',
                        ],
                        [
                          'owner-sprouts-two-tab-phone',
                          'Sprouts fried rice',
                          'Waitrose · two-tab copy',
                        ],
                      ].map(([id, title, subtitle]) => (
                        <button
                          key={id}
                          onClick={() =>
                            loadCase(fixtures.find((entry) => entry.id === id))
                          }
                        >
                          <span>
                            <strong>{title}</strong>
                            <small>{subtitle}</small>
                          </span>
                          <ChevronRight size={16} />
                        </button>
                      ))}
                    </div>
                  </section>
                  <section
                    className={
                      'preview-panel workspace-pane ' +
                      (mobilePane === 'preview' ? 'mobile-visible' : '')
                    }
                  >
                    {card ? (
                      <RecipeCard
                        card={card}
                        onChange={(next) => patch({ card: next })}
                        onEvidence={setEvidence}
                        notify={notify}
                      />
                    ) : (
                      <div className="recipe-empty">
                        <div className="empty-illustration">
                          <Leaf size={48} strokeWidth={1} />
                          <span>1</span>
                          <span>2</span>
                          <span>3</span>
                        </div>
                        <p className="eyebrow">02 · Canonical recipe</p>
                        <h2>
                          Good food starts
                          <br />
                          with clear instructions.
                        </h2>
                        <p>
                          Your clean, numbered recipe will appear here. Original
                          quantities, sensible steps, nothing quietly made up.
                        </p>
                        <button
                          className="primary-button"
                          onClick={() => {
                            setMobilePane('source')
                            document.querySelector('.recipe-input')?.focus()
                          }}
                        >
                          <ClipboardPaste size={17} />
                          Paste your first recipe
                        </button>
                        <button
                          className="text-button"
                          onClick={() =>
                            loadCase(
                              fixtures.find(
                                (entry) => entry.id === 'owner-curry-plain',
                              ),
                            )
                          }
                        >
                          Or try Matt’s pumpkin curry <ChevronRight size={15} />
                        </button>
                      </div>
                    )}
                  </section>
                  <aside
                    className={
                      'review-panel workspace-pane ' +
                      (mobilePane === 'review' ? 'mobile-visible' : '')
                    }
                  >
                    <div className="section-heading">
                      <div>
                        <p className="eyebrow">03 · Quality checks</p>
                        <h2>Proof, then polish.</h2>
                      </div>
                      <FileSearch size={20} />
                    </div>
                    <p className="helper">
                      A readable card is a start. Evidence and your review make
                      it dependable.
                    </p>
                    {card ? (
                      <>
                        <div className="review-stats">
                          <div>
                            <strong>{allIngredients(card).length}</strong>
                            <span>ingredients</span>
                          </div>
                          <div>
                            <strong>{card.steps.length}</strong>
                            <span>steps</span>
                          </div>
                          <div>
                            <strong>{card.sourceFragments.length}</strong>
                            <span>sources</span>
                          </div>
                        </div>
                        <div className="check-line">
                          <CheckCheck size={17} />
                          <span>
                            {card.validation.methodCoverage.every(
                              (entry) => entry.covered,
                            )
                              ? 'Extracted method fully partitioned'
                              : 'Method coverage needs review'}
                          </span>
                        </div>
                        <p className="helper small">
                          Coverage checks the extracted method; compare against
                          the full paste to catch content the importer missed.
                        </p>
                        <div className="warning-list">
                          {card.unresolvedIssues.map((entry) => (
                            <article
                              key={entry.code}
                              className={'warning-item ' + entry.severity}
                            >
                              <span className="tiny-label">
                                {entry.severity} · {entry.field}
                              </span>
                              <p>{entry.message}</p>
                              <button
                                className="text-button"
                                onClick={() => {
                                  setEvidence([])
                                }}
                              >
                                Compare source <ChevronRight size={13} />
                              </button>
                            </article>
                          ))}
                        </div>
                        {!card.unresolvedIssues.length && (
                          <p className="notice good">
                            No automated warnings. Human review is still
                            required.
                          </p>
                        )}
                        <button
                          className="secondary-button full-width"
                          onClick={() => setEvidence([])}
                        >
                          <FileSearch size={16} />
                          Compare complete source
                        </button>
                      </>
                    ) : (
                      <div className="checklist-preview">
                        <p>
                          <CheckCheck size={16} />
                          Original ingredient wording
                        </p>
                        <p>
                          <CheckCheck size={16} />
                          Numbered, source-mapped steps
                        </p>
                        <p>
                          <CheckCheck size={16} />
                          Conflicts and missing information
                        </p>
                        <p>
                          <CheckCheck size={16} />
                          Review before cooking
                        </p>
                      </div>
                    )}
                    <div className="review-footer">
                      <p>Spotted something wrong?</p>
                      <button
                        className="text-button"
                        onClick={() => setReporting(true)}
                      >
                        <Bug size={15} />
                        Capture this issue
                      </button>
                    </div>
                  </aside>
                </div>
              </>
            )}
            {tab === 'chef' && (
              <ChefSimulator
                card={card}
                plan={state.plan}
                session={state.chefSession}
                preferences={chefPreferences}
                onPreferences={(chefPreferences) => patch({ chefPreferences })}
                onCompile={(plan, chefSession) => patch({ plan, chefSession })}
                onSession={(chefSession) => patch({ chefSession })}
                notify={notify}
              />
            )}
            {tab === 'shopping' && (
              <ShoppingSimulator
                card={card}
                basket={shoppingBasket}
                onBasket={(shoppingBasket) => patch({ shoppingBasket })}
                manualItems={manualItems}
                onManualItems={(manualItems) => patch({ manualItems })}
                options={shoppingOptions}
                onOptions={(shoppingOptions) => patch({ shoppingOptions })}
                output={shoppingOutput}
                onOutput={(result) =>
                  patch({
                    shoppingLastRun: {
                      at: new Date().toISOString(),
                      sourceCount: result.sourceCount,
                    },
                  })
                }
                notify={notify}
              />
            )}
            {tab === 'library' && (
              <RegressionLibrary
                cases={cases}
                savedCases={state.savedCases}
                results={results}
                onRun={runSuite}
                onLoad={loadCase}
                onDelete={(id) =>
                  patch({
                    savedCases: state.savedCases.filter(
                      (entry) => entry.id !== id,
                    ),
                  })
                }
                onImport={importPack}
                onPromote={() => {
                  patch({
                    lastGood: Object.fromEntries(
                      results.results.map((result) => [
                        result.id,
                        {
                          passed: result.passed,
                          commit,
                          output: result.card
                            ? {
                                title: result.card.title,
                                ingredients: allIngredients(result.card).map(
                                  (item) => item.rawLine,
                                ),
                                steps: result.card.steps.map(
                                  (step) => step.instruction,
                                ),
                              }
                            : null,
                        },
                      ]),
                    ),
                  })
                  notify('This passing run is now your comparison baseline.')
                }}
              />
            )}
            {tab === 'issues' && (
              <Issues
                issues={state.issues}
                onChange={(issues) => patch({ issues })}
                onReport={() => setReporting(true)}
                savedCases={state.savedCases}
                results={results}
                notify={notify}
              />
            )}
            {tab === 'diagnostics' && (
              <>
                <div className="page-intro">
                  <div>
                    <p className="eyebrow">Inspect what actually happened</p>
                    <h1>Engine diagnostics</h1>
                    <p>
                      Versioned engines, reproducible runs and honest readiness
                      checks.
                    </p>
                  </div>
                  <button
                    className="primary-button"
                    disabled={busy}
                    onClick={runSuite}
                  >
                    <Play size={17} />
                    Run regression suite
                  </button>
                </div>
                <div className="stats-grid">
                  <div className="stat">
                    <span>Fixture passes</span>
                    <strong>
                      {results
                        ? `${results.passed}/${results.total}`
                        : 'Not run'}
                    </strong>
                  </div>
                  <div className="stat">
                    <span>Failed cases</span>
                    <strong>{results?.failed ?? '—'}</strong>
                  </div>
                  <div className="stat">
                    <span>Open critical issues</span>
                    <strong>
                      {
                        state.issues.filter(
                          (entry) =>
                            entry.details.severity === 'critical' &&
                            entry.status !== 'CLOSED',
                        ).length
                      }
                    </strong>
                  </div>
                  <div className="stat">
                    <span>Saved local cases</span>
                    <strong>{state.savedCases.length}</strong>
                  </div>
                </div>
                <div className="diagnostic-grid">
                  <section className="panel">
                    <h2>Current build</h2>
                    <dl className="key-values">
                      <div>
                        <dt>Git commit</dt>
                        <dd className="mono">{commit}</dd>
                      </div>
                      {Object.entries(ENGINE_VERSIONS).map(([key, value]) => (
                        <div key={key}>
                          <dt>{key}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="notice">
                      No paid AI service. All recipe extraction and validation
                      run on this device.
                    </p>
                  </section>
                  <section className="panel">
                    <h2>Recent recipe runs</h2>
                    {state.runs.length ? (
                      state.runs.map((run) => (
                        <div className="run-row" key={run.runId}>
                          <strong>{run.testCaseId}</strong>
                          <span>
                            {run.ingredientCount} ingredients · {run.stepCount}{' '}
                            steps · {run.warnings.length} notes
                          </span>
                          <small>
                            {new Date(run.at).toLocaleString()} ·{' '}
                            {run.commit.slice(0, 7)}
                          </small>
                        </div>
                      ))
                    ) : (
                      <p className="helper">
                        Build a recipe to record your first run.
                      </p>
                    )}
                  </section>
                </div>
                {card && (
                  <>
                    <section className="panel">
                      <h2>Original input and selected output</h2>
                      <details>
                        <summary>Preserved source fragments</summary>
                        <SourcePanel fragments={card.sourceFragments} />
                      </details>
                      <details>
                        <summary>Canonical RecipeCard JSON</summary>
                        <pre className="json-view">
                          {JSON.stringify(card, null, 2)}
                        </pre>
                      </details>
                      <details>
                        <summary>
                          Field candidates and parser diagnostics
                        </summary>
                        <pre className="json-view">
                          {JSON.stringify(card.diagnostics, null, 2)}
                        </pre>
                      </details>
                    </section>
                  </>
                )}
              </>
            )}
          </Suspense>
        </main>
      </div>
      <footer className="lab-footer">
        <span>
          <Leaf size={13} />
          Plan & Plate · Recipe Quality Lab
        </span>
        <span>
          Preview only · v{ENGINE_VERSIONS.recipe} · {commit.slice(0, 7)}
        </span>
      </footer>
      {phonePreview && (
        <Dialog
          title="Phone preview"
          eyebrow="Responsive browser viewport · physical-device testing still required"
          onClose={() => setPhonePreview(false)}
          className="phone-modal"
        >
          <div className="phone-controls">
            {[320, 390, 430].map((width) => (
              <button
                className="secondary-button"
                key={width}
                onClick={() => setPhoneWidth(width)}
              >
                {width}px
              </button>
            ))}
          </div>
          <iframe
            title="Mobile Lab preview"
            src="/?phone=1"
            style={{ width: phoneWidth, height: 760, maxWidth: '100%' }}
          />
        </Dialog>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button aria-label="Dismiss message" onClick={() => setToast('')}>
            ×
          </button>
        </div>
      )}
      {evidence !== null && card && (
        <EvidenceDrawer
          card={card}
          evidence={evidence}
          onClose={() => setEvidence(null)}
        />
      )}
      {reporting && (
        <IssueReporter
          snapshot={snapshot}
          onSave={(issue) => {
            patch({ issues: [issue, ...state.issues] })
            notify(`Saved ${issue.id}. Review the export in Issues.`)
          }}
          onClose={() => setReporting(false)}
          notify={notify}
        />
      )}
      {pendingCard && (
        <Dialog
          title="Keep your corrections safe"
          eyebrow="Reprocessing found a new draft"
          onClose={() => setPendingCard(null)}
        >
          <p className="helper">
            Your current card has edits or approval. Compare this new extraction
            before replacing it. Keeping your card leaves all corrections
            intact.
          </p>
          <div className="comparison">
            <div>
              <strong>Current card</strong>
              <p>
                {card.title} · {allIngredients(card).length} ingredients ·{' '}
                {card.steps.length} steps
              </p>
              <details>
                <summary>Current structured output</summary>
                <pre className="json-view">{JSON.stringify(card, null, 2)}</pre>
              </details>
            </div>
            <div>
              <strong>New extraction</strong>
              <p>
                {pendingCard.card.title} ·{' '}
                {allIngredients(pendingCard.card).length} ingredients ·{' '}
                {pendingCard.card.steps.length} steps
              </p>
              <details>
                <summary>Proposed structured output</summary>
                <pre className="json-view">
                  {JSON.stringify(pendingCard.card, null, 2)}
                </pre>
              </details>
            </div>
          </div>
          <div className="form-row">
            <button
              className="secondary-button"
              onClick={() => setPendingCard(null)}
            >
              Keep my current card
            </button>
            <button
              className="primary-button"
              onClick={() => {
                acceptCard(pendingCard.card, pendingCard.parts)
                setPendingCard(null)
              }}
            >
              Replace with new draft
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}
