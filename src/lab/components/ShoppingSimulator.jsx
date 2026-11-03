import { useState } from 'react'
import {
  Check,
  FileSearch,
  Plus,
  ShoppingBasket,
  Trash2,
  Undo2,
} from 'lucide-react'
import { getIngredientCategory } from '../../utils/shoppingList.js'
import Dialog from './Dialog.jsx'
import { SourcePanel } from './RecipeCard.jsx'

export default function ShoppingSimulator({
  card,
  basket,
  onBasket,
  manualItems,
  onManualItems,
  options,
  onOptions,
  onOutput,
  output,
  notify,
}) {
  const [manual, setManual] = useState({ name: '', quantity: '', unit: '' })
  const [trace, setTrace] = useState(null)
  const result = output.result
  function addCard() {
    if (card?.recipeCardStatus !== 'VALIDATED') {
      notify('Approve the current recipe before adding it to this test basket.')
      return
    }
    onBasket([
      ...basket,
      {
        id: `lab-meal-${Date.now().toString(36)}`,
        card: structuredClone(card),
        plannedServings: card.servings.value,
      },
    ])
  }
  function markHome(item, atHome) {
    const ids = options.atHomeSourceIds || []
    onOptions({
      ...options,
      atHomeSourceIds: atHome
        ? [...new Set([...ids, ...item.sourceIds])]
        : ids.filter((id) => !item.sourceIds.includes(id)),
    })
  }
  function groupView(groups, home = false) {
    return groups.map((group) => (
      <section className="shopping-group panel" key={group.name}>
        <div className="section-heading">
          <h2>{group.name}</h2>
          <span>{group.items.length} items</span>
        </div>
        {group.items.map((item) => (
          <div className="shopping-row" key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <span>{item.quantity || 'Amount not specified'}</span>
              <small>
                {item.isManual
                  ? 'Manual household item'
                  : `${item.trace.length} recipe contribution${item.trace.length === 1 ? '' : 's'}`}
              </small>
            </div>
            <div className="shopping-row-actions">
              <button
                className="icon-button"
                aria-label={`Inspect sources for ${item.name}`}
                onClick={() => setTrace(item)}
              >
                <FileSearch size={17} />
              </button>
              <button
                className="secondary-button"
                onClick={() => markHome(item, !home)}
              >
                {home ? <Undo2 size={14} /> : <Check size={14} />}
                {home ? 'Need to buy' : 'Already got it'}
              </button>
              {item.isManual && (
                <button
                  className="icon-button"
                  aria-label={`Remove manual ${item.name}`}
                  onClick={() =>
                    onManualItems(
                      manualItems.filter((entry) => entry.id !== item.id),
                    )
                  }
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </section>
    ))
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">
            The same canonical ingredients, all the way through
          </p>
          <h1>One trustworthy basket.</h1>
          <p>
            Scale servings, combine meals and inspect every original recipe
            contribution.
          </p>
        </div>
        <button
          className="primary-button"
          disabled={card?.recipeCardStatus !== 'VALIDATED'}
          onClick={addCard}
        >
          <Plus size={17} />
          Add current reviewed recipe
        </button>
      </div>
      <div className="shopping-layout">
        <section>
          <div className="panel">
            <h2>Test this weekly shop</h2>
            {basket.map((selection, index) => (
              <div className="basket-selection" key={selection.id}>
                <div>
                  <strong>{selection.card.title}</strong>
                  <small>
                    Reviewed revision {selection.card.revision} · serves{' '}
                    {selection.card.servings.value}
                  </small>
                </div>
                <label className="field">
                  Plan for
                  <input
                    aria-label={`Planned servings for ${selection.card.title} ${index + 1}`}
                    type="number"
                    min="1"
                    max="100"
                    value={selection.plannedServings}
                    onChange={(event) =>
                      onBasket(
                        basket.map((item, position) =>
                          position === index
                            ? {
                                ...item,
                                plannedServings:
                                  event.target.value === ''
                                    ? ''
                                    : Number(event.target.value),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  className="icon-button"
                  aria-label={`Remove planned ${selection.card.title} ${index + 1}`}
                  onClick={() =>
                    onBasket(basket.filter((_, position) => position !== index))
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {!basket.length && (
              <p className="helper">
                Add the current reviewed recipe, then return to the workspace to
                import and approve another. This basket keeps its own recipe
                snapshots.
              </p>
            )}
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={options.includeOptional}
                onChange={(event) =>
                  onOptions({
                    ...options,
                    includeOptional: event.target.checked,
                  })
                }
              />
              Include optional ingredients
            </label>
            <p className="helper">
              Reviewed primary alternatives are used. Compound serving lines
              stay together; no quantities or products are invented.
            </p>
            <button
              className="text-button"
              disabled={!result}
              onClick={() => {
                onOutput(result)
                notify(
                  'Shopping output captured in the pipeline snapshot and issue reports.',
                )
              }}
            >
              Capture shopping result
            </button>
          </div>
          <form
            className="panel form-stack"
            onSubmit={(event) => {
              event.preventDefault()
              const name = manual.name.trim()
              if (!name) return
              onManualItems([
                ...manualItems,
                {
                  ...manual,
                  name,
                  id: `manual-${Date.now().toString(36)}`,
                  category: getIngredientCategory(name),
                },
              ])
              setManual({ name: '', quantity: '', unit: '' })
            }}
          >
            <h2>Groceries & household</h2>
            <label className="field">
              Manual item
              <input
                required
                value={manual.name}
                placeholder="Toilet rolls, milk, washing-up liquid…"
                onChange={(event) =>
                  setManual({ ...manual, name: event.target.value })
                }
              />
            </label>
            <div className="form-row">
              <label className="field">
                Quantity (optional)
                <input
                  value={manual.quantity}
                  onChange={(event) =>
                    setManual({ ...manual, quantity: event.target.value })
                  }
                />
              </label>
              <label className="field">
                Unit (optional)
                <input
                  value={manual.unit}
                  placeholder="packs"
                  onChange={(event) =>
                    setManual({ ...manual, unit: event.target.value })
                  }
                />
              </label>
            </div>
            <button className="secondary-button" type="submit">
              <Plus size={16} />
              Add household item
            </button>
          </form>
          <p className="notice">
            “Already got it” is a Lab-only pantry simulation. Items remain
            visible and recoverable below. No production Pantry is created or
            stock deducted.
          </p>
        </section>
        <section>
          {output.error && (
            <p className="notice danger" role="alert">
              {output.error}
            </p>
          )}
          {result && (
            <>
              <div className="shopping-summary">
                <ShoppingBasket size={23} />
                <strong>
                  {result.groups.reduce(
                    (sum, group) => sum + group.items.length,
                    0,
                  )}{' '}
                  to buy
                </strong>
                <span>
                  {result.sourceCount} recipe ingredient contributions
                </span>
              </div>
              {groupView(result.groups)}
              {!result.groups.length && (
                <div className="empty-card">
                  <ShoppingBasket size={30} />
                  <h2>
                    {result.atHome.length
                      ? 'Everything is already at home.'
                      : 'Your test basket is ready.'}
                  </h2>
                  <p>
                    Add reviewed meals or manual household items to exercise the
                    real shopping engine.
                  </p>
                </div>
              )}
              {result.atHome.length > 0 && (
                <details className="at-home">
                  <summary>
                    Already at home ·{' '}
                    {result.atHome.reduce(
                      (sum, group) => sum + group.items.length,
                      0,
                    )}{' '}
                    items
                  </summary>
                  {groupView(result.atHome, true)}
                </details>
              )}
              {result.excluded.length > 0 && (
                <details>
                  <summary>
                    Excluded optional ingredients ({result.excluded.length})
                  </summary>
                  {result.excluded.map((entry) => (
                    <p className="helper" key={entry.ingredientId}>
                      {entry.rawLine} · {entry.reason}
                    </p>
                  ))}
                </details>
              )}
              {result.warnings.length > 0 && (
                <details>
                  <summary>
                    Shopping review notes ({result.warnings.length})
                  </summary>
                  {result.warnings.map((entry, index) => (
                    <p className="helper" key={index}>
                      {entry.message}
                    </p>
                  ))}
                </details>
              )}
              <details>
                <summary>Structured Shopping output</summary>
                <pre className="json-view">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </>
          )}
        </section>
      </div>
      {trace && (
        <Dialog
          title={trace.name}
          eyebrow="Every merged amount has a source"
          onClose={() => setTrace(null)}
        >
          {trace.trace.map((entry, index) => (
            <section className="trace-entry" key={index}>
              <h3>{entry.recipeTitle || 'Manual household item'}</h3>
              <p className="notice">{entry.rawLine}</p>
              {entry.scale !== undefined && (
                <p className="helper">
                  {entry.baseServings} → {entry.plannedServings} servings ·
                  multiplier {entry.scale}
                </p>
              )}
              <details>
                <summary>Ingredient and merge provenance</summary>
                <pre className="json-view">
                  {JSON.stringify(
                    { ...entry, sourceFragments: undefined },
                    null,
                    2,
                  )}
                </pre>
              </details>
              {entry.sourceRefs?.length > 0 && (
                <SourcePanel
                  fragments={result.sourceFragments.filter((fragment) =>
                    entry.sourceRefs.some(
                      (ref) => ref.fragmentId === fragment.fragmentId,
                    ),
                  )}
                  evidence={entry.sourceRefs}
                />
              )}
            </section>
          ))}
        </Dialog>
      )}
    </>
  )
}
