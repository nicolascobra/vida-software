import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DateRangeSlider from '../components/DateRangeSlider'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import api from '../services/api'

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIAS   = ['costas', 'triceps', 'biceps', 'perna', 'peito', 'ombro', 'cardio', 'full_body', 'outro']

const Q_SCORE      = { acima_esperado: 3, medio: 2, abaixo_esperado: 1 }
const MESES        = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const ORDEM_SEMANA = [1, 2, 3, 4, 5, 6, 0]
const NOME_SEMANA  = { 0:'Dom', 1:'Seg', 2:'Ter', 3:'Qua', 4:'Qui', 5:'Sex', 6:'Sáb' }

// ─── Tokens ───────────────────────────────────────────────────────────────────

const T = {
  bgGradient:  '#ffffff',
  glass:       'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.90)',
  blur:        'blur(28px) saturate(200%)',
  text:    '#0a0a0a',
  textSub: '#525252',
  textMut: '#a3a3a3',
  ink:   '#0a0a0a',
  inkMd: '#737373',
  inkLt: '#e5e5e5',
  qGreen:  '#16a34a',
  qYellow: '#ca8a04',
  qRed:    '#dc2626',
  calOn:   '#171717',
  calOff:  'rgba(0,0,0,0.04)',
  calMiss: '#d4d4d4',
  fontHead: "'Syne', sans-serif",
  fontBody: "'DM Sans', sans-serif",
}

// ─── Estilos base ─────────────────────────────────────────────────────────────

const card = {
  background: T.glass,
  backdropFilter: T.blur,
  WebkitBackdropFilter: T.blur,
  borderRadius: 14,
  padding: '18px 20px',
  border: `1px solid ${T.glassBorder}`,
  boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 0 rgba(255,255,255,0.95) inset, 0 0 0 0.5px rgba(255,255,255,0.6)',
}

const thinGlass = {
  background: 'rgba(255,255,255,0.26)',
  backdropFilter: 'blur(40px) saturate(220%)',
  WebkitBackdropFilter: 'blur(40px) saturate(220%)',
  borderRadius: 14,
  padding: '18px 20px',
  border: '1px solid rgba(255,255,255,0.94)',
  boxShadow: '0 2px 20px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,1) inset, 0 -1px 0 rgba(255,255,255,0.5) inset',
}

const heroCard = {
  background: 'rgba(10,10,10,0.90)',
  backdropFilter: 'blur(28px) saturate(200%)',
  WebkitBackdropFilter: 'blur(28px) saturate(200%)',
  borderRadius: 14,
  padding: '20px 22px',
  border: '1px solid rgba(255,255,255,0.09)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.28)',
}

const sectionLabel = {
  fontFamily: T.fontBody, fontSize: 10, fontWeight: 600,
  color: T.textMut, textTransform: 'uppercase',
  letterSpacing: '0.1em', marginBottom: 12, display: 'block',
}
const heroLabel  = { ...sectionLabel, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }
const fieldLabel = { fontFamily: T.fontBody, fontSize: 12, fontWeight: 500, color: T.textSub, display: 'block', marginBottom: 5 }
const inputSt    = {
  width: '100%', padding: '8px 11px', boxSizing: 'border-box',
  borderRadius: 7, border: '1px solid rgba(255,255,255,0.65)',
  background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)', color: T.text,
  fontSize: 13, fontFamily: T.fontBody, outline: 'none',
}

// ─── Framer Motion configs ────────────────────────────────────────────────────

const springSnappy = { type: 'spring', stiffness: 460, damping: 28 }
const springFluid  = { type: 'spring', stiffness: 280, damping: 32 }
const springModal  = { type: 'spring', stiffness: 360, damping: 28 }

// ─── Heatmap chip ─────────────────────────────────────────────────────────────

function heatColor(count, maxCount) {
  if (!maxCount) return { bg: '#f0f0f0', text: '#a3a3a3' }
  const n = count / maxCount
  const lightness = Math.round(92 - n * 83)
  return {
    bg: `hsl(0, 0%, ${lightness}%)`,
    text: lightness < 52 ? '#ffffff' : '#171717',
  }
}

// ─── Tooltips Recharts ────────────────────────────────────────────────────────

function CleanTooltip({ active, payload, label: lbl }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.95)',
      borderRadius: 10, padding: '8px 12px', fontSize: 12,
      fontFamily: T.fontBody, color: T.text, boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
    }}>
      <p style={{ margin: '0 0 4px', color: T.textMut, fontSize: 11 }}>{lbl}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: T.text }}>
          <span style={{ color: p.color || T.ink, marginRight: 4 }}>■</span>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

function ConsistenciaTooltip({ active, payload, label: lbl }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div style={{
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.95)',
      borderRadius: 10, padding: '8px 12px', fontSize: 12,
      fontFamily: T.fontBody, color: T.text, boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
    }}>
      <p style={{ margin: '0 0 4px', color: T.textMut, fontSize: 11 }}>{lbl}</p>
      <p style={{ margin: '2px 0', color: T.ink, fontWeight: 700 }}>{p.value}% consistência</p>
      <p style={{ margin: '2px 0', color: T.textMut, fontSize: 11 }}>{p.payload.treinados} de {p.payload.diasUteis} dias úteis</p>
    </div>
  )
}

// ─── ExpandBtn ────────────────────────────────────────────────────────────────

function ExpandBtn({ onClick, dark }) {
  return (
    <button onClick={onClick} title="Expandir" style={{
      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : T.inkLt}`,
      borderRadius: 6, width: 26, height: 26, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: dark ? 'rgba(255,255,255,0.45)' : T.textMut, fontSize: 12, flexShrink: 0,
    }}>⤢</button>
  )
}

// ─── ExpandModal ──────────────────────────────────────────────────────────────

function ExpandModal({ title, onClose, children, wide }) {
  return (
    <motion.div
      key="expand-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        backgroundColor: 'rgba(240,240,240,0.50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
      }}
    >
      <motion.div
        initial={{ y: 28, scale: 0.93, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 12, scale: 0.97, opacity: 0 }}
        transition={springModal}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          borderRadius: 18, border: '1px solid rgba(255,255,255,0.95)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 2px 0 rgba(255,255,255,1) inset',
          padding: '24px 28px', width: '100%', maxWidth: wide ? 920 : 760,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: T.fontHead, fontSize: 16, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em' }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.05)', border: `1px solid ${T.inkLt}`,
            borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.textMut, fontSize: 16, fontFamily: T.fontBody,
          }}>×</button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

// ─── DayDetailModal ───────────────────────────────────────────────────────────

function DayDetailModal({ dayDetail, onClose }) {
  const { dataStr, treinos } = dayDetail
  const [ano, mes, dia] = dataStr.split('-')
  const QUAL_LABEL = { acima_esperado: 'Acima do esperado', medio: 'Médio', abaixo_esperado: 'Abaixo do esperado' }
  const QUAL_COR   = { acima_esperado: T.qGreen, medio: T.qYellow, abaixo_esperado: T.qRed }

  return (
    <motion.div
      key="day-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        backgroundColor: 'rgba(240,240,240,0.50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
      }}
    >
      <motion.div
        initial={{ y: 28, scale: 0.93, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 12, scale: 0.97, opacity: 0 }}
        transition={springModal}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          borderRadius: 18, border: '1px solid rgba(255,255,255,0.95)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 2px 0 rgba(255,255,255,1) inset',
          padding: '28px 32px', width: '100%', maxWidth: 420,
        }}
      >
        <p style={{ fontSize: 11, color: T.textMut, fontFamily: T.fontBody, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Treino do dia</p>
        <h2 style={{ fontFamily: T.fontHead, fontSize: 28, fontWeight: 800, color: T.ink, margin: '0 0 20px', letterSpacing: '-0.03em' }}>{dia}/{mes}/{ano}</h2>

        {treinos.length === 0
          ? <p style={{ color: T.textMut, fontSize: 14, fontFamily: T.fontBody, margin: '0 0 20px' }}>Nenhum treino registrado neste dia.</p>
          : treinos.map(t => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={springSnappy}
                style={{
                  background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 10, padding: '12px 16px', marginBottom: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (t.calorias_gastas || t.observacoes) ? 6 : 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: T.fontBody, textTransform: 'capitalize' }}>{(Array.isArray(t.categoria) ? t.categoria.join(', ') : t.categoria).replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: QUAL_COR[t.qualidade], fontFamily: T.fontBody }}>{QUAL_LABEL[t.qualidade]}</span>
                </div>
                {t.calorias_gastas && <div style={{ fontSize: 12, color: T.textSub, fontFamily: T.fontBody }}>{t.calorias_gastas} kcal</div>}
                {t.observacoes    && <div style={{ fontSize: 12, color: T.textMut, fontFamily: T.fontBody, marginTop: 4, fontStyle: 'italic' }}>{t.observacoes}</div>}
              </motion.div>
            ))
        }

        <button onClick={onClose} style={{
          marginTop: 6, width: '100%', padding: '9px 0',
          borderRadius: 8, border: `1px solid ${T.inkLt}`,
          background: 'transparent', color: T.textSub,
          fontSize: 13, fontFamily: T.fontBody, cursor: 'pointer',
        }}>Fechar</button>
      </motion.div>
    </motion.div>
  )
}

// ─── ModalTreino ──────────────────────────────────────────────────────────────

function ModalTreino({ onClose, onSave, enviando }) {
  const hoje = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    data: hoje, categorias: [], qualidade: 'medio', calorias: '', observacoes: '',
  })

  const toggleCat = (cat) => setForm(prev => ({
    ...prev,
    categorias: prev.categorias.includes(cat)
      ? prev.categorias.filter(c => c !== cat)
      : [...prev.categorias, cat],
  }))

  return (
    <motion.div
      key="modal-treino-bg"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }} onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backdropFilter: 'blur(18px) saturate(160%)', WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        backgroundColor: 'rgba(240,240,240,0.50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
      }}
    >
      <motion.div
        initial={{ y: 28, scale: 0.93, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 12, scale: 0.97, opacity: 0 }} transition={springModal}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          borderRadius: 18, border: '1px solid rgba(255,255,255,0.95)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 2px 0 rgba(255,255,255,1) inset',
          padding: '28px 32px', width: '100%', maxWidth: 460,
          maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontFamily: T.fontHead, fontSize: 17, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em' }}>Novo treino</span>
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.05)', border: `1px solid ${T.inkLt}`,
            borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.textMut, fontSize: 16,
          }}>×</button>
        </div>

        <form onSubmit={e => { e.preventDefault(); if (form.categorias.length > 0) onSave(form) }}>
          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel}>Data</label>
            <input type="date" value={form.data}
              onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
              style={inputSt} required />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel}>Grupos musculares</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
              {CATEGORIAS.map(cat => {
                const active = form.categorias.includes(cat)
                return (
                  <button key={cat} type="button" onClick={() => toggleCat(cat)} style={{
                    padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                    fontFamily: T.fontBody, fontSize: 12, fontWeight: 600,
                    border: active ? 'none' : `1px solid ${T.inkLt}`,
                    background: active ? T.ink : 'rgba(255,255,255,0.45)',
                    color: active ? '#fff' : T.textSub,
                    textTransform: 'capitalize', transition: 'all 0.14s ease',
                  }}>{cat.replace('_', ' ')}</button>
                )
              })}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel}>Qualidade</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { key: 'abaixo_esperado', label: 'Abaixo', color: T.qRed    },
                { key: 'medio',           label: 'Médio',  color: T.qYellow },
                { key: 'acima_esperado',  label: 'Acima',  color: T.qGreen  },
              ].map(({ key, label, color }) => (
                <button key={key} type="button"
                  onClick={() => setForm(f => ({ ...f, qualidade: key }))}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 7, cursor: 'pointer',
                    fontFamily: T.fontBody, fontSize: 12, fontWeight: 600,
                    border: form.qualidade === key ? 'none' : `1px solid ${T.inkLt}`,
                    background: form.qualidade === key ? color : 'rgba(255,255,255,0.45)',
                    color: form.qualidade === key ? '#fff' : T.textSub,
                    transition: 'all 0.14s ease',
                  }}>{label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={fieldLabel}>Calorias gastas (opcional)</label>
            <input type="number" min="0" placeholder="ex: 350"
              value={form.calorias} onChange={e => setForm(f => ({ ...f, calorias: e.target.value }))}
              style={inputSt} />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={fieldLabel}>Observações (opcional)</label>
            <input type="text" placeholder="ex: foco em volume, PR no deadlift…"
              value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
              style={inputSt} />
          </div>

          <motion.button type="submit"
            disabled={enviando || form.categorias.length === 0}
            whileTap={{ scale: 0.97 }}
            style={{
              width: '100%', padding: '11px 0', border: 'none', borderRadius: 9,
              background: (enviando || form.categorias.length === 0) ? 'rgba(0,0,0,0.25)' : T.ink,
              color: '#fff', fontSize: 14, fontWeight: 700,
              fontFamily: T.fontBody, cursor: (enviando || form.categorias.length === 0) ? 'default' : 'pointer',
            }}
          >{enviando ? 'Salvando…' : 'Salvar treino'}</motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

function ExerciciosCompact() {
  const userId    = localStorage.getItem('user_id')
  const hoje     = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth()
  const diaHoje  = hoje.getDate()
  const hojeStr  = hoje.toISOString().split('T')[0]

  const [treinos,       setTreinos]       = useState([])
  const [pesoHistorico, setPesoHistorico] = useState([])
  const [mes,           setMes]           = useState(hoje.getMonth() + 1)
  const [ano,           setAno]           = useState(hoje.getFullYear())
  const [filterStart,   setFilterStart]   = useState(`${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-01`)
  const [filterEnd,     setFilterEnd]     = useState(hoje.toISOString().split('T')[0])
  const [expanded,       setExpanded]       = useState(null)
  const [dayDetail,      setDayDetail]      = useState(null)
  const [hoveredCat,     setHoveredCat]     = useState(null)
  const [calMes,         setCalMes]         = useState(hoje.getMonth())
  const [calAno,         setCalAno]         = useState(hoje.getFullYear())
  const [erro,           setErro]           = useState('')
  const [modalTreino,    setModalTreino]    = useState(false)
  const [enviandoTreino, setEnviandoTreino] = useState(false)

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    try {
      const [rT, rP] = await Promise.all([
        api.get(`/exercicio/treino/${userId}`),
        api.get(`/exercicio/peso/${userId}`),
      ])
      setTreinos(rT.data)
      setPesoHistorico(rP.data)
    } catch {
      setErro('Não foi possível carregar os dados. O backend está rodando?')
    }
  }

  async function salvarTreino(form) {
    setEnviandoTreino(true)
    try {
      await api.post('/exercicio/treino', {
        user_id:          userId,
        data:             form.data,
        categoria:        form.categorias,
        qualidade:        form.qualidade,
        calorias_gastas:  form.calorias ? parseFloat(form.calorias) : null,
        observacoes:      form.observacoes || null,
      })
      setModalTreino(false)
      carregarDados()
    } catch(e) { console.error(e) }
    finally { setEnviandoTreino(false) }
  }

  const limiteStr = filterStart

  // quando muda mes/ano via nav, sincroniza o filtro de datas
  useEffect(() => {
    setFilterStart(`${ano}-${String(mes).padStart(2,'0')}-01`)
    setFilterEnd(new Date(ano, mes, 0).toISOString().split('T')[0])
  }, [mes, ano])

  const filteredTreinos = useMemo(() =>
    treinos.filter(t => t.data >= filterStart && t.data <= filterEnd),
  [treinos, filterStart, filterEnd])

  // Dias únicos treinados no período (o número que importa)
  const diasTreinados = useMemo(() =>
    new Set(filteredTreinos.map(t => t.data)).size,
    [filteredTreinos]
  )

  const filteredPeso = useMemo(() =>
    pesoHistorico
      .filter(p => p.semana_inicio >= filterStart && p.semana_inicio <= filterEnd)
      .map(p => ({ data: p.semana_inicio.slice(5), peso: p.peso_kg })),
    [pesoHistorico, filterStart, filterEnd]
  )

  const diasOnSet = useMemo(() => new Set(treinos.map(t => t.data)), [treinos])

  const qualPerc = useMemo(() => {
    const total = filteredTreinos.length
    if (total === 0) return { acima_esperado: 0, medio: 0, abaixo_esperado: 0 }
    const c = { acima_esperado: 0, medio: 0, abaixo_esperado: 0 }
    filteredTreinos.forEach(t => { c[t.qualidade] = (c[t.qualidade] || 0) + 1 })
    return {
      acima_esperado:  Math.round((c.acima_esperado  / total) * 100),
      medio:           Math.round((c.medio           / total) * 100),
      abaixo_esperado: Math.round((c.abaixo_esperado / total) * 100),
    }
  }, [filteredTreinos])

  const caloriasData = useMemo(() =>
    filteredTreinos.filter(t => t.calorias_gastas)
      .map(t => ({ data: t.data.slice(5), calorias: t.calorias_gastas }))
      .sort((a, b) => a.data.localeCompare(b.data)),
    [filteredTreinos]
  )

  const categoriaData = useMemo(() => {
    const mapa = {}
    filteredTreinos.forEach(t => {
      const cats = Array.isArray(t.categoria) ? t.categoria : [t.categoria]
      cats.forEach(cat => {
        if (!mapa[cat]) mapa[cat] = { categoria: cat, count: 0, scoreTotal: 0 }
        mapa[cat].count++
        mapa[cat].scoreTotal += Q_SCORE[t.qualidade] || 2
      })
    })
    return Object.values(mapa)
      .map(c => ({ ...c, mediaScore: c.scoreTotal / c.count }))
      .sort((a, b) => b.count - a.count)
  }, [filteredTreinos])

  const maxCatCount = useMemo(() =>
    categoriaData.reduce((mx, c) => Math.max(mx, c.count), 0),
    [categoriaData]
  )

  const qualPorCategoria = useMemo(() => {
    const mapa = {}
    filteredTreinos.forEach(t => {
      const cats = Array.isArray(t.categoria) ? t.categoria : [t.categoria]
      cats.forEach(cat => {
        if (!mapa[cat]) mapa[cat] = { acima_esperado: 0, medio: 0, abaixo_esperado: 0, total: 0 }
        mapa[cat][t.qualidade]++
        mapa[cat].total++
      })
    })
    return mapa
  }, [filteredTreinos])

  const diaSemanaData = useMemo(() => {
    const mapa = {}
    ORDEM_SEMANA.forEach(d => { mapa[d] = { dia: NOME_SEMANA[d], acima_esperado: 0, medio: 0, abaixo_esperado: 0 } })
    filteredTreinos.forEach(t => {
      const dia = new Date(t.data + 'T12:00:00').getDay()
      if (mapa[dia]) mapa[dia][t.qualidade]++
    })
    return ORDEM_SEMANA.map(d => mapa[d])
  }, [filteredTreinos])

  // Consistência: dias únicos de treino em dias úteis / total de dias úteis
  const consistencia = useMemo(() => {
    const inicio = new Date(limiteStr + 'T12:00:00')
    const fim    = new Date(filterEnd + 'T23:59:59')
    let totalDias = 0, diasUteis = 0
    const d = new Date(inicio)
    while (d <= fim) {
      totalDias++
      if (d.getDay() !== 0 && d.getDay() !== 6) diasUteis++
      d.setDate(d.getDate() + 1)
    }
    const weekdayDates = new Set(
      filteredTreinos
        .filter(t => { const dow = new Date(t.data + 'T12:00:00').getDay(); return dow !== 0 && dow !== 6 })
        .map(t => t.data)
    )
    const treinados = weekdayDates.size
    return { totalDias, diasUteis, treinados, pct: diasUteis > 0 ? Math.round((treinados / diasUteis) * 100) : 0 }
  }, [filteredTreinos, limiteStr, filterEnd])

  // Evolução da consistência acumulada — a cada dia útil, qual era o % geral até aquele ponto
  const consistenciaEvolution = useMemo(() => {
    const weekdayTrainedDates = new Set(
      filteredTreinos
        .filter(t => { const dow = new Date(t.data + 'T12:00:00').getDay(); return dow !== 0 && dow !== 6 })
        .map(t => t.data)
    )
    const inicio = new Date(limiteStr + 'T12:00:00')
    const fim    = new Date(filterEnd + 'T23:59:59')
    const points = []
    let totalUteis = 0, treinados = 0
    const d = new Date(inicio)

    while (d <= fim) {
      const ds  = d.toISOString().split('T')[0]
      const dow = d.getDay()
      if (dow !== 0 && dow !== 6) {
        totalUteis++
        if (weekdayTrainedDates.has(ds)) treinados++
        points.push({
          data: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`,
          pct: Math.round((treinados / totalUteis) * 100),
          treinados,
          diasUteis: totalUteis,
        })
      }
      d.setDate(d.getDate() + 1)
    }

    // Limita a ~40 pontos para o gráfico não ficar poluído
    if (points.length > 40) {
      const step = Math.ceil(points.length / 40)
      return points.filter((_, i) => i % step === 0 || i === points.length - 1)
    }
    return points
  }, [filteredTreinos, limiteStr, filterEnd])

  // Streak — dias consecutivos treinados
  const streak = useMemo(() => {
    if (treinos.length === 0) return 0
    const dates = new Set(treinos.map(t => t.data))
    const d = new Date(); d.setHours(12, 0, 0, 0)
    if (!dates.has(d.toISOString().split('T')[0])) d.setDate(d.getDate() - 1)
    let count = 0
    while (count < 365) {
      if (dates.has(d.toISOString().split('T')[0])) { count++; d.setDate(d.getDate() - 1) }
      else break
    }
    return count
  }, [treinos])

  const treinosPorData = useMemo(() => {
    const mapa = {}
    treinos.forEach(t => {
      if (!mapa[t.data]) mapa[t.data] = []
      mapa[t.data].push(t)
    })
    return mapa
  }, [treinos])

  function navMesFilter(dir) {
    let nm = mes + dir, na = ano
    if (nm < 1)  { nm = 12; na-- }
    if (nm > 12) { nm = 1;  na++ }
    setMes(nm); setAno(na)
  }

  function navMes(dir) {
    setCalMes(prev => {
      const novo = prev + dir
      if (novo < 0)  { setCalAno(a => a - 1); return 11 }
      if (novo > 11) { setCalAno(a => a + 1); return 0  }
      return novo
    })
  }

  const primeiroDiaSemana = new Date(calAno, calMes, 1).getDay()
  const totalDiasMes      = new Date(calAno, calMes + 1, 0).getDate()

  function estiloDia(dia) {
    const dataStr   = `${calAno}-${String(calMes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    const semana    = new Date(dataStr + 'T12:00:00').getDay()
    const isWeekend = semana === 0 || semana === 6
    const isFuturo  = dataStr > hojeStr
    const isOn      = diasOnSet.has(dataStr)
    const ring      = dia === diaHoje && calMes === mesAtual && calAno === anoAtual
    if (isOn)                  return { bg: T.calOn,  cor: '#fff',    fw: 700, ring }
    if (isFuturo || isWeekend) return { bg: T.calOff, cor: T.textMut, fw: 400, ring }
    return                            { bg: T.calMiss, cor: T.textSub, fw: 500, ring }
  }

  const anyModalOpen = expanded !== null || dayDetail !== null

  // Cor da barra de consistência por semana
  function consistenciaCor(pct) {
    if (pct >= 80) return T.qGreen
    if (pct >= 50) return T.qYellow
    return T.qRed
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ fontFamily: T.fontBody, background: T.bgGradient, minHeight: '100vh' }}
    >
      <motion.div
        animate={{
          scale: anyModalOpen ? 0.984 : 1,
          filter: anyModalOpen ? 'blur(2px)' : 'blur(0px)',
        }}
        transition={springFluid}
        style={{ transformOrigin: 'center top' }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 20px 60px' }}>
        {erro && (
          <div style={{
            background: 'rgba(254,226,226,0.75)', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(252,165,165,0.5)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            fontSize: 13, color: '#dc2626', fontFamily: T.fontBody,
          }}>{erro}</div>
        )}

        {/* ── Hero — Consistência ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springFluid, delay: 0.05 }}
          style={{ ...heroCard, marginBottom: 14 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.2fr', gap: 28, alignItems: 'start' }}>

            {/* KPI principal: consistência */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ ...heroLabel, marginBottom: 0 }}>Consistência no período</span>
                <ExpandBtn onClick={() => setExpanded('consistencia')} dark />
              </div>
              <p style={{ fontFamily: T.fontHead, fontSize: 32, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.04em' }}>
                {consistencia.pct}%
              </p>
              <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden', marginTop: 12 }}>
                <motion.div
                  animate={{ width: `${consistencia.pct}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  style={{ height: '100%', borderRadius: 2, backgroundColor: '#fff' }}
                />
              </div>
            </div>

            {/* Cascata: total → úteis → treinados */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={heroLabel}>Período</span>
              {[
                { label: 'dias totais',    value: consistencia.totalDias,  opacity: 1,    indent: 0  },
                { label: 'dias úteis',     value: consistencia.diasUteis,  opacity: 0.75, indent: 14 },
                { label: 'dias treinados', value: diasTreinados,           opacity: 1,    indent: 28, highlight: true },
              ].map(({ label, value, opacity, indent, highlight }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 6, paddingLeft: indent }}>
                  {indent > 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: -10 }}>↳</span>}
                  <span style={{ fontFamily: T.fontHead, fontSize: highlight ? 20 : 16, fontWeight: 800, color: `rgba(255,255,255,${opacity})`, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</span>
                  <span style={{ fontFamily: T.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.30)' }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Qualidade com barra */}
            <div>
              <span style={heroLabel}>Qualidade</span>
              <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                {[
                  { pct: qualPerc.acima_esperado,  cor: T.qGreen,  label: 'acima' },
                  { pct: qualPerc.medio,            cor: T.qYellow, label: 'médio' },
                  { pct: qualPerc.abaixo_esperado,  cor: T.qRed,    label: 'abaixo' },
                ].map(({ pct, cor, label }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: cor, fontFamily: T.fontBody }}>{pct}%</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', fontFamily: T.fontBody, marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderRadius: 4, overflow: 'hidden', height: 5, display: 'flex', backgroundColor: 'rgba(255,255,255,0.10)' }}>
                {qualPerc.acima_esperado  > 0 && <motion.div animate={{ width: `${qualPerc.acima_esperado}%`  }} transition={springFluid} style={{ height: '100%', backgroundColor: T.qGreen  }} />}
                {qualPerc.medio           > 0 && <motion.div animate={{ width: `${qualPerc.medio}%`           }} transition={springFluid} style={{ height: '100%', backgroundColor: T.qYellow }} />}
                {qualPerc.abaixo_esperado > 0 && <motion.div animate={{ width: `${qualPerc.abaixo_esperado}%` }} transition={springFluid} style={{ height: '100%', backgroundColor: T.qRed    }} />}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Controles de período ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
            <button onClick={() => navMesFilter(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSub, fontSize: 16, padding: '2px 6px', flexShrink: 0 }}>‹</button>
            <span style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 600, color: T.text, minWidth: 84, textAlign: 'center', flexShrink: 0 }}>
              {MESES[mes - 1]} {ano}
            </span>
            <button onClick={() => navMesFilter(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSub, fontSize: 16, padding: '2px 6px', flexShrink: 0 }}>›</button>
            <DateRangeSlider
              filterStart={filterStart} filterEnd={filterEnd}
              setFilterStart={setFilterStart} setFilterEnd={setFilterEnd}
              accentColor={T.ink} fontBody={T.fontBody}
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => { setFilterStart(hojeStr); setFilterEnd(hojeStr) }}
              style={{
                background: 'none', border: `1px solid rgba(0,0,0,0.15)`,
                borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, fontFamily: T.fontBody,
                color: T.textSub, flexShrink: 0,
              }}
            >Hoje</motion.button>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setModalTreino(true)}
            style={{
              background: T.ink, border: 'none', borderRadius: 7,
              padding: '7px 14px', cursor: 'pointer', color: '#fff',
              fontSize: 11, fontWeight: 700, fontFamily: T.fontBody,
              letterSpacing: '0.02em', flexShrink: 0,
            }}
          >+ Mais um treino</motion.button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr 1fr', gap: 14, alignItems: 'start' }}>

          {/* ══ ESQUERDA ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* 1. Progressão de peso */}
            <motion.div layout whileHover={{ y: -3 }} transition={springSnappy} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ ...sectionLabel, margin: 0 }}>Progressão de peso</span>
                <ExpandBtn onClick={() => setExpanded('peso')} />
              </div>
              {filteredPeso.length === 0
                ? <p style={{ fontSize: 13, color: T.textMut, textAlign: 'center', padding: '28px 0', margin: 0 }}>Nenhum registro no período.</p>
                : <ResponsiveContainer width="100%" height={175}>
                    <LineChart data={filteredPeso} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke={T.inkLt} />
                      <XAxis dataKey="data" tick={{ fontSize: 10, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: T.textMut, fontFamily: T.fontBody }} domain={['auto','auto']} axisLine={false} tickLine={false} />
                      <Tooltip content={<CleanTooltip />} />
                      <Line type="monotone" dataKey="peso" stroke={T.ink} strokeWidth={2.5}
                        dot={{ r: 4, fill: '#fff', stroke: T.ink, strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: T.ink, stroke: '#fff', strokeWidth: 2 }}
                        name="Peso (kg)" />
                    </LineChart>
                  </ResponsiveContainer>
              }
            </motion.div>

            {/* 3. Grupos musculares — heatmap chips */}
            <motion.div layout whileHover={{ y: -3 }} transition={springSnappy} style={{ ...thinGlass, overflow: 'visible' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                <span style={{ ...sectionLabel, marginBottom: 0 }}>Grupos musculares</span>
                <span style={{ fontSize: 10, color: T.textMut, fontFamily: T.fontBody }}>{categoriaData.length} de {CATEGORIAS.length}</span>
              </div>
              <div style={{ height: 4, backgroundColor: T.inkLt, borderRadius: 2, overflow: 'hidden', margin: '10px 0 14px' }}>
                <motion.div
                  animate={{ width: `${Math.round((categoriaData.length / CATEGORIAS.length) * 100)}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  style={{ height: '100%', borderRadius: 2, backgroundColor: T.ink }}
                />
              </div>

              {categoriaData.length === 0
                ? <p style={{ fontSize: 13, color: T.textMut, margin: 0 }}>Sem dados no período.</p>
                : categoriaData.map(c => {
                    const qual  = qualPorCategoria[c.categoria] || {}
                    const { bg, text } = heatColor(c.count, maxCatCount)
                    const isHov = hoveredCat === c.categoria
                    return (
                      <div key={c.categoria} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9, position: 'relative' }}>
                        <span style={{ fontSize: 12, color: T.text, textTransform: 'capitalize', fontFamily: T.fontBody }}>
                          {c.categoria.replace('_', ' ')}
                        </span>
                        <div style={{ position: 'relative' }}>
                          <motion.div
                            onMouseEnter={() => setHoveredCat(c.categoria)}
                            onMouseLeave={() => setHoveredCat(null)}
                            animate={{ scale: isHov ? 1.1 : 1 }}
                            transition={springSnappy}
                            style={{
                              fontSize: 12, fontWeight: 700, color: text, background: bg,
                              borderRadius: 20, padding: '3px 11px', fontFamily: T.fontBody,
                              letterSpacing: '-0.01em', cursor: 'default', userSelect: 'none',
                              boxShadow: isHov ? '0 4px 16px rgba(0,0,0,0.20)' : '0 1px 4px rgba(0,0,0,0.08)',
                            }}
                          >{c.count}×</motion.div>

                          <AnimatePresence>
                            {isHov && qual.total > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                style={{
                                  position: 'absolute', right: 0, bottom: 'calc(100% + 8px)', zIndex: 100,
                                  width: 192, background: 'rgba(255,255,255,0.96)',
                                  backdropFilter: 'blur(32px) saturate(220%)',
                                  WebkitBackdropFilter: 'blur(32px) saturate(220%)',
                                  border: '1px solid rgba(255,255,255,0.96)', borderRadius: 12, padding: '11px 13px',
                                  boxShadow: '0 8px 36px rgba(0,0,0,0.14), 0 1px 0 rgba(255,255,255,1) inset',
                                  pointerEvents: 'none',
                                }}
                              >
                                <p style={{ fontSize: 10, color: T.textMut, fontFamily: T.fontBody, margin: '0 0 9px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                  qualidade · {c.categoria.replace('_', ' ')}
                                </p>
                                {[
                                  { key: 'acima_esperado',  label: 'Acima',  cor: T.qGreen  },
                                  { key: 'medio',           label: 'Médio',  cor: T.qYellow },
                                  { key: 'abaixo_esperado', label: 'Abaixo', cor: T.qRed    },
                                ].map(({ key, label, cor }) => (
                                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <div style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: cor, flexShrink: 0 }} />
                                      <span style={{ fontSize: 12, color: T.textSub, fontFamily: T.fontBody }}>{label}</span>
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: T.fontBody }}>{qual[key] || 0}</span>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )
                  })
              }
            </motion.div>
          </div>

          {/* ══ MEIO ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Distribuição semanal */}
            <motion.div layout whileHover={{ y: -3 }} transition={springSnappy} style={thinGlass}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ ...sectionLabel, margin: 0 }}>Distribuição semanal</span>
                <ExpandBtn onClick={() => setExpanded('distribuicao')} />
              </div>
              {diaSemanaData.every(d => d.acima_esperado + d.medio + d.abaixo_esperado === 0)
                ? <p style={{ fontSize: 13, color: T.textMut, textAlign: 'center', padding: '28px 0', margin: 0 }}>Nenhum dado no período.</p>
                : <ResponsiveContainer width="100%" height={175}>
                    <BarChart data={diaSemanaData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }} barSize={14}>
                      <CartesianGrid strokeDasharray="2 4" stroke={T.inkLt} vertical={false} />
                      <XAxis dataKey="dia" tick={{ fontSize: 10, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CleanTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                      <Bar dataKey="acima_esperado"  stackId="a" fill={T.qGreen}  name="Acima" />
                      <Bar dataKey="medio"           stackId="a" fill={T.qYellow} name="Médio" />
                      <Bar dataKey="abaixo_esperado" stackId="a" fill={T.qRed}    name="Abaixo" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
              }
            </motion.div>

            {/* Calorias por treino */}
            <motion.div layout whileHover={{ y: -3 }} transition={springSnappy} style={thinGlass}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ ...sectionLabel, margin: 0 }}>Calorias por treino</span>
                <ExpandBtn onClick={() => setExpanded('calorias')} />
              </div>
              {caloriasData.length === 0
                ? <p style={{ fontSize: 13, color: T.textMut, textAlign: 'center', padding: '28px 0', margin: 0 }}>Nenhum registro de calorias.</p>
                : <ResponsiveContainer width="100%" height={155}>
                    <BarChart data={caloriasData} margin={{ top: 4, right: 8, left: -22, bottom: 0 }} barSize={14}>
                      <CartesianGrid strokeDasharray="2 4" stroke={T.inkLt} vertical={false} />
                      <XAxis dataKey="data" tick={{ fontSize: 10, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CleanTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                      <Bar dataKey="calorias" fill={T.ink} name="Calorias" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
              }
            </motion.div>
          </div>

          {/* ══ DIREITA ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Calendário */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <motion.button
                  onClick={() => navMes(-1)}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} transition={springSnappy}
                  style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${T.inkLt}`, borderRadius: 6, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub, fontSize: 14, flexShrink: 0 }}
                >‹</motion.button>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontFamily: T.fontHead, fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: '-0.01em' }}>{MESES[calMes]}</span>
                  <span style={{ fontSize: 11, color: T.textMut, fontFamily: T.fontBody, marginLeft: 6 }}>{calAno}</span>
                </div>
                <motion.button
                  onClick={() => navMes(1)}
                  whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} transition={springSnappy}
                  style={{ background: 'rgba(0,0,0,0.05)', border: `1px solid ${T.inkLt}`, borderRadius: 6, width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSub, fontSize: 14, flexShrink: 0 }}
                >›</motion.button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                {['D','S','T','Q','Q','S','S'].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: T.textMut, paddingBottom: 5, fontFamily: T.fontBody }}>{d}</div>
                ))}
                {Array.from({ length: primeiroDiaSemana }).map((_, i) => <div key={`v${i}`} />)}
                {Array.from({ length: totalDiasMes }).map((_, i) => {
                  const dia     = i + 1
                  const dataStr = `${calAno}-${String(calMes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
                  const { bg, cor, fw, ring } = estiloDia(dia)
                  const isFuturo   = dataStr > hojeStr
                  const treinosDia = treinosPorData[dataStr] || []
                  return (
                    <motion.button
                      key={dia}
                      whileHover={isFuturo ? {} : { scale: 1.2 }}
                      whileTap={isFuturo ? {} : { scale: 0.95 }}
                      transition={springSnappy}
                      onClick={() => !isFuturo && setDayDetail({ dataStr, treinos: treinosDia })}
                      style={{
                        textAlign: 'center', padding: '6px 0', borderRadius: 6,
                        fontSize: 11, backgroundColor: bg, color: cor, fontWeight: fw,
                        fontFamily: T.fontBody, border: 'none',
                        outline: ring ? `2px solid ${T.ink}` : 'none', outlineOffset: 2,
                        cursor: isFuturo ? 'default' : 'pointer',
                      }}
                    >{dia}</motion.button>
                  )
                })}
              </div>

              {/* Legenda */}
              <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11, fontFamily: T.fontBody }}>
                <span style={{ color: T.ink }}>■ Treinou</span>
                <span style={{ color: T.inkMd }}>■ Faltou</span>
                <span style={{ color: T.textMut }}>■ Off</span>
              </div>

              {/* Streak — fogo no lado esquerdo */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, ...springFluid }}
                style={{
                  marginTop: 12,
                  background: streak > 0 ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${streak > 0 ? 'rgba(0,0,0,0.10)' : T.inkLt}`,
                  borderRadius: 10, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                {/* Ícone de fogo — esquerda */}
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>🔥</div>
                <div>
                  <div style={{ fontSize: 10, color: T.textMut, fontFamily: T.fontBody, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Streak atual</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontFamily: T.fontHead, fontSize: 24, fontWeight: 800, color: T.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>{streak}</span>
                    <span style={{ fontSize: 11, color: T.textSub, fontFamily: T.fontBody }}>dias seguidos</span>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
        </div>
      </motion.div>

      {/* ── Modais ── */}

      <AnimatePresence mode="wait">
        {expanded === 'consistencia' && (
          <ExpandModal key="consistencia" title="Evolução da consistência" onClose={() => setExpanded(null)} wide>
            {consistenciaEvolution.length < 2
              ? <p style={{ color: T.textMut, fontSize: 14, fontFamily: T.fontBody, textAlign: 'center', padding: '40px 0' }}>Pouco dados para exibir evolução. Tente um período maior.</p>
              : <>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                    {[
                      { label: 'Consistência atual',  value: `${consistenciaEvolution[consistenciaEvolution.length - 1]?.pct ?? 0}%` },
                      { label: 'Pico acumulado',      value: `${Math.max(...consistenciaEvolution.map(w => w.pct))}%` },
                      { label: 'Dias úteis analisados', value: consistenciaEvolution.length },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: '10px 16px', flex: 1, textAlign: 'center' }}>
                        <div style={{ fontFamily: T.fontHead, fontSize: 22, fontWeight: 800, color: T.ink, lineHeight: 1 }}>{value}</div>
                        <div style={{ fontSize: 11, color: T.textMut, fontFamily: T.fontBody, marginTop: 4 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={consistenciaEvolution} margin={{ top: 12, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 4" stroke={T.inkLt} />
                      <XAxis dataKey="data" tick={{ fontSize: 11, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <Tooltip content={<ConsistenciaTooltip />} />
                      <ReferenceLine y={80} stroke={T.qGreen}  strokeDasharray="5 4" strokeWidth={1.5} strokeOpacity={0.6} />
                      <ReferenceLine y={50} stroke={T.qYellow} strokeDasharray="5 4" strokeWidth={1.5} strokeOpacity={0.6} />
                      <Line
                        type="monotone" dataKey="pct" name="Consistência"
                        stroke={T.ink} strokeWidth={2.5}
                        dot={{ r: 5, fill: '#fff', stroke: T.ink, strokeWidth: 2.5 }}
                        activeDot={{ r: 7, fill: T.ink, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 11, fontFamily: T.fontBody, color: T.textMut }}>
                    <span style={{ color: T.qGreen }}>— 80% meta</span>
                    <span style={{ color: T.qYellow }}>— 50% mínimo</span>
                  </div>
                </>
            }
          </ExpandModal>
        )}
        {expanded === 'peso' && (
          <ExpandModal key="peso" title="Progressão de peso" onClose={() => setExpanded(null)}>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={filteredPeso} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={T.inkLt} />
                <XAxis dataKey="data" tick={{ fontSize: 11, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: T.textMut, fontFamily: T.fontBody }} domain={['auto','auto']} axisLine={false} tickLine={false} />
                <Tooltip content={<CleanTooltip />} />
                <Line type="monotone" dataKey="peso" stroke={T.ink} strokeWidth={2.5}
                  dot={{ r: 5, fill: '#fff', stroke: T.ink, strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: T.ink, stroke: '#fff', strokeWidth: 2 }}
                  name="Peso (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </ExpandModal>
        )}
        {expanded === 'calorias' && (
          <ExpandModal key="calorias" title="Calorias por treino" onClose={() => setExpanded(null)}>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={caloriasData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }} barSize={20}>
                <CartesianGrid strokeDasharray="2 4" stroke={T.inkLt} vertical={false} />
                <XAxis dataKey="data" tick={{ fontSize: 11, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} />
                <Tooltip content={<CleanTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="calorias" fill={T.ink} name="Calorias" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ExpandModal>
        )}
        {expanded === 'distribuicao' && (
          <ExpandModal key="dist" title="Distribuição semanal" onClose={() => setExpanded(null)}>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={diaSemanaData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="2 4" stroke={T.inkLt} vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CleanTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="acima_esperado"  stackId="a" fill={T.qGreen}  name="Acima" />
                <Bar dataKey="medio"           stackId="a" fill={T.qYellow} name="Médio" />
                <Bar dataKey="abaixo_esperado" stackId="a" fill={T.qRed}    name="Abaixo" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ExpandModal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dayDetail && (
          <DayDetailModal key="day" dayDetail={dayDetail} onClose={() => setDayDetail(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalTreino && (
          <ModalTreino
            key="modal-treino"
            onClose={() => setModalTreino(false)}
            onSave={salvarTreino}
            enviando={enviandoTreino}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default ExerciciosCompact
