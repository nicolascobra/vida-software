import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Exercicios from './pages/Exercicios'
import ExerciciosCompact from './pages/ExerciciosCompact'
import Financas from './pages/Financas'

// PrivateRoute é um "segurança da porta":
// se o usuário não estiver logado, manda de volta pro login.
function PrivateRoute({ children }) {
  const userId = localStorage.getItem('user_id')
  return userId ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard"   element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/exercicios"         element={<PrivateRoute><Exercicios /></PrivateRoute>} />
        <Route path="/exercicios-compact" element={<PrivateRoute><ExerciciosCompact /></PrivateRoute>} />
        <Route path="/financas"    element={<PrivateRoute><Financas /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
