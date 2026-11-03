import { ENGINE_VERSIONS, allIngredients } from '../recipe/card.js'
export const ISSUE_STATES = ['NEW', 'REPRODUCED', 'FIX IN PROGRESS', 'VERIFIED', 'REGRESSION LOCKED', 'CLOSED']

export function createIssue(snapshot, details, { now = new Date().toISOString(), id = `issue-${Date.now().toString(36)}` } = {}) {
  return { id, format: 'plan-and-plate-lab-issue', schemaVersion: 1, createdAt: now, status: 'NEW', details, snapshot: structuredClone(snapshot) }
}

// Full recipe snapshots are local only. Export requires explicit review;
// diagnostics-only export includes codes/counts, never recipe-bearing messages.
export function exportIssue(issue, { includeRecipe = false, includeDevice = false, includeEvidence = false } = {}) {
  const card = issue.snapshot?.card
  const { attachments, device, ...details } = issue.details
  return {
    format: issue.format, schemaVersion: 1, id: issue.id, createdAt: issue.createdAt, status: issue.status,
    details: { ...details, ...(includeDevice ? { device } : {}), ...(includeEvidence ? { attachments } : {}) },
    engineVersions: ENGINE_VERSIONS, commit: issue.snapshot?.commit || 'unknown',
    ...(includeRecipe ? { snapshot: issue.snapshot } : { redacted: true, summary: { ingredientCount: card ? allIngredients(card).length : 0, stepCount: card?.steps.length || 0, warningCodes: card?.unresolvedIssues.map((entry) => entry.code) || [], failedAssertions: (issue.snapshot?.failedAssertions || []).map((entry) => ({ field: entry.field, passed: false })) } }),
  }
}

export function createRegressionFixture(card, id, now = new Date().toISOString()) {
  if (card.recipeCardStatus !== 'VALIDATED') throw new Error('Approve the recipe card before locking expected results.')
  return { id, clips: card.sourceFragments.map((fragment) => fragment.rawText), raw: card.sourceFragments.map((fragment) => fragment.rawText).join('\n\n'), layout: 'local human-reviewed case', expected: { name: card.title, servings: card.servings.raw, ingredients: allIngredients(card).map((item) => item.rawLine) }, canonicalExpected: { steps: card.steps.map((step) => step.instruction), groups: card.ingredientGroups.map((group) => group.heading) }, reviewedAt: now, review: 'tester approved this exact card revision', expectedCard: structuredClone(card), defects: [] }
}
