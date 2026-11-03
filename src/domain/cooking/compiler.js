import { allIngredients, timeInMinutes } from '../recipe/card.js'
import { contentHash } from '../recipe/source.js'

export const SAFETY_POLICY = {
  version: 'fsa-2026-11-03',
  reviewedAt: '2026-11-03',
  cooking: 'https://www.food.gov.uk/safety-hygiene/cooking-your-food',
  hygiene:
    'https://www.food.gov.uk/safety-hygiene/avoiding-cross-contamination',
  // Safety-policy guidance is separate from recipe evidence and temperatures.
  hygieneMessage:
    'After handling raw meat or fish, wash your hands and clean and disinfect the board, knife and surfaces before handling other food. Keep raw and ready-to-eat food separate.',
  donenessMessage:
    'Check the food is thoroughly cooked before serving. Follow the recipe and packet instructions and use a clean food thermometer where appropriate. A timer alone cannot confirm safe doneness. Review the linked FSA guidance.',
}
const prepPattern =
  /\b(chopp?ed|diced|sliced|peeled|grated|crushed|trimmed|deseeded|quartered|halved|rinsed|washed|juiced|bashed|cut into)\b/i
const rawRisk =
  /\b(chicken|turkey|poultry|pork|beef|mince|lamb|fish|prawns?|salmon)\b/i
const prepared = /\b(?:cooked|ready[- ]to[- ]eat|tinned|canned)\b/i
const prepAction =
  /^(?:meanwhile[, ]+)?(?:in a bowl[, ]+)?(?:chop|slice|dice|peel|grate|crush|trim|wash|rinse|cut|squeeze|measure|prepare|whisk|beat|mix)\b/i
const finishAction = /^(?:serve|scatter|divide|garnish|bring to the table)\b/i
const passiveAction =
  /^(?:preheat|bake|roast|simmer|boil|rest|chill|leave|reduce to a simmer)\b/i

export function extractTaskDuration(text, experience = 'standard') {
  const normal = text
    .toLowerCase()
    .replace(/\b(?:a|an|another)\s+(minute|hour|second)\b/g, '1 $1')
  const range = normal.match(
    /(\d+(?:\.\d+)?)\s*(?:-|–|to|or)\s*(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)\b/,
  )
  if (range) {
    const factor = /^h/.test(range[3]) ? 3600 : /^s/.test(range[3]) ? 1 : 60
    return {
      seconds: Number(range[2]) * factor,
      minSeconds: Number(range[1]) * factor,
      status: 'source-range',
      label: range[0],
    }
  }
  const minutes = timeInMinutes(normal)
  if (minutes !== null)
    return {
      seconds: minutes * 60,
      status: 'source',
      label: `${minutes} min from source`,
    }
  const factor =
    experience === 'beginner' ? 1.4 : experience === 'confident' ? 0.8 : 1
  const seconds = /\bpreheat\b/i.test(text)
    ? 300
    : prepAction.test(text) || prepPattern.test(text)
      ? 120
      : 60
  return {
    seconds: Math.round(seconds * factor),
    status: 'estimate',
    label: 'Generic planning estimate · adjust to your kitchen',
  }
}

function ingredientRefs(text, ingredients) {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .split(/\s+/)
    .map((word) => word.replace(/s$/, ''))
  return ingredients
    .filter((ingredient) => {
      const meaningful = ingredient.productName
        .toLowerCase()
        .split(/\s+/)
        .filter(
          (word) =>
            word.length > 2 &&
            !/^(?:fresh|large|small|medium|cooked|frozen|ground|whole|of|and|or)$/.test(
              word,
            ),
        )
      return (
        meaningful.length &&
        meaningful.every((word) => words.includes(word.replace(/s$/, '')))
      )
    })
    .map((ingredient) => ingredient.ingredientId)
}

function equipmentFor(text, active) {
  const found = [
    ...text
      .toLowerCase()
      .matchAll(
        /\b(oven|wok|pan|saucepan|bowl|tray|knife|board|grill|microwave)\b/g,
      ),
  ].map((match) => (match[1] === 'saucepan' ? 'pan' : match[1]))
  if (!found.length && /\b(?:bake|roast|preheat)\b/i.test(text))
    found.push('oven')
  // Unknown cooking equipment uses one conservative shared lane.
  if (!found.length && /\b(?:fry|simmer|boil|cook|heat)\b/i.test(text))
    found.push('cookware')
  return {
    equipment: [...new Set(found)],
    resources: [...new Set([...(active ? ['person'] : []), ...found])],
  }
}

export function compileCookingPlan(card, preferences = {}) {
  if (card.recipeCardStatus !== 'VALIDATED')
    throw new Error('Approve the canonical recipe before compiling Chef Mode.')
  const prefs = {
    preparation: 'everything-first',
    order: 'vegetables-first',
    experience: 'standard',
    ...preferences,
  }
  const ingredients = allIngredients(card)
  const rawIngredients = ingredients.filter(
    (ingredient) =>
      rawRisk.test(ingredient.productName) &&
      !prepared.test(ingredient.rawLine),
  )
  const tasks = []
  const diagnostics = []
  const prepTasks = []
  for (const ingredient of ingredients) {
    if (!prepPattern.test(ingredient.rawLine)) continue
    if (
      card.steps.some(
        (step) =>
          prepAction.test(step.instruction) &&
          ingredientRefs(step.instruction, [ingredient]).length,
      )
    )
      continue
    const highRisk = rawIngredients.includes(ingredient)
    const task = {
      taskId: `prep-${ingredient.ingredientId}`,
      phase: 'Preparation',
      actionType: 'preparation',
      instruction: `Prepare: ${ingredient.rawLine}`,
      ingredientRefs: [ingredient.ingredientId],
      quantities: [
        {
          ingredientId: ingredient.ingredientId,
          quantity: ingredient.quantity,
          rawLine: ingredient.rawLine,
        },
      ],
      recipeStepRefs: [],
      sourceRefs: ingredient.sourceRefs,
      duration: extractTaskDuration('chop', prefs.experience),
      active: true,
      userPresence: true,
      equipment: ['board', 'knife'],
      resources: ['person', 'board', 'knife'],
      dependencies: [],
      requiresConfirmation: true,
      safetyFlags: highRisk ? ['raw-food-handling'] : [],
      originalOrder: -1,
      provenance: 'ingredient-preparation',
    }
    prepTasks.push(task)
    if (highRisk)
      prepTasks.push({
        ...task,
        taskId: `clean-${ingredient.ingredientId}`,
        actionType: 'safety-check',
        instruction: SAFETY_POLICY.hygieneMessage,
        ingredientRefs: [],
        quantities: [],
        duration: {
          seconds: 60,
          status: 'estimate',
          label: 'Cleaning estimate',
        },
        dependencies: [task.taskId],
        sourceRefs: [],
        safetyFlags: ['cross-contamination-check'],
        provenance: 'safety-policy',
        policy: SAFETY_POLICY.version,
      })
  }
  // Preferred order changes only ingredient preparation. Source method remains
  // intact. Every raw preparation is followed by an unskippable hygiene check.
  const rawIds = new Set(
    rawIngredients.map((ingredient) => ingredient.ingredientId),
  )
  const rank = (task) =>
    task.ingredientRefs.some((id) => rawIds.has(id)) ||
    task.taskId.startsWith('clean-')
      ? 1
      : 0
  if (prefs.preparation === 'my-order')
    prepTasks.sort(
      (a, b) => (rank(a) - rank(b)) * (prefs.order === 'meat-first' ? -1 : 1),
    )
  prepTasks.forEach((task, index) => {
    if (index && !task.dependencies.includes(prepTasks[index - 1].taskId))
      task.dependencies.push(prepTasks[index - 1].taskId)
    tasks.push({ ...task, originalOrder: index - prepTasks.length })
  })
  const lastPrep = prepTasks.at(-1)?.taskId
  let previousMethod = null
  let pendingPreheat = null
  let insertedDoneness = false
  card.steps.forEach((step, index) => {
    const refs = ingredientRefs(step.instruction, ingredients)
    const phase = prepAction.test(step.instruction)
      ? 'Preparation'
      : finishAction.test(step.instruction)
        ? 'Finish & serve'
        : 'Cooking'
    const actionType = /^preheat\b/i.test(step.instruction)
      ? 'preheat'
      : phase === 'Preparation'
        ? 'preparation'
        : phase === 'Finish & serve'
          ? 'finish'
          : 'cooking'
    const conditional =
      /\b(?:if|otherwise|alternatively|while|meanwhile)\b/i.test(
        step.instruction,
      )
    const active =
      !passiveAction.test(step.instruction) ||
      /\b(?:add|stir|mix|pour|turn|toss)\b/i.test(step.instruction)
    const equipment = equipmentFor(step.instruction, active)
    const deps = []
    // Preheating can overlap preparation. No other recipe reordering is guessed.
    if (
      lastPrep &&
      !(actionType === 'preheat' && prefs.preparation === 'smart')
    )
      deps.push(lastPrep)
    if (previousMethod) deps.push(previousMethod)
    if (
      pendingPreheat &&
      (equipment.equipment.includes('oven') || actionType === 'finish')
    )
      deps.push(pendingPreheat)
    if (
      !insertedDoneness &&
      rawIngredients.length &&
      phase === 'Finish & serve'
    ) {
      const checkId = 'safety-doneness'
      tasks.push({
        taskId: checkId,
        phase: 'Cooking',
        actionType: 'safety-check',
        instruction: SAFETY_POLICY.donenessMessage,
        ingredientRefs: rawIngredients.map(
          (ingredient) => ingredient.ingredientId,
        ),
        quantities: [],
        recipeStepRefs: [],
        sourceRefs: [],
        duration: {
          seconds: 60,
          status: 'estimate',
          label: 'Check estimate; confirm actual doneness',
        },
        active: true,
        userPresence: true,
        equipment: [],
        resources: ['person'],
        dependencies: [...new Set(deps)],
        requiresConfirmation: true,
        safetyFlags: ['safe-doneness-check'],
        originalOrder: index - 0.5,
        provenance: 'safety-policy',
        policy: SAFETY_POLICY.version,
      })
      deps.push(checkId)
      insertedDoneness = true
    }
    const task = {
      taskId: `task-${step.stepId}`,
      phase,
      actionType,
      instruction: step.instruction,
      ingredientRefs: refs,
      quantities: ingredients
        .filter((ingredient) => refs.includes(ingredient.ingredientId))
        .map((ingredient) => ({
          ingredientId: ingredient.ingredientId,
          quantity: ingredient.quantity,
          rawLine: ingredient.rawLine,
        })),
      recipeStepRefs: [step.stepId],
      sourceRefs: step.sourceRefs,
      duration: extractTaskDuration(step.instruction, prefs.experience),
      active,
      userPresence: active,
      ...equipment,
      dependencies: [...new Set(deps)],
      requiresConfirmation: true,
      safetyFlags: /\b(?:hot oil|boiling|oven|grill)\b/i.test(step.instruction)
        ? ['hot-equipment-check']
        : [],
      heat:
        step.instruction.match(
          /\b\d+\s*°\s*[CF](?:\s*(?:\/|fan|gas)\s*[^.,;]*)?|\b(?:low|medium|high)(?:[- ](?:low|medium|high))? heat\b/gi,
        ) || [],
      originalOrder: index,
      provenance: 'recipe-step',
      conservative: conditional,
    }
    tasks.push(task)
    if (actionType === 'preheat' && prefs.preparation === 'smart')
      pendingPreheat = task.taskId
    else previousMethod = task.taskId
    if (phase === 'Preparation' && refs.some((id) => rawIds.has(id))) {
      task.safetyFlags.push('raw-food-handling')
      const cleanId = `clean-${task.taskId}`
      tasks.push({
        taskId: cleanId,
        phase: 'Preparation',
        actionType: 'safety-check',
        instruction: SAFETY_POLICY.hygieneMessage,
        ingredientRefs: [],
        quantities: [],
        recipeStepRefs: [step.stepId],
        sourceRefs: [],
        duration: {
          seconds: 60,
          status: 'estimate',
          label: 'Cleaning estimate',
        },
        active: true,
        userPresence: true,
        equipment: ['board', 'knife'],
        resources: ['person', 'board', 'knife'],
        dependencies: [task.taskId],
        requiresConfirmation: true,
        safetyFlags: ['cross-contamination-check'],
        originalOrder: index + 0.25,
        provenance: 'safety-policy',
        policy: SAFETY_POLICY.version,
      })
      previousMethod = cleanId
    }
    if (conditional)
      diagnostics.push({
        code: 'source-order-retained',
        taskId: task.taskId,
        message:
          'Conditional or parallel wording requires review; original method order retained.',
      })
  })
  if (rawIngredients.length && !insertedDoneness)
    tasks.push({
      taskId: 'safety-doneness',
      phase: 'Finish & serve',
      actionType: 'safety-check',
      instruction: SAFETY_POLICY.donenessMessage,
      ingredientRefs: rawIngredients.map(
        (ingredient) => ingredient.ingredientId,
      ),
      quantities: [],
      recipeStepRefs: [],
      sourceRefs: [],
      duration: {
        seconds: 60,
        status: 'estimate',
        label: 'Check estimate; confirm actual doneness',
      },
      active: true,
      userPresence: true,
      equipment: [],
      resources: ['person'],
      dependencies: previousMethod
        ? [previousMethod]
        : lastPrep
          ? [lastPrep]
          : [],
      requiresConfirmation: true,
      safetyFlags: ['safe-doneness-check'],
      originalOrder: card.steps.length,
      provenance: 'safety-policy',
      policy: SAFETY_POLICY.version,
    })
  if (tasks.some((task) => task.duration.status === 'estimate'))
    diagnostics.push({
      code: 'estimated-timings',
      message:
        'Missing timings use adjustable generic estimates, not vetted personalised cooking speeds.',
    })
  if (!rawIngredients.length)
    diagnostics.push({
      code: 'safety-review',
      message:
        'Automated hazard recognition is limited. Review recipe/packet safety guidance and allergens; absence of flags is not proof of safety.',
    })
  return {
    planId: `plan-${card.id}-${card.revision}-${contentHash(JSON.stringify(prefs))}`,
    schemaVersion: 1,
    recipeId: card.id,
    recipeRevision: card.revision,
    title: card.title,
    preferences: prefs,
    tasks,
    diagnostics,
    safetyPolicy: SAFETY_POLICY,
    resourceCapacities: {
      person: 1,
      oven: 1,
      pan: 1,
      cookware: 1,
      board: 1,
      knife: 1,
      bowl: 1,
    },
    sourceStepOrder: card.steps.map((step) => step.stepId),
  }
}
