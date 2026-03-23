import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Exercicios from './pages/ExerciciosCompact'
import Financas from './pages/Financas'
import Alimentacao from './pages/Alimentacao'

// Rotas que mostram o topbar compartilhado
const APP_ROUTES = [
  { path: '/exercicios',  label: 'Exercícios',  pillColor: '#0a0a0a' },
  { path: '/financas',    label: 'Financeiro',   pillColor: '#004444' },
  { path: '/alimentacao', label: 'Alimentação',  pillColor: '#354f36' },
]
const ROUTE_ORDER = Object.fromEntries(APP_ROUTES.map((r, i) => [r.path, i]))

function PrivateRoute({ children }) {
  const userId = localStorage.getItem('user_id')
  return userId ? children : <Navigate to="/login" replace />
}

// ─── Topbar compartilhado ─────────────────────────────────────────────────────

function SharedTopbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const userId   = localStorage.getItem('user_id')

  const isAppPage = APP_ROUTES.some(r => r.path === location.pathname)
  if (!isAppPage) return null

  function handleNav(item) {
    if (location.pathname === item.path) return
    const fromIdx = ROUTE_ORDER[location.pathname] ?? 0
    const toIdx   = ROUTE_ORDER[item.path] ?? 0
    navigate(item.path, { state: { dir: toIdx > fromIdx ? 1 : -1 } })
  }

  function logout() {
    localStorage.removeItem('user_id')
    navigate('/login')
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid rgba(0,0,0,0.08)',
      padding: '0 20px', height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ maxWidth: 1000, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Brand */}
        <span style={{
          fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700,
          color: '#0a0a0a', letterSpacing: '-0.02em', flexShrink: 0,
        }}>vida</span>

        {/* Nav pills com indicador deslizante via layoutId */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2,
          padding: '3px', borderRadius: 9,
          background: 'rgba(0,0,0,0.04)',
        }}>
          {APP_ROUTES.map(item => {
            const active = location.pathname === item.path
            return (
              <div key={item.path} style={{ position: 'relative' }}>
                {active && (
                  <motion.div
                    layoutId="nav-pill-bg"
                    animate={{ backgroundColor: item.pillColor }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                    style={{ position: 'absolute', inset: 0, borderRadius: 7 }}
                  />
                )}
                <motion.button
                  onClick={() => handleNav(item)}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 460, damping: 28 }}
                  style={{
                    position: 'relative', zIndex: 1,
                    background: 'transparent', border: 'none', borderRadius: 7,
                    padding: '6px 16px', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
                    color: active ? '#fff' : '#525252',
                    transition: 'color 0.22s ease',
                  }}
                >{item.label}</motion.button>
              </div>
            )
          })}
        </div>

        {/* User + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#a3a3a3' }}>
            {userId?.charAt(0).toUpperCase() + userId?.slice(1)}
          </span>
          <button onClick={logout} style={{
            fontSize: 12, padding: '5px 10px', cursor: 'pointer', borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.18)', backgroundColor: 'rgba(255,255,255,0.40)',
            color: '#404040', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          }}>Sair</button>
        </div>
      </div>
    </div>
  )
}

// ─── Conteúdo com transição de página ────────────────────────────────────────
// AnimatePresence envolve Routes (não um motion.div sobre Routes).
// Cada página tem seu próprio motion wrapper com exit — assim o
// location.key garante que AnimatePresence detecte a troca corretamente.

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.key}>
        <Route path="/"           element={<Navigate to="/login" replace />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/dashboard"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/exercicios"  element={<PrivateRoute><Exercicios /></PrivateRoute>} />
        <Route path="/financas"    element={<PrivateRoute><Financas /></PrivateRoute>} />
        <Route path="/alimentacao" element={<PrivateRoute><Alimentacao /></PrivateRoute>} />
      </Routes>
    </AnimatePresence>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <BrowserRouter>
      <SharedTopbar />
      <AnimatedRoutes />
    </BrowserRouter>
  )
}

export default App
