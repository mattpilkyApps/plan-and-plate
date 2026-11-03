import { useState } from 'react'
import { Download, FilePlus2, ShieldCheck, Trash2 } from 'lucide-react'
import {
  createIssue,
  exportIssue,
  ISSUE_STATES,
} from '../../domain/lab/issues.js'
import { downloadJson } from '../storage.js'
import Dialog from './Dialog.jsx'

export function IssueReporter({ snapshot, onSave, onClose, notify }) {
  const [details, setDetails] = useState({
    component: 'Recipe',
    severity: 'medium',
    happened: '',
    expected: '',
    attachments: [],
  })
  async function attach(event) {
    const file = event.target.files[0]
    if (!file) return
    if (
      !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
      file.size > 1500000
    ) {
      notify('Choose a PNG, JPEG or WebP screenshot under 1.5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () =>
      setDetails((current) => ({
        ...current,
        attachments: [
          { name: file.name, type: file.type, dataUrl: reader.result },
        ],
      }))
    reader.onerror = () => notify('The image could not be read.')
    reader.readAsDataURL(file)
  }
  return (
    <Dialog
      title="Report an issue"
      eyebrow="A reproducible snapshot, ready for the next fix"
      onClose={onClose}
    >
      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault()
          onSave(
            createIssue(snapshot, {
              ...details,
              device: {
                userAgent: navigator.userAgent,
                viewport: `${window.innerWidth}×${window.innerHeight}`,
              },
            }),
          )
          onClose()
        }}
      >
        <p className="notice">
          <ShieldCheck size={18} />
          The recipe, diagnostics and current simulation are attached locally.
          You choose what to include before any export. Nothing is sent
          automatically.
        </p>
        <div className="form-row">
          <label className="field">
            Area
            <select
              value={details.component}
              onChange={(event) =>
                setDetails({ ...details, component: event.target.value })
              }
            >
              {['Recipe', 'Steps', 'Chef Timing', 'Shopping', 'UI'].map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </label>
          <label className="field">
            Severity
            <select
              value={details.severity}
              onChange={(event) =>
                setDetails({ ...details, severity: event.target.value })
              }
            >
              {['low', 'medium', 'high', 'critical'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          What happened?
          <textarea
            required
            rows={3}
            value={details.happened}
            onChange={(event) =>
              setDetails({ ...details, happened: event.target.value })
            }
            placeholder="The second ingredient disappeared…"
          />
        </label>
        <label className="field">
          What should have happened?
          <textarea
            rows={2}
            value={details.expected}
            onChange={(event) =>
              setDetails({ ...details, expected: event.target.value })
            }
          />
        </label>
        <label className="field">
          Screenshot (optional, stays on this device)
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={attach}
          />
        </label>
        {details.attachments.length > 0 && (
          <p className="helper">Attached: {details.attachments[0].name}</p>
        )}
        <button className="primary-button" type="submit">
          <FilePlus2 size={17} />
          Save issue locally
        </button>
      </form>
    </Dialog>
  )
}

export function IssueExport({ issue, onClose }) {
  const [options, setOptions] = useState({
    includeRecipe: false,
    includeDevice: false,
    includeEvidence: false,
  })
  const output = exportIssue(issue, options)
  return (
    <Dialog title="Review this export" eyebrow={issue.id} onClose={onClose}>
      <p className="helper">
        The default contains diagnostics counts and codes. Your written issue
        description is included; check it for personal details. Full
        reproduction data may contain private or copyrighted recipe text.
      </p>
      <div className="form-stack export-options">
        {[
          [
            'includeRecipe',
            'Include recipe text, outputs, timings and shopping traces',
          ],
          ['includeDevice', 'Include browser and screen details'],
          ['includeEvidence', 'Include attached screenshot'],
        ].map(([key, label]) => (
          <label className="checkbox-label" key={key}>
            <input
              type="checkbox"
              checked={options[key]}
              onChange={(event) =>
                setOptions({ ...options, [key]: event.target.checked })
              }
            />
            {label}
          </label>
        ))}
      </div>
      <details>
        <summary>Inspect exact JSON before sharing</summary>
        <pre className="json-view">{JSON.stringify(output, null, 2)}</pre>
      </details>
      <button
        className="primary-button"
        onClick={() => downloadJson(output, issue.id + '.json')}
      >
        <Download size={17} />
        Download reviewed issue pack
      </button>
    </Dialog>
  )
}

export default function Issues({
  issues,
  onChange,
  onReport,
  savedCases,
  results,
  notify,
}) {
  const [exporting, setExporting] = useState(null)
  function status(issue, value) {
    if (
      value === 'REGRESSION LOCKED' &&
      !savedCases.some(
        (entry) =>
          entry.id === issue.regressionCaseId &&
          results?.results.some(
            (result) => result.id === entry.id && result.passed,
          ),
      )
    ) {
      notify(
        'Link a reviewed local case and pass its regression run before locking.',
      )
      return
    }
    onChange(
      issues.map((entry) =>
        entry.id === issue.id ? { ...entry, status: value } : entry,
      ),
    )
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">Keep every fix reproducible</p>
          <h1>Issue notebook</h1>
          <p>
            Snapshots live on this device. Export a reviewed report when you’re
            ready to debug it.
          </p>
        </div>
        <button className="primary-button" onClick={onReport}>
          <FilePlus2 size={17} />
          Report issue
        </button>
      </div>
      {!issues.length ? (
        <div className="empty-card">
          <ShieldCheck size={32} />
          <h2>A clean notebook</h2>
          <p>
            Use Report issue from any screen. The current recipe and engine
            state come with it.
          </p>
        </div>
      ) : (
        <div className="issue-grid">
          {issues.map((issue) => (
            <article className="panel" key={issue.id}>
              <div className="section-heading">
                <span
                  className={
                    'badge ' +
                    (issue.details.severity === 'critical' ? 'danger' : 'warm')
                  }
                >
                  {issue.details.severity} · {issue.details.component}
                </span>
                <button
                  className="icon-button"
                  aria-label={`Delete ${issue.id}`}
                  onClick={() =>
                    onChange(issues.filter((entry) => entry.id !== issue.id))
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3>{issue.details.happened}</h3>
              <p className="helper">
                {issue.details.expected || 'Expected behaviour not specified.'}
              </p>
              <p className="mono helper">{issue.id}</p>
              <div className="form-row">
                <label className="field">
                  Workflow status
                  <select
                    value={issue.status}
                    onChange={(event) => status(issue, event.target.value)}
                  >
                    {ISSUE_STATES.map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Regression case
                  <select
                    value={issue.regressionCaseId || ''}
                    onChange={(event) =>
                      onChange(
                        issues.map((entry) =>
                          entry.id === issue.id
                            ? { ...entry, regressionCaseId: event.target.value }
                            : entry,
                        ),
                      )
                    }
                  >
                    <option value="">Not linked yet</option>
                    {savedCases.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.id}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                className="secondary-button"
                onClick={() => setExporting(issue)}
              >
                <Download size={16} />
                Review & export
              </button>
            </article>
          ))}
        </div>
      )}
      {exporting && (
        <IssueExport issue={exporting} onClose={() => setExporting(null)} />
      )}
    </>
  )
}
