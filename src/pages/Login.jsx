import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Usuários válidos: nome de usuário → senha
const USUARIOS = {
  nicolas: 'cobra',
  andre: 'andre',
}

function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ usuario: '', senha: '' })
  const [erro, setErro] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const senhaCorreta = USUARIOS[form.usuario.toLowerCase()]

    if (senhaCorreta && form.senha === senhaCorreta) {
      // Salva o usuário no navegador para saber quem está logado
      localStorage.setItem('user_id', form.usuario.toLowerCase())
      navigate('/dashboard')
    } else {
      setErro('Usuário ou senha incorretos')
    }
  }

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'sans-serif',
    }}>
      <div style={{
        width: 340, padding: 32, backgroundColor: '#fff',
        border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: 8, fontSize: 22 }}>vtr Dashboard</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
          Entre com seu usuário e senha
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 600 }}>
              Usuário
            </label>
            <input
              type="text"
              value={form.usuario}
              onChange={e => setForm({ ...form, usuario: e.target.value })}
              placeholder="nicolas ou andre"
              required
              style={{
                width: '100%', padding: 10, boxSizing: 'border-box',
                borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14,
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 600 }}>
              Senha
            </label>
            <input
              type="password"
              value={form.senha}
              onChange={e => setForm({ ...form, senha: e.target.value })}
              required
              style={{
                width: '100%', padding: 10, boxSizing: 'border-box',
                borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14,
              }}
            />
          </div>

          {erro && (
            <p style={{ color: '#dc2626', fontSize: 13, margin: '0 0 12px' }}>{erro}</p>
          )}

          <button
            type="submit"
            style={{
              width: '100%', padding: 11, cursor: 'pointer', borderRadius: 6,
              backgroundColor: '#1d4ed8', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600,
            }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
