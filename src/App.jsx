import { useEffect } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import BottomNav from './components/BottomNav'
import AddRecipe from './pages/AddRecipe'
import Planner from './pages/Planner'
import RecipeDetail from './pages/RecipeDetail'
import Recipes from './pages/Recipes'
import Shopping from './pages/Shopping'

function ScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window.scrollTo === 'function') {
      window.scrollTo({ left: 0, top: 0, behavior: 'auto' })
      return
    }

    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [location.pathname])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen bg-[#FAF8F3] px-4 pb-24 pt-8 text-stone-900">
        <main className="mx-auto max-w-[430px]">
          <Routes>
            <Route path="/" element={<Navigate to="/planner" replace />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="/recipes/add" element={<AddRecipe />} />
            <Route path="/recipes/:recipeKey/edit" element={<AddRecipe />} />
            <Route path="/recipes/:recipeKey" element={<RecipeDetail />} />
            <Route path="/shopping" element={<Shopping />} />
          </Routes>
        </main>

        <BottomNav />
      </div>
    </BrowserRouter>
  )
}

export default App
