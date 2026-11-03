import test from 'node:test'
import assert from 'node:assert/strict'
import {
  engineScenarios,
  runEngineScenario,
} from '../src/domain/lab/scenarios.js'
for (const entry of engineScenarios)
  test('Browser/Node shared scenario: ' + entry.id, () => {
    const result = runEngineScenario(entry)
    assert.equal(
      result.passed,
      true,
      JSON.stringify(
        result.assertions.filter((assertion) => !assertion.passed),
      ),
    )
  })
