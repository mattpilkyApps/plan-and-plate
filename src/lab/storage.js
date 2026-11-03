export const LAB_STORAGE_KEY = 'plan-and-plate-lab-v1'
export function readLabState(storage = window.localStorage) {
  try {
    const value = JSON.parse(storage.getItem(LAB_STORAGE_KEY))
    return value?.schemaVersion === 1 ? value : null
  } catch { return null }
}

export function writeLabState(value, storage = window.localStorage) {
  try { storage.setItem(LAB_STORAGE_KEY, JSON.stringify({ ...value, schemaVersion: 1 })); return true } catch { return false }
}

export function downloadJson(value, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
