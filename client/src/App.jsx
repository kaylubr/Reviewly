import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import ModuleCreate from './pages/ModuleCreate'
import ModuleDetail from './pages/ModuleDetail'
import Review from './pages/Review'
import Tree from './pages/Tree'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'

function AppLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const isPublic  = ['/', '/auth'].includes(location.pathname)
  const isReview  = location.pathname.startsWith('/review/')

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-tree">
          <div className="loading-icon" />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {user && !isPublic && !isReview && <Navbar />}
      <main className={`main ${user && !isPublic && !isReview ? 'with-sidebar' : ''}`}>
        <Routes>
          <Route path="/"                    element={!user ? <Landing />      : <Navigate to="/dashboard" />} />
          <Route path="/auth"                element={!user ? <Auth />          : <Navigate to="/dashboard" />} />
          <Route path="/dashboard"           element={user  ? <Dashboard />    : <Navigate to="/auth" />} />
          <Route path="/modules/create"      element={user  ? <ModuleCreate /> : <Navigate to="/auth" />} />
          <Route path="/modules/:id"         element={user  ? <ModuleDetail /> : <Navigate to="/auth" />} />
          <Route path="/review/:moduleId/:mode" element={user ? <Review />     : <Navigate to="/auth" />} />
          <Route path="/tree"                element={user  ? <Tree />         : <Navigate to="/auth" />} />
          <Route path="/analytics"           element={user  ? <Analytics />    : <Navigate to="/auth" />} />
          <Route path="/profile"             element={user  ? <Profile />      : <Navigate to="/auth" />} />
          <Route path="*"                    element={<Navigate to="/" />} />
        </Routes>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            color: 'var(--ink)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
          },
        }}
      />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}