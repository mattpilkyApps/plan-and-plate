import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, Link } from 'react-router-dom'
import { Settings, Leaf } from 'lucide-react'
import BottomNav from './components/BottomNav'
import Brand from './components/Brand'
import BottomSheet from './components/ui/BottomSheet'
import Pressable from './components/ui/Pressable'
import StatusToast from './components/ui/StatusToast'
import { getPlannerSettings, savePlannerSettings } from './utils/localStorage'
import { formatDateKey, getCurrentWeekKey, getWeekStartDate, parseDateKey } from './utils/plannerWeeks'
import Planner from './pages/Planner'
const Recipes = lazy(() => import('./pages/Recipes'))
const RecipeDetail = lazy(() => import('./pages/RecipeDetail'))
const AddRecipe = lazy(() => import('./pages/AddRecipe'))
const Shopping = lazy(() => import('./pages/Shopping'))

function AppShell() {
  const location = useLocation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [weekStart, setWeekStart] = useState(() => getPlannerSettings().weekStartDay)
  const [revision, setRevision] = useState(0)
  const [storageError, setStorageError] = useState(false)
  useEffect(() => { window.scrollTo({ left: 0, top: 0, behavior: 'instant' }) }, [location.pathname])
  useEffect(() => {
    function showError() { setStorageError(true) }
    window.addEventListener('plan-and-plate-storage-error', showError)
    return () => window.removeEventListener('plan-and-plate-storage-error', showError)
  }, [])
  function savePreferences() {
    const current = getPlannerSettings()
    const selected = current.selectedWeekStartDate || getCurrentWeekKey(current.weekStartDay)
    const saved = savePlannerSettings({ weekStartDay: weekStart, selectedWeekStartDate: formatDateKey(getWeekStartDate(parseDateKey(selected), weekStart)) })
    if (saved.weekStartDay !== weekStart) return
    setRevision((value) => value + 1)
    setSettingsOpen(false)
  }
  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="app-header"><Link to="/planner" aria-label="Plan & Plate home"><Brand /></Link><span className="header-note">Good food. Less stress. A happier home.</span><button className="icon-button" aria-label="App settings" onClick={() => { setWeekStart(getPlannerSettings().weekStartDay); setSettingsOpen(true) }}><Settings size={21} strokeWidth={1.6} /></button></header>
    <main id="main-content" className="app-main" tabIndex={-1}>
      <Suspense fallback={<div className="empty-panel" role="status"><Leaf size={25} className="mx-auto mb-3" />Getting things ready…</div>}>
        <div className="page-motion" key={`${location.pathname}-${revision}`}><Routes>
          <Route path="/" element={<Navigate to="/planner" replace />} />
          <Route path="/planner" element={<Planner />} /><Route path="/recipes" element={<Recipes />} />
          <Route path="/recipes/add" element={<AddRecipe />} /><Route path="/recipes/:recipeKey/edit" element={<AddRecipe />} />
          <Route path="/recipes/:recipeKey" element={<RecipeDetail />} /><Route path="/shopping" element={<Shopping />} />
          <Route path="*" element={<div className="empty-panel"><h1>Let’s get you back to the table.</h1><Pressable to="/planner" variant="primary" className="mt-5">Open planner</Pressable></div>} />
        </Routes></div>
      </Suspense>
    </main>
    <BottomNav />
    <StatusToast show={storageError} tone="danger" title="Your changes couldn’t be saved" message="Browser storage may be full or unavailable. Free some space and try again." actionLabel="Dismiss" onAction={() => setStorageError(false)} />
    {settingsOpen && <BottomSheet title="Make the week yours" eyebrow="Preferences" onClose={() => setSettingsOpen(false)}>
      <div className="form-stack"><label className="field">Your week starts on<select value={weekStart} onChange={(event) => setWeekStart(event.target.value)}>{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day) => <option key={day} value={day.slice(0,3).toUpperCase()}>{day}</option>)}</select></label>
      <p className="helper">Plan around your shopping day. Your meals keep their original dates when you change this.</p>
      <Pressable variant="primary" onClick={savePreferences}>Save preferences</Pressable>
      <div className="border-t pt-5" style={{ borderColor: 'var(--line)' }}><p className="eyebrow">Plan & Plate · V2 preview</p><p className="helper">Your recipes and plans are saved in this browser. This preview has its own data, separate from the live app. For a home-screen shortcut on Android, use Chrome’s menu → Add to Home screen.</p></div></div>
    </BottomSheet>}
  </div>
}
export default function App() { return <BrowserRouter><AppShell /></BrowserRouter> }
