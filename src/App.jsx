import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Exercicios from './pages/Exercicios'
import Financas from './pages/Financas'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/exercicios" element={<Exercicios />} />
        <Route path="/financas" element={<Financas />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
