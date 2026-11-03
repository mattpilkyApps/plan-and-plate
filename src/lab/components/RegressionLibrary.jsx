import { useState } from 'react'
import { ArrowUpRight, Check, Download, Play, Trash2 } from 'lucide-react'
import { downloadJson } from '../storage.js'

export default function RegressionLibrary({
  cases,
  savedCases,
  results,
  onRun,
  onLoad,
  onDelete,
  onImport,
  onPromote,
}) {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(null)
  const filtered = cases.filter(
    (entry) =>
      (!query || entry.id.toLowerCase().includes(query.toLowerCase())) &&
      (filter !== 'failed' ||
        results?.results.find((result) => result.id === entry.id)?.passed ===
          false) &&
      (filter !== 'local' || savedCases.some((item) => item.id === entry.id)),
  )
  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">Known inputs. Explicit expectations.</p>
          <h1>Regression library</h1>
          <p>
            Real owner copies, existing parser cases and clearly labelled
            synthetic contracts.
          </p>
        </div>
        <button className="primary-button" onClick={onRun}>
          <Play size={17} />
          Run regression suite
        </button>
      </div>
      <div className="stats-grid">
        <div className="stat">
          <span>Total cases</span>
          <strong>{results?.total ?? cases.length}</strong>
        </div>
        <div className="stat">
          <span>Passed</span>
          <strong>{results?.passed ?? '—'}</strong>
        </div>
        <div className="stat">
          <span>Failed</span>
          <strong>{results?.failed ?? '—'}</strong>
        </div>
        <div className="stat">
          <span>New regressions</span>
          <strong>
            {results
              ? results.baselineAvailable
                ? results.regressions.length
                : 'No baseline'
              : '—'}
          </strong>
        </div>
      </div>
      <p className="notice">
        Case passes cover the assertions shown. Missing source facts are review
        notes, not automatic extraction failures. New regressions compare with
        your explicitly saved last-good run.
      </p>
      <div className="library-toolbar">
        <label className="field">
          <span className="sr-only">Find a test case</span>
          <input
            placeholder="Find a test case…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          aria-label="Filter cases"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All cases</option>
          <option value="failed">Failed only</option>
          <option value="local">My reviewed cases</option>
        </select>
        <label className="secondary-button file-button">
          Import issue / case
          <input
            type="file"
            accept="application/json,.json"
            onChange={onImport}
          />
        </label>
        {results && (
          <button
            className="secondary-button"
            disabled={results.failed > 0}
            onClick={onPromote}
          >
            <Check size={16} />
            Save last-good run
          </button>
        )}
      </div>
      <div className="case-list">
        {filtered.map((entry) => {
          const result = results?.results.find(
            (candidate) => candidate.id === entry.id,
          )
          return (
            <article className="case-row" key={entry.id}>
              <div className="case-title">
                <span
                  className={
                    'result-dot ' +
                    (result ? (result.passed ? 'pass' : 'fail') : '')
                  }
                />
                <div>
                  <h3>{entry.id}</h3>
                  <p>{entry.layout}</p>
                </div>
                <span className="badge">
                  {result ? (result.passed ? 'Pass' : 'Fail') : 'Not run'}
                </span>
              </div>
              <div className="case-actions">
                <button className="text-button" onClick={() => onLoad(entry)}>
                  Open input <ArrowUpRight size={15} />
                </button>
                <button
                  className="text-button"
                  onClick={() =>
                    setExpanded(expanded === entry.id ? null : entry.id)
                  }
                >
                  {expanded === entry.id
                    ? 'Hide comparison'
                    : 'Expected vs actual'}
                </button>
                {savedCases.some((item) => item.id === entry.id) && (
                  <>
                    <button
                      className="icon-button"
                      aria-label={`Export ${entry.id}`}
                      onClick={() =>
                        downloadJson(
                          {
                            format: 'plan-and-plate-lab-fixture',
                            schemaVersion: 1,
                            ...entry,
                          },
                          entry.id + '.json',
                        )
                      }
                    >
                      <Download size={16} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Delete ${entry.id}`}
                      onClick={() => onDelete(entry.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
              {expanded === entry.id && (
                <div className="case-details">
                  <p className="helper">
                    {entry.reason ||
                      entry.review ||
                      'Expected outputs retained from the existing fixture.'}
                  </p>
                  {result ? (
                    result.assertions.map((assertion) => (
                      <div
                        className={
                          'assertion ' +
                          (assertion.passed ? '' : 'assertion-fail')
                        }
                        key={assertion.field}
                      >
                        <strong>
                          {assertion.passed ? '✓' : '×'} {assertion.field}
                        </strong>
                        <div className="comparison">
                          <div>
                            <span>Expected</span>
                            <pre>
                              {JSON.stringify(assertion.expected, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <span>Actual</span>
                            <pre>
                              {JSON.stringify(assertion.actual, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <pre className="json-view">
                      {JSON.stringify(
                        { ...entry.expected, ...entry.canonicalExpected },
                        null,
                        2,
                      )}
                    </pre>
                  )}
                  {result?.previousOutput && (
                    <details>
                      <summary>Compare last-good output with this run</summary>
                      <div className="comparison">
                        <div>
                          <span>Last good</span>
                          <pre>
                            {JSON.stringify(result.previousOutput, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <span>Current output</span>
                          <pre>
                            {JSON.stringify(
                              result.card
                                ? {
                                    title: result.card.title,
                                    ingredients:
                                      result.card.ingredientGroups.flatMap(
                                        (group) =>
                                          group.items.map(
                                            (item) => item.rawLine,
                                          ),
                                      ),
                                    steps: result.card.steps.map(
                                      (step) => step.instruction,
                                    ),
                                  }
                                : null,
                              null,
                              2,
                            )}
                          </pre>
                        </div>
                      </div>
                    </details>
                  )}
                  <details>
                    <summary>Untouched source input</summary>
                    <pre className="raw-preview">
                      {(entry.clips || [entry.raw]).join(
                        '\n\n--- NEXT FRAGMENT ---\n\n',
                      )}
                    </pre>
                  </details>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </>
  )
}
