import { useState } from 'react'
import { ArrowDown, ArrowUp, Check, CheckCheck, FileSearch, GitMerge, Pencil, Plus, Scissors, Trash2 } from 'lucide-react'
import { allIngredients, canonicalIngredient, reviseRecipeCard, approveRecipeCard, timeInMinutes } from '../../domain/recipe/card.js'
import { findEvidence } from '../../domain/recipe/source.js'
import Dialog from './Dialog.jsx'

export default function RecipeCard({ card, onChange, onEvidence, notify }) {
  const [editing, setEditing] = useState(false)
  const change = (patch, message) => onChange(reviseRecipeCard(card, patch, message))
  const updateStep = (index, patch) => change({ steps: card.steps.map((step, position) => position === index ? { ...step, ...patch, parseStatus: 'user' } : step) }, 'Edited method step')
  function reorder(index, delta) {
    const steps = [...card.steps]
    const target = index + delta
    ;[steps[index], steps[target]] = [steps[target], steps[index]]
    change({ steps: steps.map((step, position) => ({ ...step, number: position + 1, parseStatus: 'user' })) }, 'Reordered method; verify source sequence')
  }
  function splitStep(index) {
    const element = document.getElementById('edit-' + card.steps[index].stepId)
    const position = element?.selectionStart || 0
    const current = card.steps[index]
    if (!position || position >= current.instruction.length) { notify('Place the cursor where this step should split.'); element?.focus(); return }
    const steps = [...card.steps]
    steps.splice(index, 1, { ...current, instruction: current.instruction.slice(0, position).trim(), parseStatus: 'user' }, { ...current, stepId: `${current.stepId}-split-${card.revision}`, instruction: current.instruction.slice(position).trim(), parseStatus: 'user' })
    change({ steps: steps.map((step, position) => ({ ...step, number: position + 1 })) }, 'Split a method step')
  }
  function mergeStep(index) {
    const steps = [...card.steps]
    const current = steps[index]
    const following = steps[index + 1]
    steps.splice(index, 2, { ...current, instruction: current.instruction + ' ' + following.instruction, sourceRefs: [...current.sourceRefs, ...following.sourceRefs], sourceText: current.sourceText + following.sourceText, parseStatus: 'user' })
    change({ steps: steps.map((step, position) => ({ ...step, number: position + 1 })) }, 'Merged adjacent steps')
  }
  function editIngredient(groupIndex, itemIndex, rawLine) {
    const original = card.ingredientGroups[groupIndex].items[itemIndex]
    const parsed = canonicalIngredient(rawLine, allIngredients(card).findIndex((item) => item.ingredientId === original.ingredientId), card.sourceFragments)
    change({ ingredientGroups: card.ingredientGroups.map((group, index) => index === groupIndex ? { ...group, items: group.items.map((item, position) => position === itemIndex ? { ...parsed, ingredientId: original.ingredientId, originalRawLine: original.originalRawLine, sourceRefs: original.sourceRefs, parseStatus: 'user' } : item) } : group) }, 'Corrected ingredient; original evidence retained')
  }
  return <article className="recipe-paper">
    <div className="card-topline"><span className={'badge ' + (card.recipeCardStatus === 'VALIDATED' ? 'good' : 'warm')}>{card.recipeCardStatus === 'VALIDATED' ? <CheckCheck size={14} /> : <Pencil size={13} />}{card.recipeCardStatus === 'VALIDATED' ? 'Reviewed recipe' : 'Recipe draft'}</span><button className="text-button" onClick={() => setEditing(!editing)}><Pencil size={15} />{editing ? 'Finish editing' : 'Edit card'}</button></div>
    {editing ? <label className="field">Recipe title<input value={card.title} onChange={(event) => change({ title: event.target.value }, 'Corrected title')} /></label> : <h2 className="recipe-title">{card.title || 'Untitled recipe'}</h2>}
    <div className="recipe-meta">{[['servings', 'Serves', card.servings.value], ['prepTime', 'Prep', card.prepTime.raw], ['cookTime', 'Cook', card.cookTime.raw], ['totalTime', 'Total', card.totalTime.raw]].map(([field, label, value]) => <div key={field}>{editing ? <label className="field">{label}<input type={field === 'servings' ? 'number' : 'text'} min={field === 'servings' ? '1' : undefined} value={field === 'servings' ? card[field].value || '' : card[field].raw} onChange={(event) => { const raw = event.target.value; change({ [field]: { ...card[field], value: field === 'servings' ? raw ? Number(raw) : null : timeInMinutes(raw), raw, status: 'user' } }, `Corrected ${field}`) }} /></label> : <><span>{label}</span><strong>{value || 'Not specified'}</strong></>}<button className="evidence-button" aria-label={`View source for ${label}`} onClick={() => onEvidence(card[field].sourceRefs)}><FileSearch size={14} /></button></div>)}</div>
    {editing && <label className="field">Source URL (optional)<input type="url" value={card.sourceUrl} placeholder="https://…" onChange={(event) => change({ sourceUrl: event.target.value }, 'Edited source reference')} /></label>}
    <div className="section-heading"><h3>Ingredients</h3><span>{allIngredients(card).length} items · original amounts</span></div>
    {card.ingredientGroups.map((group, groupIndex) => <section key={group.groupId}>
      {editing ? <label className="field compact-field">Ingredient group<input aria-label={`Ingredient group ${groupIndex + 1}`} value={group.heading} placeholder="Group heading (optional)" onChange={(event) => change({ ingredientGroups: card.ingredientGroups.map((item, index) => index === groupIndex ? { ...item, heading: event.target.value } : item) }, 'Changed ingredient group')} /></label> : group.heading && <h4>{group.heading}</h4>}
      <ul className="ingredient-list">{group.items.map((item, itemIndex) => <li key={item.ingredientId}><span className="ingredient-dot" />{editing ? <textarea aria-label={`Ingredient ${itemIndex + 1} in group ${groupIndex + 1}`} rows={2} value={item.rawLine} onChange={(event) => editIngredient(groupIndex, itemIndex, event.target.value)} /> : <div><span>{item.rawLine}</span>{item.optional && <span className="tiny-label">optional</span>}</div>}<button className="evidence-button" aria-label={`View source for ${item.productName}`} onClick={() => onEvidence(item.sourceRefs)}><FileSearch size={16} /></button>{editing && <button className="icon-button" aria-label={`Remove ${item.productName}`} onClick={() => change({ ingredientGroups: card.ingredientGroups.map((entry, index) => index === groupIndex ? { ...entry, items: entry.items.filter((_, position) => position !== itemIndex) } : entry) }, 'Removed an ingredient; verify against source')}><Trash2 size={15} /></button>}</li>)}</ul>
      {editing && <button className="text-button" onClick={() => change({ ingredientGroups: card.ingredientGroups.map((entry, index) => index === groupIndex ? { ...entry, items: [...entry.items, { ...canonicalIngredient('New ingredient', allIngredients(card).length, card.sourceFragments), ingredientId: `user-ingredient-${card.revision}`, parseStatus: 'user' }] } : entry) }, 'Added ingredient')}><Plus size={16} />Add ingredient</button>}
    </section>)}
    {editing && <button className="text-button" onClick={() => change({ ingredientGroups: [...card.ingredientGroups, { groupId: `user-group-${card.revision}`, heading: 'New group', items: [] }] }, 'Added ingredient group')}><Plus size={16} />Add ingredient group</button>}
    <div className="section-heading method-heading"><h3>Let’s make it</h3><span>{card.steps.length} numbered steps</span></div>
    <ol className="method-list">{card.steps.map((step, index) => <li key={step.stepId}><span className="step-number">{index + 1}</span><div className="step-content">{editing ? <><label className="sr-only" htmlFor={'edit-' + step.stepId}>Step {index + 1}</label><textarea id={'edit-' + step.stepId} rows={3} value={step.instruction} onChange={(event) => updateStep(index, { instruction: event.target.value })} /><div className="step-tools"><button disabled={!index} className="icon-button" aria-label={`Move step ${index + 1} up`} onClick={() => reorder(index, -1)}><ArrowUp size={15} /></button><button disabled={index === card.steps.length - 1} className="icon-button" aria-label={`Move step ${index + 1} down`} onClick={() => reorder(index, 1)}><ArrowDown size={15} /></button><button className="text-button" onClick={() => splitStep(index)}><Scissors size={14} />Split at cursor</button><button disabled={index === card.steps.length - 1} className="text-button" onClick={() => mergeStep(index)}><GitMerge size={14} />Merge next</button><button className="icon-button" aria-label={`Delete step ${index + 1}`} onClick={() => change({ steps: card.steps.filter((_, position) => position !== index).map((entry, position) => ({ ...entry, number: position + 1 })) }, 'Deleted method step')}><Trash2 size={15} /></button></div></> : <p>{step.instruction}</p>}<button className="text-button source-link" onClick={() => onEvidence(step.sourceRefs)}><FileSearch size={13} />{step.parseStatus === 'user' ? 'Original evidence · edited' : 'View original'}</button></div></li>)}</ol>
    {editing && <button className="text-button" onClick={() => change({ steps: [...card.steps, { stepId: `user-step-${card.revision}`, number: card.steps.length + 1, instruction: '', sourceText: '', sourceRefs: [], ingredientRefs: [], parseStatus: 'user', originalOrder: card.steps.length }] }, 'Added a method step')}><Plus size={16} />Add step</button>}
    {(card.notes.length > 0 || editing) && <div className="recipe-notes"><h4>Recipe notes</h4>{editing ? <textarea aria-label="Recipe notes" rows={3} value={card.notes.join('\n\n')} onChange={(event) => change({ notes: event.target.value.split('\n\n') }, 'Corrected recipe notes')} /> : card.notes.map((note, index) => <p key={index}>{note}</p>)}</div>}
    {card.sourceUrl && <a className="source-url" href={/^https?:\/\//i.test(card.sourceUrl) ? card.sourceUrl : undefined} target="_blank" rel="noreferrer">Original recipe source ↗</a>}
    <div className="approval"><div><strong>{card.recipeCardStatus === 'VALIDATED' ? 'This revision is approved' : 'Check the source, then approve'}</strong><p>Review quantities, numbered steps and any flagged alternatives. Approval records your review of this exact revision.</p></div><button className="primary-button" disabled={card.recipeCardStatus === 'VALIDATED' || card.unresolvedIssues.some((entry) => entry.severity === 'error')} onClick={() => { try { onChange(approveRecipeCard(card)); setEditing(false); notify('Recipe approved. Cooking and shopping can use this revision.') } catch (error) { notify(error.message) } }}><Check size={17} />Approve recipe</button></div>
  </article>
}

export function SourcePanel({ fragments, evidence }) {
  return <div className="source-view">{fragments.map((fragment, index) => {
    const spans = (evidence || []).filter((ref) => ref.fragmentId === fragment.fragmentId).sort((a, b) => a.start - b.start)
    let cursor = 0
    const parts = []
    for (const span of spans) { if (span.start < cursor) continue; parts.push(fragment.rawText.slice(cursor, span.start)); parts.push(<mark key={`${span.start}-${span.end}`}>{fragment.rawText.slice(span.start, span.end)}</mark>); cursor = span.end }
    parts.push(fragment.rawText.slice(cursor))
    return <section key={fragment.fragmentId}><div className="source-fragment-heading"><strong>Source fragment {index + 1}</strong><span>{fragment.contentHash}</span></div><pre>{parts}</pre></section>
  })}</div>
}

export function EvidenceDrawer({ card, evidence, onClose }) {
  return <Dialog title="Source evidence" eyebrow="Original clipboard · unchanged" onClose={onClose} className="evidence-modal">{!evidence.length && <p className="notice warm">Compare the complete original below. Nothing has been removed.</p>}<SourcePanel fragments={card.sourceFragments} evidence={evidence.length ? evidence : findEvidence(card.title, card.sourceFragments)} /></Dialog>
}
