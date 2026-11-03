import { assembleRecipeFragments } from '../../utils/recipeImportSession.js'
import { parsePastedRecipe } from '../../utils/recipeImport.js'
import { parseIngredientLine } from '../../utils/ingredientParser.js'
import { readRecipePageLines, readMetadata } from '../../utils/recipeText.js'
import { sourceFragments, findEvidence, contentHash, tokens } from './source.js'
import {
  segmentMethod,
  instructionFromSource,
  methodCoverage,
  METHOD_VERSION,
} from './method.js'

export const RECIPE_VERSION = '1.1.0'
export const ENGINE_VERSIONS = {
  schema: 1,
  recipe: RECIPE_VERSION,
  method: METHOD_VERSION,
  parser: 'production-b07e4b1',
  cooking: '1.0.0',
  timers: '1.0.0',
  shopping: '1.0.0',
}
const normalize = (value) =>
  String(value).trim().toLowerCase().replace(/\s+/g, ' ')
const issue = (code, field, message, severity = 'warning') => ({
  code,
  field,
  message,
  severity,
})

export function timeInMinutes(value) {
  const words = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    fifteen: 15,
    twenty: 20,
    thirty: 30,
    half: 0.5,
  }
  const text = String(value)
    .toLowerCase()
    .replace(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|half)\b/g,
      (word) => words[word],
    )
  const matches = [
    ...text.matchAll(
      /(\d+(?:\.\d+)?)(?:\s*([-–]|to|or)\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b/g,
    ),
  ]
  if (!matches.length) return null
  // Ranges are retained and use the upper bound only for an explicitly labelled
  // planning estimate. A card field remains unknown if the source is ambiguous.
  if (matches.some((match) => match[2])) return null
  return matches.reduce(
    (sum, match) =>
      sum +
      Number(match[1]) *
        (/^h/.test(match[4]) ? 60 : /^s/.test(match[4]) ? 1 / 60 : 1),
    0,
  )
}

function metadataEvidence(raw, fragments, field) {
  if (!raw) return []
  const labels = {
    servings: 'serves|servings|yield|makes',
    prepTime: 'prep(?:are|aration)?(?: time)?',
    cookTime: 'cook(?:ing)?(?: time)?',
    totalTime: 'total(?: time)?',
  }
  const escaped = raw
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s*')
  const pattern = new RegExp(
    `\\b(?:${labels[field]})\\s*:?\\s*${escaped}(?!\\d)`,
    'i',
  )
  return fragments.flatMap((fragment) => {
    const match = fragment.rawText.match(pattern)
    return match
      ? [
          {
            fragmentId: fragment.fragmentId,
            start: match.index,
            end: match.index + match[0].length,
          },
        ]
      : []
  })
}

function supportedField(value, fragments, kind = 'text', field) {
  const raw = value || ''
  return {
    value: raw
      ? kind === 'number'
        ? Number(raw)
        : kind === 'time'
          ? timeInMinutes(raw)
          : raw
      : null,
    raw,
    status: raw ? 'explicit' : 'missing',
    sourceRefs: metadataEvidence(raw, fragments, field),
  }
}

function findMetadataConflicts(fragments) {
  const values = new Map()
  fragments.forEach((fragment, source) => {
    const lines = readRecipePageLines(fragment.rawText)
    lines.forEach((line, index) => {
      if (!/^(?:serves|servings|prep(?:are|aration)?(?: time)?|cook(?:ing)?(?: time)?|total(?: time)?)(?=\s|:|\d|$)/i.test(line.text)) return
      const candidate = readMetadata(lines.slice(index, index + 2)).values
      for (const [field, value] of Object.entries(candidate)) {
        if (!value) continue
        const entries = values.get(field) || []
        entries.push({ source, value, sourceRefs: metadataEvidence(value, [fragment], field) })
        values.set(field, entries)
      }
    })
  })
  return [...values.entries()].filter(([, entries]) => new Set(entries.map((entry) => normalize(entry.value))).size > 1).map(([field, entries]) => ({ field, sources: [...new Set(entries.map((entry) => entry.source))], candidates: entries }))
}

export function canonicalIngredient(rawLine, index, fragments, heading = '') {
  const parsed = parseIngredientLine(rawLine)
  const quantity = parsed?.quantity || ''
  const packageMatch = rawLine.match(
    /\b(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/i,
  )
  const optionalWord = /\boptional\b/i.test(rawLine)
  const optionalScopeAmbiguous =
    optionalWord &&
    /\b(?:and|or)\b/i.test(parsed?.name || rawLine) &&
    !/^optional/i.test(heading)
  return {
    ingredientId: `ingredient-${index + 1}-${contentHash(rawLine)}`,
    rawLine,
    originalRawLine: rawLine,
    productName: parsed?.name || rawLine,
    quantity: {
      value:
        quantity && Number.isFinite(Number(quantity)) ? Number(quantity) : null,
      raw: quantity,
      unit: parsed?.unit || null,
    },
    preparation: parsed?.qualifiers || [],
    qualifiers: parsed?.qualifiers || [],
    optional:
      (optionalWord && !optionalScopeAmbiguous) || /^optional/i.test(heading),
    optionalScope: optionalScopeAmbiguous
      ? 'ambiguous'
      : optionalWord || /^optional/i.test(heading)
        ? 'item'
        : 'none',
    alternatives: /\bor\b/i.test(rawLine)
      ? [rawLine.slice(rawLine.search(/\bor\b/i))]
      : [],
    packageSize: packageMatch
      ? {
          count: Number(packageMatch[1]),
          size: Number(packageMatch[2]),
          unit: packageMatch[3],
          status: 'explicit',
        }
      : null,
    sourceRefs: findEvidence(rawLine, fragments),
    parseStatus: parsed ? 'source' : 'needs-review',
  }
}

// Complete matching suffix/prefix overlaps only. Disjoint fragments and
// conflicting quantities stay visible as conflicts rather than being guessed.
function overlapCollection(candidates, field, separator, anchor) {
  let lines = []
  for (const candidate of candidates) {
    if (
      anchor &&
      candidate.name &&
      normalize(candidate.name) !== normalize(anchor)
    )
      continue
    const incoming = (candidate[field] || '').split(separator).filter(Boolean)
    if (!lines.length) {
      lines = incoming
      continue
    }
    if (
      !incoming.length ||
      incoming.every((line) =>
        lines.some((previous) => normalize(previous) === normalize(line)),
      )
    )
      continue
    if (
      lines.every((line) =>
        incoming.some((next) => normalize(next) === normalize(line)),
      )
    ) {
      lines = incoming
      continue
    }
    for (
      let count = Math.min(lines.length, incoming.length);
      count > 0;
      count -= 1
    ) {
      if (
        lines
          .slice(-count)
          .every(
            (line, index) => normalize(line) === normalize(incoming[index]),
          )
      ) {
        lines.push(...incoming.slice(count))
        break
      }
      if (
        incoming
          .slice(-count)
          .every((line, index) => normalize(line) === normalize(lines[index]))
      ) {
        lines = [...incoming.slice(0, -count), ...lines]
        break
      }
    }
  }
  return lines.join(separator)
}

export function createRecipeCard(
  parts,
  { id, sourceUrl = '', now = new Date().toISOString() } = {},
) {
  const fragments = sourceFragments(parts)
  const rawParts = fragments.map((fragment) => fragment.rawText)
  const parsed = assembleRecipeFragments(rawParts, { includeDiagnostics: true })
  const candidates = rawParts.map((text) =>
    parsePastedRecipe(text, { includeDiagnostics: true }),
  )
  for (const conflict of findMetadataConflicts(fragments)) {
    if (!parsed.diagnostics.conflicts.some((entry) => entry.field === conflict.field)) parsed.diagnostics.conflicts.push(conflict)
  }
  for (const field of ['ingredients', 'method']) {
    const separator = field === 'ingredients' ? '\n' : '\n\n'
    const overlapped = overlapCollection(
      candidates,
      field,
      separator,
      parsed.name,
    )
    if (overlapped) parsed[field] = overlapped
    // A conflict is resolved by overlap only when every candidate's complete
    // collection is represented in the resulting ordered collection.
    const selected = parsed[field].split(separator).map(normalize)
    parsed.diagnostics.conflicts = parsed.diagnostics.conflicts.filter(
      (conflict) =>
        conflict.field !== field ||
        !candidates.every(
          (candidate) =>
            !candidate[field] ||
            candidate[field]
              .split(separator)
              .every((line) => selected.includes(normalize(line))),
        ),
    )
  }
  const ingredientLines = parsed.ingredients.split('\n').filter(Boolean)
  const ingredientCandidate = candidates.find(
    (candidate) => candidate.ingredients === parsed.ingredients,
  )
  const sections = ingredientCandidate?.diagnostics.ingredientSections || []
  const groups = [
    { groupId: 'group-main', heading: '', startIndex: 0 },
    ...sections.map((section, index) => ({
      groupId: `group-${index + 1}`,
      heading: section.name,
      startIndex: section.startIndex,
    })),
  ]
  const ingredientGroups = groups
    .map((group, index) => ({
      ...group,
      items: ingredientLines
        .slice(group.startIndex, groups[index + 1]?.startIndex)
        .map((line, offset) =>
          canonicalIngredient(
            line,
            group.startIndex + offset,
            fragments,
            group.heading,
          ),
        ),
    }))
    .filter((group) => group.items.length)
  const card = {
    id: id || `recipe-${contentHash(rawParts.join('\u0000'))}`,
    schemaVersion: 1,
    revision: 1,
    parserVersion: RECIPE_VERSION,
    createdAt: now,
    updatedAt: now,
    title: parsed.name,
    titleSourceRefs: findEvidence(parsed.name, fragments),
    sourceUrl,
    sourceFragments: fragments,
    servings: supportedField(parsed.servings, fragments, 'number', 'servings'),
    prepTime: supportedField(parsed.prepTime, fragments, 'time', 'prepTime'),
    cookTime: supportedField(parsed.cookTime, fragments, 'time', 'cookTime'),
    totalTime: supportedField(parsed.totalTime, fragments, 'time', 'totalTime'),
    ingredientGroups,
    originalMethod: parsed.method,
    steps: segmentMethod(parsed.method, fragments),
    notes: parsed.notes ? parsed.notes.split('\n\n') : [],
    diagnostics: { ...parsed.diagnostics, candidates },
    edits: [],
    approvals: [],
    resolvedIssues: [],
  }
  return refreshRecipeCard(card)
}

export function allIngredients(card) {
  return card.ingredientGroups.flatMap((group) => group.items)
}

export function validateRecipeCard(card) {
  const issues = []
  const ingredients = allIngredients(card)
  if (card.schemaVersion !== 1)
    issues.push(
      issue(
        'schema-version',
        'schema',
        'Unsupported recipe schema version.',
        'error',
      ),
    )
  if (!card.title.trim())
    issues.push(
      issue(
        'missing-title',
        'title',
        'The source has no clear recipe title.',
        'error',
      ),
    )
  if (!ingredients.length)
    issues.push(
      issue(
        'missing-ingredients',
        'ingredients',
        'Add the ingredients fragment before approval.',
        'error',
      ),
    )
  if (!card.steps.length)
    issues.push(
      issue(
        'missing-method',
        'steps',
        'Add the method fragment before approval.',
        'error',
      ),
    )
  if (
    !card.servings.value ||
    !Number.isFinite(card.servings.value) ||
    card.servings.value <= 0
  )
    issues.push(
      issue(
        'missing-servings',
        'servings',
        'Choose a serving count before scaling or cooking.',
        'error',
      ),
    )
  for (const field of ['prepTime', 'cookTime', 'totalTime']) {
    if (card[field].value === null)
      issues.push(
        issue(
          `unknown-${field}`,
          field,
          `${field.replace('Time', ' time')} is not specified as a single duration.`,
          'info',
        ),
      )
    if (
      card[field].value !== null &&
      (!Number.isFinite(card[field].value) || card[field].value < 0)
    )
      issues.push(
        issue(
          `invalid-${field}`,
          field,
          'Time must be a finite, non-negative duration.',
          'error',
        ),
      )
  }
  for (const conflict of card.diagnostics.conflicts || [])
    issues.push(
      issue(
        `conflict-${conflict.field}`,
        conflict.field,
        `Source fragments disagree about ${conflict.field}. Compare both candidates and edit or explicitly accept the selected value.`,
      ),
    )
  for (const ingredient of ingredients) {
    if (!ingredient.productName.trim())
      issues.push(
        issue(
          `empty-${ingredient.ingredientId}`,
          'ingredients',
          'An ingredient needs a product name.',
          'error',
        ),
      )
    if (ingredient.quantity.raw && ingredient.quantity.value === null)
      issues.push(
        issue(
          `quantity-${ingredient.ingredientId}`,
          'ingredients',
          `Review “${ingredient.rawLine}”: its amount cannot be scaled reliably.`,
        ),
      )
    if (
      ingredient.quantity.value !== null &&
      (!Number.isFinite(ingredient.quantity.value) ||
        ingredient.quantity.value < 0)
    )
      issues.push(
        issue(
          `invalid-${ingredient.ingredientId}`,
          'ingredients',
          'Ingredient quantity must be finite and non-negative.',
          'error',
        ),
      )
    if (
      ingredient.parseStatus === 'needs-review' ||
      (!ingredient.sourceRefs.length && ingredient.parseStatus !== 'user')
    )
      issues.push(
        issue(
          `evidence-${ingredient.ingredientId}`,
          'ingredients',
          `Source evidence could not be mapped for “${ingredient.rawLine}”.`,
        ),
      )
    if (ingredient.alternatives.length)
      issues.push(
        issue(
          `alternative-${ingredient.ingredientId}`,
          'ingredients',
          `Choose or accept the primary alternative for “${ingredient.rawLine}” before shopping.`,
        ),
      )
    if (ingredient.optionalScope === 'ambiguous')
      issues.push(
        issue(
          `optional-scope-${ingredient.ingredientId}`,
          'ingredients',
          `Only part of “${ingredient.rawLine}” may be optional. The complete line stays included until you edit it.`,
        ),
      )
  }
  const coverage = methodCoverage(card.originalMethod, card.steps)
  if (coverage.some((entry) => !entry.covered))
    issues.push(
      issue(
        'method-coverage',
        'steps',
        'Original method coverage changed. Compare edits against the preserved source.',
      ),
    )
  for (const step of card.steps) {
    if (
      step.parseStatus === 'source' &&
      step.instruction !== instructionFromSource(step.sourceText)
    )
      issues.push(
        issue(
          `unsupported-${step.stepId}`,
          'steps',
          'A generated instruction differs from its source partition.',
          'error',
        ),
      )
    if (!step.instruction.trim())
      issues.push(
        issue(
          `empty-${step.stepId}`,
          'steps',
          'Remove or complete the empty step.',
          'error',
        ),
      )
    if (!step.sourceRefs.length && step.parseStatus !== 'user')
      issues.push(
        issue(
          `evidence-${step.stepId}`,
          'steps',
          'A step could not be mapped to a source span.',
        ),
      )
    if (
      /\b(?:if|otherwise|alternatively|while|meanwhile)\b/i.test(
        step.instruction,
      )
    )
      issues.push(
        issue(
          `branch-${step.stepId}`,
          'steps',
          `Review the condition or parallel action in step ${step.number}; Chef will preserve its order.`,
          'info',
        ),
      )
  }
  if (card.edits.length)
    issues.push(
      issue(
        'user-changes',
        'card',
        'Review your corrected fields and steps alongside the preserved source.',
      ),
    )
  if (card.diagnostics.method?.reviewNeeded)
    issues.push(
      issue(
        'parser-review',
        'source',
        'The importer found an uncertain method boundary. Check the complete original source.',
      ),
    )
  // These are coverage checks of extracted content, not proof that every line
  // of an arbitrary website was correctly classified.
  const sourceMethodTokens = tokens(card.originalMethod).length
  return {
    issues,
    methodCoverage: coverage,
    sourceMethodTokens,
    extractedIngredientCount: ingredients.length,
    stepCount: card.steps.length,
  }
}

export function refreshRecipeCard(card) {
  const validation = validateRecipeCard(card)
  const unresolvedIssues = validation.issues.filter(
    (entry) => !card.resolvedIssues?.includes(entry.code),
  )
  const approved = card.approvals.some(
    (approval) => approval.revision === card.revision,
  )
  return {
    ...card,
    validation,
    unresolvedIssues,
    recipeCardStatus:
      approved && !unresolvedIssues.some((entry) => entry.severity !== 'info')
        ? 'VALIDATED'
        : unresolvedIssues.some((entry) => entry.severity !== 'info')
          ? 'NEEDS_REVIEW'
          : 'DRAFT',
  }
}

export function reviseRecipeCard(
  card,
  patch,
  description,
  now = new Date().toISOString(),
) {
  return refreshRecipeCard({
    ...card,
    ...patch,
    revision: card.revision + 1,
    updatedAt: now,
    approvals: [],
    resolvedIssues: [],
    edits: [...card.edits, { at: now, revision: card.revision, description }],
  })
}

export function approveRecipeCard(card, now = new Date().toISOString()) {
  const refreshed = refreshRecipeCard(card)
  if (refreshed.unresolvedIssues.some((entry) => entry.severity === 'error'))
    throw new Error('Fix required recipe fields before approval.')
  return refreshRecipeCard({
    ...refreshed,
    resolvedIssues: refreshed.validation.issues
      .filter((entry) => entry.severity === 'warning')
      .map((entry) => entry.code),
    approvals: [
      {
        revision: card.revision,
        at: now,
        type: 'human-reviewed',
        note: 'Tester compared the selected card with all source fragments, including flagged ambiguities.',
      },
    ],
  })
}

export function toLegacyRecipe(card) {
  return {
    id: card.id,
    name: card.title,
    servings: String(card.servings.value || ''),
    prepTime: card.prepTime.raw,
    cookTime: card.cookTime.raw,
    ingredients: allIngredients(card)
      .map((ingredient) => ingredient.rawLine)
      .join('\n'),
    parsedIngredients: allIngredients(card).map((ingredient) => ({
      canonicalIngredientId: ingredient.ingredientId,
      name: ingredient.productName,
      quantity:
        ingredient.quantity.value === null
          ? ingredient.quantity.raw || ''
          : String(ingredient.quantity.value),
      unit: ingredient.quantity.unit || '',
      rawText: ingredient.rawLine,
      qualifiers: ingredient.qualifiers,
    })),
    method: card.steps.map((step) => step.instruction).join('\n\n'),
    notes: card.notes.join('\n\n'),
  }
}
