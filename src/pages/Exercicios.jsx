import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const CATEGORIAS = ['costas', 'triceps', 'biceps', 'perna', 'peito', 'ombro', 'cardio', 'full_body', 'outro']

const QUALIDADES = [
  { value: 'abaixo_esperado', label: 'Abaixo do esperado' },
  { value: 'medio', label: 'Médio' },
  { value: 'acima_esperado', label: 'Acima do esperado' },
]

const QUALIDADE_ESTILO = {
  acima_esperado: { bg: '#dcfce7', cor: '#166534' },
  medio:          { bg: '#fef9c3', cor: '#854d0e' },
  abaixo_esperado:{ bg: '#fee2e2', cor: '#991b1b' },
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function Exercicios() {
  const navigate = useNavigate()
  const userId = localStorage.getItem('user_id')

  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth()

  const [treinos, setTreinos] = useState([])
  const [diasOn, setDiasOn] = useState([])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    data: hoje.toISOString().split('T')[0],
    categoria: 'costas',
    qualidade: 'medio',
    calorias_gastas: '',
    observacoes: '',
  })

  useEffect(() => {
    carregarTreinos()
    carregarCalendario()
  }, [])

  async function carregarTreinos() {
    try {
      const res = await api.get(`/exercicio/treino/${userId}`)
      setTreinos(res.data)
    } catch {
      setErro('Não foi possível carregar os treinos. O backend está rodando?')
    }
  }

  async function carregarCalendario() {
    const inicio = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-01`
    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0).getDate()
    const fim = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
    try {
      const res = await api.get(`/exercicio/treino/${userId}/calendario`, {
        params: { data_inicio: inicio, data_fim: fim },
      })
      setDiasOn(res.data.dias_on)
    } catch {
      // calendário não é crítico, ignora silenciosamente
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    try {
      await api.post('/exercicio/treino', {
        user_id: userId,
        data: form.data,
        categoria: form.categoria,
        qualidade: form.qualidade,
        calorias_gastas: form.calorias_gastas ? parseFloat(form.calorias_gastas) : null,
        observacoes: form.observacoes || null,
      })
      await carregarTreinos()
      await carregarCalendario()
      setForm({ ...form, calorias_gastas: '', observacoes: '' })
    } catch {
      setErro('Erro ao salvar treino. Tente novamente.')
    }
    setLoading(false)
  }

  function logout() {
    localStorage.removeItem('user_id')
    navigate('/login')
  }

  // Monta o calendário do mês atual
  const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay()
  const totalDias = new Date(anoAtual, mesAtual + 1, 0).getDate()
  const diaHoje = hoje.getDate()

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Exercícios</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: '#6b7280' }}>Olá, <strong>{userId}</strong></span>
          <button
            onClick={logout}
            style={{ fontSize: 13, padding: '5px 12px', cursor: 'pointer', borderRadius: 6, border: '1px solid #d1d5db' }}
          >
            Sair
          </button>
        </div>
      </div>

      {/* Calendário ON/OFF */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, marginBottom: 10, color: '#374151' }}>
          {MESES[mesAtual]} {anoAtual}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#9ca3af', paddingBottom: 4 }}>
              {d}
            </div>
          ))}
          {/* Células vazias para alinhar o primeiro dia da semana */}
          {Array.from({ length: primeiroDiaSemana }).map((_, i) => <div key={`v${i}`} />)}
          {/* Dias do mês */}
          {Array.from({ length: totalDias }).map((_, i) => {
            const dia = i + 1
            const dataStr = `${anoAtual}-${String(mesAtual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
            const isOn = diasOn.includes(dataStr)
            const isHoje = dia === diaHoje
            return (
              <div
                key={dia}
                title={isOn ? 'Treinou' : 'Descanso'}
                style={{
                  textAlign: 'center', padding: '7px 0', borderRadius: 6, fontSize: 13,
                  backgroundColor: isOn ? '#22c55e' : '#f3f4f6',
                  color: isOn ? '#fff' : '#374151',
                  fontWeight: isHoje ? 700 : 400,
                  outline: isHoje ? '2px solid #1d4ed8' : 'none',
                  cursor: 'default',
                }}
              >
                {dia}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: '#6b7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#22c55e', borderRadius: 3 }} />
            Treinou
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 3 }} />
            Descanso
          </span>
        </div>
      </div>

      {/* Formulário */}
      <div style={{ backgroundColor: '#f9fafb', padding: 20, borderRadius: 10, marginBottom: 32, border: '1px solid #e5e7eb' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 15 }}>Registrar treino</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 600 }}>Data</label>
              <input
                type="date"
                value={form.data}
                onChange={e => setForm({ ...form, data: e.target.value })}
                required
                style={{ width: '100%', padding: 8, boxSizing: 'border-box', borderRadius: 6, border: '1px solid #d1d5db' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 600 }}>Categoria</label>
              <select
                value={form.categoria}
                onChange={e => setForm({ ...form, categoria: e.target.value })}
                style={{ width: '100%', padding: 8, boxSizing: 'border-box', borderRadius: 6, border: '1px solid #d1d5db' }}
              >
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 600 }}>Qualidade</label>
              <select
                value={form.qualidade}
                onChange={e => setForm({ ...form, qualidade: e.target.value })}
                style={{ width: '100%', padding: 8, boxSizing: 'border-box', borderRadius: 6, border: '1px solid #d1d5db' }}
              >
                {QUALIDADES.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 600 }}>
                Calorias gastas <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span>
              </label>
              <input
                type="number"
                value={form.calorias_gastas}
                onChange={e => setForm({ ...form, calorias_gastas: e.target.value })}
                placeholder="ex: 450"
                min="0"
                style={{ width: '100%', padding: 8, boxSizing: 'border-box', borderRadius: 6, border: '1px solid #d1d5db' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 600 }}>
              Observações <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span>
            </label>
            <input
              type="text"
              value={form.observacoes}
              onChange={e => setForm({ ...form, observacoes: e.target.value })}
              placeholder="ex: fiz supino pesado, senti dor no ombro"
              style={{ width: '100%', padding: 8, boxSizing: 'border-box', borderRadius: 6, border: '1px solid #d1d5db' }}
            />
          </div>
          {erro && <p style={{ color: '#dc2626', fontSize: 13, margin: '0 0 10px' }}>{erro}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '9px 24px', cursor: 'pointer', borderRadius: 6,
              backgroundColor: loading ? '#93c5fd' : '#1d4ed8', color: '#fff',
              border: 'none', fontSize: 14, fontWeight: 600,
            }}
          >
            {loading ? 'Salvando...' : 'Salvar treino'}
          </button>
        </form>
      </div>

      {/* Lista de treinos */}
      <div>
        <h2 style={{ fontSize: 15, marginBottom: 12 }}>
          Treinos registrados <span style={{ color: '#9ca3af', fontWeight: 400 }}>({treinos.length})</span>
        </h2>
        {treinos.length === 0 && (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>Nenhum treino registrado ainda.</p>
        )}
        {treinos.map(t => {
          const estilo = QUALIDADE_ESTILO[t.qualidade] || QUALIDADE_ESTILO.medio
          const qualidadeLabel = QUALIDADES.find(q => q.value === t.qualidade)?.label || t.qualidade
          return (
            <div
              key={t.id}
              style={{
                border: '1px solid #e5e7eb', borderRadius: 8, padding: 14,
                marginBottom: 8, backgroundColor: '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <strong style={{ fontSize: 15, textTransform: 'capitalize' }}>{t.categoria}</strong>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{t.data}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 12,
                    backgroundColor: estilo.bg, color: estilo.cor, fontWeight: 600,
                  }}>
                    {qualidadeLabel}
                  </span>
                  {t.calorias_gastas && (
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{t.calorias_gastas} kcal</span>
                  )}
                </div>
              </div>
              {t.observacoes && (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6b7280' }}>{t.observacoes}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Exercicios
