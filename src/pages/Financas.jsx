import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DateRangeSlider from '../components/DateRangeSlider'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import api from '../services/api'

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIAS_INPUT = ['alimentacao','transporte','lazer','saude','moradia','investimento','salario','outro']
const CATEGORIAS_LABEL = {
  alimentacao:'Alimentação', transporte:'Transporte', lazer:'Lazer',
  saude:'Saúde', moradia:'Moradia', investimento:'Investimento',
  salario:'Salário', outro:'Outro',
}
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

// ─── Tokens ───────────────────────────────────────────────────────────────────

const T = {
  bgGradient:  '#ffffff',
  glass:       'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.90)',
  blur:        'blur(28px) saturate(200%)',
  text:    '#0a0a0a',
  textSub: '#525252',
  textMut: '#a3a3a3',
  ink:     '#0a0a0a',
  inkLt:   '#e5e5e5',
  // paleta teal principal
  teal:      '#004444',
  tealMd:    '#005555',
  tealLt:    '#006666',
  tealXLt:   '#007777',
  tealDark:  '#003333',
  tealVibrant:'#00b6ad',
  tealAlpha: 'rgba(0,68,68,0.08)',
  tealBorder:'rgba(0,68,68,0.18)',
  // paleta neutra complementar
  charcoal:  '#3d3935',
  neutral:   '#7a7a7a',
  neutralLt: '#bcbcbc',
  neutralXLt:'#f7f7f7',
  // status — laranja presente, teal vibrante
  orange:     '#ff7400',
  orangeMd:   '#cc5c00',
  orangeAlpha:'rgba(255,116,0,0.10)',
  alertOver:  '#ff7400',
  alertWarn:  '#cc5c00',
  alertGood:  '#00b6ad',
  fontHead: "'Syne', sans-serif",
  fontBody: "'DM Sans', sans-serif",
}

// ─── Estilos base ─────────────────────────────────────────────────────────────

const card = {
  background: T.glass,
  backdropFilter: T.blur,
  WebkitBackdropFilter: T.blur,
  borderRadius: 14,
  padding: '16px 18px',
  border: `1px solid ${T.glassBorder}`,
  boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 0 rgba(255,255,255,0.95) inset',
}

const thinGlass = {
  background: 'rgba(255,255,255,0.26)',
  backdropFilter: 'blur(40px) saturate(220%)',
  WebkitBackdropFilter: 'blur(40px) saturate(220%)',
  borderRadius: 14,
  padding: '18px 20px',
  border: '1px solid rgba(255,255,255,0.94)',
  boxShadow: '0 2px 20px rgba(0,0,0,0.04)',
}

const heroCard = {
  background: 'rgba(0,51,51,0.92)',
  backdropFilter: 'blur(28px) saturate(200%)',
  WebkitBackdropFilter: 'blur(28px) saturate(200%)',
  borderRadius: 14,
  padding: '20px 24px',
  border: '1px solid rgba(0,182,173,0.18)',
  boxShadow: '0 8px 40px rgba(0,51,51,0.35)',
}

const sectionLabel = {
  fontFamily: T.fontBody, fontSize: 10, fontWeight: 600,
  color: T.textMut, textTransform: 'uppercase',
  letterSpacing: '0.1em', marginBottom: 12, display: 'block',
}
const heroLabel  = { ...sectionLabel, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }
const fieldLabel = { fontFamily: T.fontBody, fontSize: 12, fontWeight: 500, color: T.textSub, display: 'block', marginBottom: 5 }
const inputStyle = {
  width: '100%', padding: '8px 11px', boxSizing: 'border-box',
  borderRadius: 7, border: '1px solid rgba(255,255,255,0.65)',
  background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)', color: T.text,
  fontSize: 13, fontFamily: T.fontBody, outline: 'none',
}

// ─── Motion ───────────────────────────────────────────────────────────────────

const springSnappy = { type: 'spring', stiffness: 460, damping: 28 }
const springFluid  = { type: 'spring', stiffness: 280, damping: 32 }
const springModal  = { type: 'spring', stiffness: 360, damping: 28 }

// ─── ExpandBtn / ExpandModal ──────────────────────────────────────────────────

function ExpandBtn({ onClick }) {
  return (
    <button onClick={onClick} title="Expandir" style={{
      background: 'rgba(0,0,0,0.05)', border: `1px solid ${T.inkLt}`,
      borderRadius: 6, width: 26, height: 26, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: T.textSub, fontSize: 12, flexShrink: 0,
    }}>⤢</button>
  )
}

function ExpandModal({ title, onClose, children }) {
  return (
    <motion.div
      key="expand-backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }} onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        backgroundColor: 'rgba(240,248,248,0.50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32,
      }}
    >
      <motion.div
        initial={{ y: 28, scale: 0.93, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 12, scale: 0.97, opacity: 0 }}
        transition={springModal} onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          borderRadius: 18, border: '1px solid rgba(255,255,255,0.95)',
          boxShadow: '0 24px 80px rgba(0,68,68,0.18), 0 2px 0 rgba(255,255,255,1) inset',
          padding: '24px 28px', width: '100%', maxWidth: 900,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: T.fontHead, fontSize: 16, fontWeight: 700, color: T.teal, letterSpacing: '-0.02em' }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.05)', border: `1px solid ${T.inkLt}`,
            borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.textSub, fontSize: 16,
          }}>×</button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val ?? 0)
}

function percentColor(pct) {
  if (pct == null) return '#16a34a'
  if (pct >= 100) return '#dc2626'   // vermelho — estourou
  if (pct >= 75)  return '#d97706'   // amarelo — acelerado
  return '#16a34a'                   // verde — folga
}

// Cor da tag de valor — laranja (saídas) e teal (entradas) com intensidade pelo valor
function getValorStyle(tipo, valor) {
  if (tipo === 'entrada') {
    if (valor >= 2000) return { bg: 'rgba(0,182,173,0.18)', border: 'rgba(0,182,173,0.38)', text: '#003333' }
    if (valor >= 500)  return { bg: 'rgba(0,182,173,0.11)', border: 'rgba(0,182,173,0.26)', text: '#005555' }
    return                   { bg: 'rgba(0,182,173,0.07)',  border: 'rgba(0,182,173,0.16)', text: '#006666' }
  }
  if (valor >= 500) return   { bg: 'rgba(255,116,0,0.12)',  border: 'rgba(255,116,0,0.30)', text: '#7a3800' }
  if (valor >= 100) return   { bg: 'rgba(255,116,0,0.08)',  border: 'rgba(255,116,0,0.20)', text: '#994400' }
  return                     { bg: 'rgba(204,92,0,0.06)',   border: 'rgba(204,92,0,0.14)',  text: '#7a5a3a' }
}

// ─── Tooltip linha ────────────────────────────────────────────────────────────

function LineTooltip({ active, payload, label: lbl }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.95)',
      borderRadius: 10, padding: '8px 12px', fontSize: 12,
      fontFamily: T.fontBody, color: T.text, boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
    }}>
      <p style={{ margin: '0 0 5px', color: T.textMut, fontSize: 11 }}>Dia {lbl}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: p.color }}>
          <span style={{ marginRight: 5 }}>■</span>
          {p.name}: <strong>{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

function BarTooltip({ active, payload, label: lbl }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.95)',
      borderRadius: 10, padding: '8px 12px', fontSize: 12,
      fontFamily: T.fontBody, color: T.text, boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
    }}>
      <p style={{ margin: '0 0 5px', color: T.textMut, fontSize: 11 }}>{lbl}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', color: T.text }}>
          <span style={{ color: p.fill, marginRight: 5 }}>■</span>
          {p.name}: <strong>{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

// ─── Modal base ───────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, maxWidth = 460 }) {
  return (
    <motion.div
      key="backdrop"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          borderRadius: 18, border: '1px solid rgba(255,255,255,0.95)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 2px 0 rgba(255,255,255,1) inset',
          padding: '28px 32px', width: '100%', maxWidth,
          maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontFamily: T.fontHead, fontSize: 17, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em' }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.05)', border: `1px solid ${T.inkLt}`,
            borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.textMut, fontSize: 16,
          }}>×</button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

// ─── Barra de categoria ───────────────────────────────────────────────────────

const RITMO_STATUS = {
  folga:     { label: 'Folga',     color: '#16a34a' },
  acelerado: { label: 'Acelerado', color: '#d97706' },
  estouro:   { label: 'Estouro',  color: '#dc2626' },
}

function CategoriaBar({ categoria, realizado, limite, percentual, selected, onClick, status }) {
  const pct   = percentual ?? (limite ? Math.round(realizado / limite * 100) : null)
  const cor   = percentColor(pct)
  const label = CATEGORIAS_LABEL[categoria] || categoria
  const st    = status ? RITMO_STATUS[status] : null

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={springFluid}
      onClick={onClick}
      style={{
        marginBottom: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 9,
        background: selected ? 'rgba(0,68,68,0.07)' : 'transparent',
        border: selected ? `1px solid ${T.tealBorder}` : '1px solid transparent',
        transition: 'background 0.15s, border 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {st && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, flexShrink: 0, display: 'inline-block', marginTop: 1 }} />
          )}
          <span style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 600, color: selected ? T.teal : T.text }}>
            {label}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 600, color: T.text }}>{fmt(realizado)}</span>
            {pct != null && (
              <span style={{ fontFamily: T.fontBody, fontSize: 10, fontWeight: 700, color: cor, minWidth: 26, textAlign: 'right' }}>{pct}%</span>
            )}
          </div>
          {limite ? <span style={{ fontFamily: T.fontBody, fontSize: 9, color: T.textMut }}>de {fmt(limite)}</span> : null}
        </div>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct ?? 0, 100)}%` }}
          transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ height: '100%', borderRadius: 99, background: cor, opacity: selected ? 1 : 0.85 }}
        />
      </div>
    </motion.div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Financas() {
  const userId    = localStorage.getItem('user_id') || 'nicolas'
  const hoje     = new Date()

  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())

  // filtro de datas flexível — default: mês inteiro
  const priDia = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-01`
  const ultDia = new Date(hoje.getFullYear(), hoje.getMonth()+1, 0).toISOString().split('T')[0]
  const [filterStart, setFilterStart] = useState(priDia)
  const [filterEnd,   setFilterEnd]   = useState(ultDia)

  const [resumo,     setResumo]     = useState(null)
  const [transacoes, setTransacoes] = useState([])
  const [centros,    setCentros]    = useState([])
  const [loading,    setLoading]    = useState(true)

  const [selectedCat, setSelectedCat] = useState(null)
  const [expanded,    setExpanded]    = useState(null)
  const [dayDetail,   setDayDetail]   = useState(null) // { data, transacoes }

  // modais
  const [modalTransacao, setModalTransacao] = useState(false)
  const [modalConfig,    setModalConfig]    = useState(false)
  const [enviando,       setEnviando]       = useState(false)
  const [salvando,       setSalvando]       = useState(false)

  const [form, setForm] = useState({
    data: hoje.toISOString().split('T')[0],
    tipo: 'saida', valor: '', categoria: 'alimentacao', descricao: '', custo_fixo: false, tipo_pagamento: 'pix',
  })

  const [configForm, setConfigForm] = useState({ renda_mensal: '', limites: {} })

  // ── Fetch ──────────────────────────────────────────────────────────────────

  async function fetchTudo() {
    setLoading(true)
    try {
      // resumo ainda usa mes/ano (para o KPI mensal fazer sentido)
      const mesDoStart = parseInt(filterStart.split('-')[1])
      const anoDoStart = parseInt(filterStart.split('-')[0])
      const [r1, r2, r3] = await Promise.all([
        api.get(`/financas/resumo/${userId}`, { params: { ano: anoDoStart, mes: mesDoStart } }),
        api.get(`/financas/transacao/${userId}`, { params: { data_inicio: filterStart, data_fim: filterEnd } }),
        api.get(`/financas/configuracao/${userId}`),
      ])
      setResumo(r1.data)
      setTransacoes(r2.data)
      setCentros(r3.data)
    } catch(e) { console.error(e) }
    finally    { setLoading(false) }
  }

  async function fetchRenda() {
    try {
      const r = await api.get(`/financas/renda/${userId}`)
      const renda = r.data[0]
      setConfigForm(prev => ({ ...prev, renda_mensal: renda?.renda_mensal ?? '' }))
    } catch(e) { console.error(e) }
  }

  useEffect(() => { fetchTudo() }, [filterStart, filterEnd, userId])

  // quando muda mes/ano via nav, atualiza o filtro de datas
  useEffect(() => {
    const s = `${ano}-${String(mes).padStart(2,'0')}-01`
    const e = new Date(ano, mes, 0).toISOString().split('T')[0]
    setFilterStart(s)
    setFilterEnd(e)
  }, [mes, ano])

  // ── Derivações ─────────────────────────────────────────────────────────────

  const limites = useMemo(() => {
    const m = {}
    centros.forEach(c => { m[c.categoria] = c.limite_mensal })
    return m
  }, [centros])

  const categoriasComDados = useMemo(() => {
    if (!resumo?.por_categoria) return []
    return resumo.por_categoria.map(c => ({
      ...c,
      limite_mensal: limites[c.categoria] ?? c.limite_mensal,
    }))
  }, [resumo, limites])

  const totalLimite = useMemo(() => centros.reduce((s, c) => s + c.limite_mensal, 0), [centros])

  // Dados do gráfico de linha: acumulado diário vs referência linear
  const cumulativeData = useMemo(() => {
    const daysInMonth  = new Date(ano, mes, 0).getDate()
    const limitChart   = selectedCat ? (limites[selectedCat] || 0) : totalLimite
    const filterFn     = t => t.tipo === 'saida' && !t.custo_fixo && (!selectedCat || t.categoria === selectedCat)

    // Para o mês atual, parar em hoje; meses passados exibem o mês inteiro
    const hj = new Date()
    const isCurrentMonth = hj.getFullYear() === ano && (hj.getMonth() + 1) === mes
    const lastDay = isCurrentMonth ? hj.getDate() : daysInMonth

    const byDay = {}
    transacoes.filter(filterFn).forEach(t => {
      const day = parseInt(t.data.split('-')[2])
      byDay[day] = (byDay[day] || 0) + t.valor
    })

    let cumul = 0
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      if (day <= lastDay) cumul += byDay[day] || 0
      return {
        dia: day,
        realizado: day <= lastDay ? Math.round(cumul * 100) / 100 : null,
        referencia: Math.round((limitChart / daysInMonth) * day * 100) / 100,
      }
    })
  }, [transacoes, selectedCat, limites, totalLimite, mes, ano])

  const dadosBarras = useMemo(() =>
    categoriasComDados.map(c => ({
      name: (CATEGORIAS_LABEL[c.categoria] || c.categoria).slice(0, 7),
      realizado: c.realizado,
      limite: c.limite_mensal,
      categoria: c.categoria,
    })),
  [categoriasComDados])

  // Ritmo por categoria — ordena mais acelerado primeiro
  const { totalFixo, totalVariavel } = useMemo(() => {
    let fix = 0, vari = 0
    transacoes.filter(t => t.tipo === 'saida').forEach(t => {
      t.custo_fixo ? (fix += t.valor) : (vari += t.valor)
    })
    return { totalFixo: fix, totalVariavel: vari }
  }, [transacoes])

  // Realizado fixo e variável por categoria (calculado das transações, não do backend)
  const realizadoPorCategoria = useMemo(() => {
    const fixo = {}, variavel = {}
    transacoes.filter(t => t.tipo === 'saida').forEach(t => {
      if (t.custo_fixo) fixo[t.categoria]     = (fixo[t.categoria]     || 0) + t.valor
      else              variavel[t.categoria] = (variavel[t.categoria] || 0) + t.valor
    })
    return { fixo, variavel }
  }, [transacoes])

  const pagamentoData = useMemo(() => {
    const LABELS = { pix: 'Pix', dinheiro: 'Dinheiro', debito: 'Débito', credito: 'Crédito' }
    const COLORS = { pix: '#00b6ad', dinheiro: '#16a34a', debito: '#3b82f6', credito: '#d97706' }
    const map = {}
    transacoes.filter(t => t.tipo === 'saida').forEach(t => {
      const fp = t.tipo_pagamento || 'pix'
      map[fp] = (map[fp] || 0) + t.valor
    })
    const total = Object.values(map).reduce((s, v) => s + v, 0)
    return {
      total,
      credito: map.credito || 0,
      items: Object.entries(map).map(([key, valor]) => ({
        key, label: LABELS[key] || key, color: COLORS[key] || T.neutral,
        valor, pct: total > 0 ? valor / total : 0,
      })).sort((a, b) => b.valor - a.valor),
    }
  }, [transacoes])

  const ritmoData = useMemo(() => {
    const diasNoMes = new Date(ano, mes, 0).getDate()
    const hj = new Date()
    const isCurrentMonth = hj.getFullYear() === ano && (hj.getMonth() + 1) === mes
    const diasDecorridos = Math.max(1, isCurrentMonth ? hj.getDate() : diasNoMes)
    const diasRestantes  = Math.max(0, diasNoMes - diasDecorridos)

    return categoriasComDados.map(c => {
      const limite = c.limite_mensal || 0
      const gasto  = realizadoPorCategoria.variavel[c.categoria] || 0
      const ritmoPrevisto   = limite > 0 ? limite / diasNoMes : 0
      const ritmoAtual      = gasto / diasDecorridos
      const ritmoNecessario = diasRestantes > 0 ? (limite - gasto) / diasRestantes : 0
      const ritmoRatio      = ritmoPrevisto > 0 ? ritmoAtual / ritmoPrevisto : 0
      const percentoExcedido = Math.round((ritmoRatio - 1) * 100)
      const status = gasto > limite    ? 'estouro'
                   : ritmoRatio > 1.0 ? 'acelerado'
                   : 'folga'
      return { ...c, diasNoMes, diasDecorridos, diasRestantes, ritmoPrevisto, ritmoAtual, ritmoNecessario, ritmoRatio, percentoExcedido, status }
    }).sort((a, b) => b.ritmoRatio - a.ritmoRatio)
  }, [categoriasComDados, realizadoPorCategoria, mes, ano])

  const adesaoData = useMemo(() => {
    const diasNoMes = new Date(ano, mes, 0).getDate()
    const hj = new Date()
    const isCurrentMonth = hj.getFullYear() === ano && (hj.getMonth() + 1) === mes
    const diasDecorridos = Math.max(1, isCurrentMonth ? hj.getDate() : diasNoMes)
    // Escalonado variável: usa totalLimite como proxy do orçamento variável
    // (os limites representam o que a gente quer controlar — o variável)
    const escalonadoVariavel = totalLimite * (diasDecorridos / diasNoMes)
    // Score: 1 (100%) se gastou variável <= escalonado, proporcional abaixo se estourou
    const score = escalonadoVariavel > 0 ? Math.min(1, escalonadoVariavel / Math.max(1, totalVariavel)) : 1
    return { score, escalonadoVariavel, diasDecorridos, diasNoMes }
  }, [totalLimite, totalVariavel, mes, ano])

  const transacoesRecentes = useMemo(() =>
    [...transacoes].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 20),
  [transacoes])

  const saldo = resumo?.saldo ?? 0

  // ── Calendário heatmap ─────────────────────────────────────────────────────
  const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay()
  const totalDiasMes      = new Date(ano, mes, 0).getDate()
  const hojeStr           = new Date().toISOString().split('T')[0]

  const spendingByDay = useMemo(() => {
    const m = {}
    transacoes.filter(t => t.tipo === 'saida').forEach(t => {
      const day = parseInt(t.data.split('-')[2])
      m[day] = (m[day] || 0) + t.valor
    })
    return m
  }, [transacoes])

  const maxDaySpending = useMemo(() =>
    Math.max(...Object.values(spendingByDay), 1),
  [spendingByDay])

  const incomeByDay = useMemo(() => {
    const m = {}
    transacoes.filter(t => t.tipo === 'entrada').forEach(t => {
      const day = parseInt(t.data.split('-')[2])
      m[day] = (m[day] || 0) + t.valor
    })
    return m
  }, [transacoes])

  function heatDayColor(dia) {
    const spent  = spendingByDay[dia] || 0
    const earned = incomeByDay[dia]   || 0
    if (!spent && !earned) return { bg: 'rgba(0,0,0,0.03)', text: T.textMut, fw: 400 }
    if (spent) {
      const ratio = spent / maxDaySpending
      if (ratio >= 0.75) return { bg: 'rgba(255,116,0,0.85)',  text: '#fff',    fw: 700 }
      if (ratio >= 0.45) return { bg: 'rgba(255,116,0,0.50)',  text: '#7a3800', fw: 600 }
      if (ratio >= 0.15) return { bg: 'rgba(255,116,0,0.22)',  text: '#994400', fw: 500 }
      return                    { bg: 'rgba(255,116,0,0.09)',  text: T.textSub, fw: 400 }
    }
    // só entrada, nenhuma saída
    return { bg: 'rgba(0,182,173,0.28)', text: '#003333', fw: 600 }
  }

  // ── Ações ──────────────────────────────────────────────────────────────────

  function navMes(dir) {
    let nm = mes + dir, na = ano
    if (nm < 1)  { nm = 12; na-- }
    if (nm > 12) { nm = 1;  na++ }
    setMes(nm); setAno(na)
  }

  async function submitTransacao(e) {
    e.preventDefault()
    if (!form.valor || isNaN(form.valor)) return
    setEnviando(true)
    try {
      await api.post('/financas/transacao', { ...form, user_id: userId, valor: parseFloat(form.valor) })
      setModalTransacao(false)
      setForm({ data: hoje.toISOString().split('T')[0], tipo: 'saida', valor: '', categoria: 'alimentacao', descricao: '', custo_fixo: false, tipo_pagamento: 'pix' })
      fetchTudo()
    } catch(e) { console.error(e) }
    finally    { setEnviando(false) }
  }

  async function openConfig() {
    await fetchRenda()
    setConfigForm(prev => ({
      ...prev,
      limites: Object.fromEntries(centros.map(c => [c.categoria, c.limite_mensal])),
    }))
    setModalConfig(true)
  }

  async function submitConfig(e) {
    e.preventDefault()
    setSalvando(true)
    try {
      // salva renda mensal
      if (configForm.renda_mensal) {
        await api.post('/financas/renda', {
          user_id: userId,
          renda_mensal: parseFloat(configForm.renda_mensal),
          mes_referencia: `${ano}-${String(mes).padStart(2,'0')}-01`,
        })
      }
      // salva limites de categoria
      await Promise.all(
        centros.map(c => {
          const novoLimite = parseFloat(configForm.limites[c.categoria])
          if (!isNaN(novoLimite) && novoLimite !== c.limite_mensal) {
            return api.put(`/financas/configuracao/${c.id}`, {
              user_id: userId, categoria: c.categoria, limite_mensal: novoLimite,
            })
          }
          return Promise.resolve()
        })
      )
      setModalConfig(false)
      fetchTudo()
    } catch(e) { console.error(e) }
    finally    { setSalvando(false) }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ minHeight: '100vh', background: T.bgGradient, fontFamily: T.fontBody }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 20px 60px' }}>

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springFluid, delay: 0.05 }}
          style={{ ...heroCard, marginBottom: 14 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 28, alignItems: 'center' }}>

            {/* Score ring */}
            {(() => {
              const r = 32, circ = 2 * Math.PI * r
              const pct = adesaoData.score
              const ringColor = pct >= 0.9 ? '#16a34a' : pct >= 0.7 ? '#d97706' : '#dc2626'
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
                    <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={6} />
                      <motion.circle
                        cx="40" cy="40" r={r} fill="none"
                        stroke={ringColor} strokeWidth={6}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: circ - circ * pct }}
                        transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{ strokeDasharray: circ }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: T.fontHead, fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
                        {Math.round(pct * 100)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontFamily: T.fontBody, fontSize: 9, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 3 }}>Adesão ao Plano</span>
                    <p style={{ fontFamily: T.fontHead, fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.03em' }}>Variável</p>

                    {/* Comparação principal: variável realizado vs escalonado */}
                    <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                      <div>
                        <span style={{ fontFamily: T.fontBody, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Realizado</span>
                        <p style={{ fontFamily: T.fontBody, fontSize: 14, fontWeight: 700, color: '#fff', margin: '2px 0 0' }}>{fmt(totalVariavel)}</p>
                      </div>
                      <div style={{ width: 1, background: 'rgba(255,255,255,0.12)', alignSelf: 'stretch' }} />
                      <div>
                        <span style={{ fontFamily: T.fontBody, fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Escalonado hoje</span>
                        <p style={{ fontFamily: T.fontBody, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.70)', margin: '2px 0 0' }}>{fmt(adesaoData.escalonadoVariavel)}</p>
                      </div>
                    </div>

                    {/* Fixo: informativo, tom bem suave */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                      <span style={{ fontFamily: T.fontBody, fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fixo</span>
                      <span style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.32)' }}>{fmt(totalFixo)}</span>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Divisor */}
            <div style={{ width: 1, height: 60, background: 'rgba(255,255,255,0.10)', justifySelf: 'center' }} />

            {/* KPIs secundários */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
              <div>
                <span style={heroLabel}>Saldo</span>
                <p style={{ fontFamily: T.fontHead, fontSize: 22, fontWeight: 800, color: saldo >= 0 ? T.tealVibrant : '#f87171', margin: 0, letterSpacing: '-0.03em' }}>
                  {fmt(saldo)}
                </p>
              </div>
              <div>
                <span style={heroLabel}>Entradas</span>
                <p style={{ fontFamily: T.fontHead, fontSize: 18, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>
                  {fmt(resumo?.total_entradas)}
                </p>
              </div>
              <div>
                <span style={heroLabel}>Saídas</span>
                <p style={{ fontFamily: T.fontHead, fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.65)', margin: 0, letterSpacing: '-0.03em' }}>
                  {fmt(resumo?.total_saidas)}
                </p>
              </div>
            </div>

          </div>
        </motion.div>

        {/* ── Controles de período ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
            <button onClick={() => navMes(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSub, fontSize: 16, padding: '2px 6px', flexShrink: 0 }}>‹</button>
            <span style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 600, color: T.text, minWidth: 84, textAlign: 'center', flexShrink: 0 }}>
              {MESES[mes - 1]} {ano}
            </span>
            <button onClick={() => navMes(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSub, fontSize: 16, padding: '2px 6px', flexShrink: 0 }}>›</button>
            <DateRangeSlider
              filterStart={filterStart} filterEnd={filterEnd}
              setFilterStart={setFilterStart} setFilterEnd={setFilterEnd}
              accentColor={T.teal} fontBody={T.fontBody}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <motion.button whileTap={{ scale: 0.92 }} onClick={openConfig} title="Configurações" style={{
              background: 'none', border: `1px solid ${T.inkLt}`,
              borderRadius: 7, width: 30, height: 30, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.textSub, fontSize: 14,
            }}>⚙</motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setModalTransacao(true)} style={{
              background: T.teal, border: 'none', borderRadius: 7,
              padding: '7px 14px', cursor: 'pointer', color: '#fff',
              fontSize: 11, fontWeight: 700, fontFamily: T.fontBody,
              letterSpacing: '0.02em',
            }}>+ Transação</motion.button>
          </div>
        </div>

        {/* ── Day filter strip ── */}
        {(() => {
          const daysCount   = new Date(ano, mes, 0).getDate()
          const firstDay    = `${ano}-${String(mes).padStart(2,'0')}-01`
          const lastDay     = new Date(ano, mes, 0).toISOString().split('T')[0]
          const isFullMonth = filterStart === firstDay && filterEnd === lastDay
          const hasDataSet  = new Set(transacoes.map(t => t.data))
          return (
            <div style={{ display: 'flex', gap: 3, overflowX: 'auto', marginBottom: 14, paddingBottom: 2, scrollbarWidth: 'none' }}>
              <button
                onClick={() => { setFilterStart(firstDay); setFilterEnd(lastDay) }}
                style={{
                  flexShrink: 0, padding: '3px 10px', borderRadius: 20,
                  border: `1px solid ${isFullMonth ? T.teal : 'rgba(0,0,0,0.15)'}`,
                  background: isFullMonth ? T.teal : 'transparent',
                  color: isFullMonth ? '#fff' : T.textSub,
                  fontSize: 10, fontWeight: 700, fontFamily: T.fontBody, cursor: 'pointer',
                }}
              >Mês</button>
              {Array.from({ length: daysCount }).map((_, i) => {
                const day = i + 1
                const ds  = `${ano}-${String(mes).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const hasData    = hasDataSet.has(ds)
                const isSelected = filterStart === ds && filterEnd === ds
                const isFuture   = ds > hojeStr
                return (
                  <button key={day}
                    onClick={() => { if (!isFuture) { setFilterStart(ds); setFilterEnd(ds) } }}
                    style={{
                      flexShrink: 0, width: 28, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 2, padding: '3px 0',
                      borderRadius: 6, border: `1px solid ${isSelected ? T.teal : 'rgba(0,0,0,0.10)'}`,
                      background: isSelected ? T.teal : 'transparent',
                      color: isSelected ? '#fff' : isFuture ? T.textMut : T.text,
                      fontSize: 10, fontWeight: 600, fontFamily: T.fontBody,
                      cursor: isFuture ? 'default' : 'pointer', opacity: isFuture ? 0.4 : 1,
                    }}
                  >
                    {day}
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: hasData ? (isSelected ? '#fff' : T.teal) : 'transparent' }} />
                  </button>
                )
              })}
            </div>
          )
        })()}

        {/* ── 3 colunas ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 2.8fr 1.4fr', gap: 14 }}>

          {/* col 1: categorias (clicáveis pra atualizar gráfico) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              transition={{ ...springFluid, delay: 0.09 }}
              style={card}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={sectionLabel}>Orçamento</span>
                {selectedCat && (
                  <button
                    onClick={() => setSelectedCat(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.fontBody, fontSize: 10, color: T.tealXLt, textDecoration: 'underline' }}
                  >ver tudo</button>
                )}
              </div>

              {loading ? <p style={{ color: T.textMut, fontSize: 13 }}>Carregando…</p> : <>

                {/* ── Variável ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontFamily: T.fontBody, fontSize: 9, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.10em' }}>Variável</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
                  <span style={{ fontFamily: T.fontBody, fontSize: 9, color: T.textMut }}>
                    {fmt(Object.values(realizadoPorCategoria.variavel).reduce((s, v) => s + v, 0))}
                  </span>
                </div>

                {ritmoData.length === 0
                  ? <p style={{ color: T.textMut, fontSize: 12, marginBottom: 10 }}>Sem dados variáveis.</p>
                  : ritmoData.map(c => {
                      const realVar = realizadoPorCategoria.variavel[c.categoria] || 0
                      if (!realVar && !c.limite_mensal) return null
                      const st = RITMO_STATUS[c.status]
                      return (
                        <div key={c.categoria}>
                          <CategoriaBar
                            categoria={c.categoria}
                            realizado={realVar}
                            limite={c.limite_mensal}
                            percentual={null}
                            selected={selectedCat === c.categoria}
                            status={c.limite_mensal > 0 ? c.status : null}
                            onClick={() => setSelectedCat(prev => prev === c.categoria ? null : c.categoria)}
                          />
                          {/* Painel de ritmo inline — abre imediatamente abaixo */}
                          <AnimatePresence>
                            {selectedCat === c.categoria && c.limite_mensal > 0 && (
                              <motion.div key={`ritmo-${c.categoria}`}
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                style={{ overflow: 'hidden' }}>
                                <div style={{ margin: '4px 0 10px', padding: '12px 14px', background: `${st.color}10`, border: `1px solid ${st.color}33`, borderRadius: 10 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <span style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, color: T.text }}>
                                      {CATEGORIAS_LABEL[c.categoria] || c.categoria} — ritmo
                                    </span>
                                    <span style={{ fontSize: 9, fontWeight: 700, color: st.color, background: `${st.color}18`, border: `1px solid ${st.color}44`, borderRadius: 20, padding: '2px 8px' }}>
                                      {st.label}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                                    {[
                                      { label: 'Ritmo previsto', val: fmt(c.ritmoPrevisto) + '/dia', color: T.textSub },
                                      { label: 'Ritmo atual',    val: fmt(c.ritmoAtual)    + '/dia', color: st.color },
                                      c.diasRestantes > 0
                                        ? { label: 'Novo escalonado', val: fmt(Math.max(0, c.ritmoNecessario)) + '/dia', color: c.ritmoNecessario < 0 ? '#dc2626' : T.teal }
                                        : null,
                                    ].filter(Boolean).map(row => (
                                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 10, color: T.textMut }}>{row.label}</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: row.color }}>{row.val}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <p style={{ fontFamily: T.fontBody, fontSize: 10, color: T.textMut, margin: 0, lineHeight: 1.5 }}>
                                    {c.status === 'estouro'
                                      ? `Estourado em ${fmt(realVar - c.limite_mensal)}.`
                                      : c.status === 'folga'
                                        ? `${fmt(c.limite_mensal - realVar)} restantes. Máximo ${fmt(c.ritmoNecessario)}/dia.`
                                        : `${c.percentoExcedido}% acima do ritmo. Máximo ${fmt(Math.max(0, c.ritmoNecessario))}/dia nos próximos ${c.diasRestantes} dias.`
                                    }
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })
                }

                {/* ── Fixo ── */}
                {Object.keys(realizadoPorCategoria.fixo).length > 0 && <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 4 }}>
                    <span style={{ fontFamily: T.fontBody, fontSize: 9, fontWeight: 700, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.10em' }}>Fixo</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
                    <span style={{ fontFamily: T.fontBody, fontSize: 9, color: T.textMut }}>
                      {fmt(Object.values(realizadoPorCategoria.fixo).reduce((s, v) => s + v, 0))}
                    </span>
                  </div>
                  {Object.entries(realizadoPorCategoria.fixo)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amount]) => (
                      <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, padding: '0 2px' }}>
                        <span style={{ fontFamily: T.fontBody, fontSize: 12, color: T.textSub }}>
                          {CATEGORIAS_LABEL[cat] || cat}
                        </span>
                        <span style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 600, color: T.textMut }}>
                          {fmt(amount)}
                        </span>
                      </div>
                    ))
                  }
                </>}

              </>}
            </motion.div>

            {/* Card: Formas de Pagamento */}
            {pagamentoData.items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                transition={{ ...springFluid, delay: 0.12 }}
                style={card}
              >
                <span style={sectionLabel}>Formas de Pagamento</span>

                {/* Barra empilhada total */}
                <div style={{ height: 6, borderRadius: 99, overflow: 'hidden', display: 'flex', marginBottom: 12, gap: 1 }}>
                  {pagamentoData.items.map(item => (
                    <div key={item.key} style={{ width: `${item.pct * 100}%`, background: item.color, transition: 'width 0.6s ease' }} />
                  ))}
                </div>

                {/* Linhas por método */}
                {pagamentoData.items.map(item => (
                  <div key={item.key} style={{ marginBottom: 9 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 600, color: T.text }}>{item.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontFamily: T.fontBody, fontSize: 10, color: T.textMut }}>{Math.round(item.pct * 100)}%</span>
                        <span style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, color: T.textSub }}>{fmt(item.valor)}</span>
                      </div>
                    </div>
                    <div style={{ height: 3, borderRadius: 99, background: 'rgba(0,0,0,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct * 100}%` }}
                        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{ height: '100%', borderRadius: 99, background: item.color }}
                      />
                    </div>
                  </div>
                ))}

                {/* Alerta de crédito */}
                {pagamentoData.credito > 0 && (
                  <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.20)' }}>
                    <p style={{ fontFamily: T.fontBody, fontSize: 10, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                      <strong>{fmt(pagamentoData.credito)}</strong> em crédito = obrigação futura. Considere no planejamento do próximo mês.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* col 2: gráficos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Gráfico de linha: acumulado vs referência linear */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              transition={{ ...springFluid, delay: 0.11 }}
              style={card}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ ...sectionLabel, marginBottom: 0 }}>
                  Ritmo de gastos — {selectedCat ? (CATEGORIAS_LABEL[selectedCat] || selectedCat) : 'Total'}
                </span>
                <ExpandBtn onClick={() => setExpanded('ritmo')} />
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <LineChart
                  data={cumulativeData}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                  onClick={chartData => {
                    if (!chartData?.activePayload) return
                    const dia = chartData.activeLabel
                    // monta a data completa a partir do filterStart
                    const [y, m] = filterStart.split('-')
                    const dataStr = `${y}-${m}-${String(dia).padStart(2,'0')}`
                    const dayTrans = transacoes.filter(t => t.data === dataStr)
                    setDayDetail({ data: dataStr, transacoes: dayTrans })
                    setFilterStart(dataStr); setFilterEnd(dataStr)
                  }}
                  style={{ cursor: 'crosshair' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 9, fontFamily: T.fontBody, fill: T.textMut }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 9, fontFamily: T.fontBody, fill: T.textMut }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<LineTooltip />} />
                  <Line dataKey="referencia" name="Esperado" stroke={T.neutralLt} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  <Line dataKey="realizado" name="Realizado" stroke={T.tealVibrant} strokeWidth={2.5} dot={false} connectNulls={false} activeDot={{ r: 5, fill: T.tealVibrant, stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Gráfico de barras: realizado vs limite */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              transition={{ ...springFluid, delay: 0.13 }}
              style={card}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ ...sectionLabel, marginBottom: 0 }}>Realizado vs Limite</span>
                <ExpandBtn onClick={() => setExpanded('barras')} />
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={dadosBarras} barCategoryGap="30%" barGap={2} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: T.fontBody, fill: T.textMut }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 9, fontFamily: T.fontBody, fill: T.textMut }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<BarTooltip />} />
                  <Bar dataKey="realizado" name="Realizado" radius={[3,3,0,0]}>
                    {dadosBarras.map((entry, i) => {
                      const pct = entry.limite ? (entry.realizado / entry.limite * 100) : 0
                      const isSelected = selectedCat === entry.categoria
                      return <Cell key={i} fill={percentColor(pct)} opacity={selectedCat && !isSelected ? 0.35 : 1} />
                    })}
                  </Bar>
                  <Bar dataKey="limite" name="Limite" fill="rgba(0,68,68,0.10)" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* col 3: calendário heatmap + transações */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Calendário heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              transition={{ ...springFluid, delay: 0.15 }}
              style={card}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ ...sectionLabel, margin: 0 }}>Gastos por dia</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <button onClick={() => navMes(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSub, fontSize: 14, padding: '2px 6px' }}>‹</button>
                  <span style={{ fontFamily: T.fontBody, fontSize: 10, fontWeight: 600, color: T.text }}>{MESES[mes - 1].slice(0,3)}</span>
                  <button onClick={() => navMes(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSub, fontSize: 14, padding: '2px 6px' }}>›</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
                {['D','S','T','Q','Q','S','S'].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: 9, fontWeight: 600, color: T.textMut, paddingBottom: 4, fontFamily: T.fontBody }}>{d}</div>
                ))}
                {Array.from({ length: primeiroDiaSemana }).map((_, i) => <div key={`v${i}`} />)}
                {Array.from({ length: totalDiasMes }).map((_, i) => {
                  const dia     = i + 1
                  const dataStr = `${ano}-${String(mes).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
                  const isFuturo = dataStr > hojeStr
                  const isHoje   = dataStr === hojeStr
                  const { bg, text, fw } = heatDayColor(dia)
                  const dayTrans = transacoes.filter(t => t.data === dataStr)
                  return (
                    <motion.button
                      key={dia}
                      whileHover={isFuturo ? {} : { scale: 1.2 }}
                      whileTap={isFuturo ? {} : { scale: 0.92 }}
                      transition={springSnappy}
                      onClick={() => { if (!isFuturo) { setDayDetail({ data: dataStr, transacoes: dayTrans }); setFilterStart(dataStr); setFilterEnd(dataStr) } }}
                      title={spendingByDay[dia] ? fmt(spendingByDay[dia]) : undefined}
                      style={{
                        textAlign: 'center', padding: '5px 0', borderRadius: 5,
                        fontSize: 10, backgroundColor: isFuturo ? 'transparent' : bg,
                        color: isFuturo ? T.inkLt : text, fontWeight: fw,
                        fontFamily: T.fontBody, border: 'none',
                        outline: isHoje ? `2px solid ${T.tealVibrant}` : 'none', outlineOffset: 1,
                        cursor: isFuturo ? 'default' : 'pointer', opacity: isFuturo ? 0.3 : 1,
                      }}
                    >{dia}</motion.button>
                  )
                })}
              </div>

              {/* Legenda */}
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontFamily: T.fontBody }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(0,182,173,0.28)', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ color: '#00b6ad' }}>Entrada</span>
                  <span style={{ color: T.textMut, margin: '0 3px' }}>·</span>
                  <span style={{ color: T.textMut }}>sem movimento</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontFamily: T.fontBody }}>
                  {['rgba(255,116,0,0.09)','rgba(255,116,0,0.22)','rgba(255,116,0,0.50)','rgba(255,116,0,0.85)'].map((bg, i) => (
                    <span key={i} style={{ width: 10, height: 10, borderRadius: 2, background: bg, flexShrink: 0, display: 'inline-block' }} />
                  ))}
                  <span style={{ color: T.orange, marginLeft: 3 }}>Saída (intensidade)</span>
                </div>
              </div>
            </motion.div>

            {/* Transações recentes */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              transition={{ ...springFluid, delay: 0.17 }}
              style={{ ...card, padding: '16px 14px', overflowY: 'auto', maxHeight: 340 }}
            >
              <span style={sectionLabel}>Transações</span>
              {loading
                ? <p style={{ color: T.textMut, fontSize: 12, fontFamily: T.fontBody }}>Carregando…</p>
                : transacoesRecentes.length === 0
                  ? <p style={{ color: T.textMut, fontSize: 12, fontFamily: T.fontBody }}>Nenhuma transação.</p>
                  : transacoesRecentes.map((t, i) => {
                      const vs = getValorStyle(t.tipo, t.valor)
                      return (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ ...springSnappy, delay: i * 0.02 }}
                          style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid rgba(0,0,0,0.05)' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                            <div style={{ minWidth: 0 }}>
                              <span style={{ fontFamily: T.fontBody, fontSize: 11, color: T.textSub, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.descricao || CATEGORIAS_LABEL[t.categoria] || t.categoria}
                              </span>
                              <span style={{ fontFamily: T.fontBody, fontSize: 10, color: T.textMut }}>{t.data}</span>
                            </div>
                            <span style={{
                              fontFamily: T.fontHead, fontSize: 11, fontWeight: 700,
                              whiteSpace: 'nowrap', flexShrink: 0,
                              padding: '2px 7px', borderRadius: 5,
                              background: vs.bg, border: `1px solid ${vs.border}`, color: vs.text,
                            }}>
                              {t.tipo === 'entrada' ? '+' : '-'}{fmt(t.valor)}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })
              }
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Modal: Detalhe do dia ── */}
      <AnimatePresence>
        {dayDetail && (
          <Modal title={`Transações — ${dayDetail.data}`} onClose={() => setDayDetail(null)} maxWidth={400}>
            {dayDetail.transacoes.length === 0
              ? <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textMut }}>Nenhuma transação neste dia.</p>
              : dayDetail.transacoes.map((t, i) => {
                  const vs = getValorStyle(t.tipo, t.valor)
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...springSnappy, delay: i * 0.04 }}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px', borderRadius: 9, marginBottom: 8,
                        background: 'rgba(255,255,255,0.50)',
                        border: '1px solid rgba(255,255,255,0.80)',
                      }}
                    >
                      <div>
                        <span style={{ fontFamily: T.fontBody, fontSize: 13, fontWeight: 500, color: T.text, display: 'block' }}>
                          {t.descricao || CATEGORIAS_LABEL[t.categoria] || t.categoria}
                        </span>
                        <span style={{ fontFamily: T.fontBody, fontSize: 11, color: T.textMut, textTransform: 'capitalize' }}>
                          {CATEGORIAS_LABEL[t.categoria]} {t.custo_fixo ? '· fixo' : ''}
                        </span>
                      </div>
                      <span style={{
                        fontFamily: T.fontHead, fontSize: 14, fontWeight: 700,
                        padding: '3px 9px', borderRadius: 6,
                        background: vs.bg, border: `1px solid ${vs.border}`, color: vs.text,
                      }}>
                        {t.tipo === 'entrada' ? '+' : '-'}{fmt(t.valor)}
                      </span>
                    </motion.div>
                  )
                })
            }
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Modal: Nova Transação ── */}
      <AnimatePresence>
        {modalTransacao && (
          <Modal title="Nova Transação" onClose={() => setModalTransacao(false)}>
            <form onSubmit={submitTransacao}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={fieldLabel}>Data</label>
                  <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={fieldLabel}>Tipo</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['saida','entrada'].map(tipo => (
                      <button key={tipo} type="button" onClick={() => setForm(f => ({ ...f, tipo }))} style={{
                        flex: 1, padding: '8px 0', borderRadius: 7, cursor: 'pointer',
                        fontFamily: T.fontBody, fontSize: 12, fontWeight: 600,
                        border: form.tipo === tipo ? 'none' : `1px solid ${T.inkLt}`,
                        background: form.tipo === tipo ? (tipo === 'entrada' ? T.tealMd : T.charcoal) : 'rgba(255,255,255,0.45)',
                        color: form.tipo === tipo ? '#fff' : T.textSub,
                      }}>{tipo === 'entrada' ? 'Entrada' : 'Saída'}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={fieldLabel}>Valor (R$)</label>
                <input type="number" step="0.01" min="0" placeholder="0,00" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} style={inputStyle} required />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={fieldLabel}>Categoria</label>
                <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {CATEGORIAS_INPUT.map(c => <option key={c} value={c}>{CATEGORIAS_LABEL[c]}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={fieldLabel}>Descrição (opcional)</label>
                <input type="text" placeholder="ex: mercado, aluguel…" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={fieldLabel}>Forma de pagamento</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { key: 'pix',     label: 'Pix' },
                    { key: 'dinheiro', label: 'Dinheiro' },
                    { key: 'debito',  label: 'Débito' },
                    { key: 'credito', label: 'Crédito' },
                  ].map(op => (
                    <button key={op.key} type="button"
                      onClick={() => setForm(f => ({ ...f, tipo_pagamento: op.key }))}
                      style={{
                        flex: 1, minWidth: 64, padding: '7px 0', borderRadius: 7, cursor: 'pointer',
                        fontFamily: T.fontBody, fontSize: 11, fontWeight: 600,
                        border: form.tipo_pagamento === op.key ? 'none' : `1px solid ${T.inkLt}`,
                        background: form.tipo_pagamento === op.key ? T.teal : 'rgba(255,255,255,0.45)',
                        color: form.tipo_pagamento === op.key ? '#fff' : T.textSub,
                      }}>{op.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="custo_fixo" checked={form.custo_fixo} onChange={e => setForm(f => ({ ...f, custo_fixo: e.target.checked }))} style={{ accentColor: T.teal, width: 15, height: 15, cursor: 'pointer' }} />
                <label htmlFor="custo_fixo" style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSub, cursor: 'pointer' }}>Custo fixo</label>
              </div>
              <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={enviando} style={{
                width: '100%', padding: '11px 0', borderRadius: 9, border: 'none',
                background: enviando ? T.tealLt : T.teal, color: '#fff',
                fontSize: 14, fontWeight: 700, fontFamily: T.fontBody, cursor: enviando ? 'default' : 'pointer',
                boxShadow: `0 4px 16px rgba(0,68,68,0.25)`,
              }}>
                {enviando ? 'Salvando…' : 'Salvar'}
              </motion.button>
            </form>
          </Modal>
        )}

        {/* ── Modal: Configurações ── */}
        {modalConfig && (
          <Modal title="Configurações" onClose={() => setModalConfig(false)} maxWidth={480}>
            <form onSubmit={submitConfig}>
              <div style={{ marginBottom: 20 }}>
                <label style={fieldLabel}>Renda mensal (R$)</label>
                <input
                  type="number" step="0.01" min="0" placeholder="5000,00"
                  value={configForm.renda_mensal}
                  onChange={e => setConfigForm(f => ({ ...f, renda_mensal: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <span style={{ ...sectionLabel, marginBottom: 14 }}>Limites por Categoria</span>
              {centros.map(c => (
                <div key={c.id} style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'center' }}>
                  <label style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSub }}>
                    {CATEGORIAS_LABEL[c.categoria] || c.categoria}
                  </label>
                  <input
                    type="number" step="0.01" min="0"
                    value={configForm.limites[c.categoria] ?? c.limite_mensal}
                    onChange={e => setConfigForm(f => ({ ...f, limites: { ...f.limites, [c.categoria]: e.target.value } }))}
                    style={inputStyle}
                  />
                </div>
              ))}

              <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={salvando} style={{
                width: '100%', padding: '11px 0', borderRadius: 9, border: 'none', marginTop: 10,
                background: salvando ? T.tealLt : T.teal, color: '#fff',
                fontSize: 14, fontWeight: 700, fontFamily: T.fontBody, cursor: salvando ? 'default' : 'pointer',
                boxShadow: `0 4px 16px rgba(0,68,68,0.22)`,
              }}>
                {salvando ? 'Salvando…' : 'Salvar configurações'}
              </motion.button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded === 'ritmo' && (
          <ExpandModal key="ritmo" title={`Ritmo de gastos — ${selectedCat ? (CATEGORIAS_LABEL[selectedCat] || selectedCat) : 'Total'}`} onClose={() => setExpanded(null)}>
            <LineChart width={840} height={360} data={cumulativeData}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }} style={{ cursor: 'crosshair' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="dia" tick={{ fontSize: 10, fontFamily: T.fontBody, fill: T.textMut }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fontFamily: T.fontBody, fill: T.textMut }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<LineTooltip />} />
              <Line dataKey="referencia" name="Esperado" stroke={T.neutralLt} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              <Line dataKey="realizado" name="Realizado" stroke={T.tealVibrant} strokeWidth={2.5} dot={false} connectNulls={false} activeDot={{ r: 6, fill: T.tealVibrant, stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ExpandModal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expanded === 'barras' && (
          <ExpandModal key="barras" title="Realizado vs Limite por categoria" onClose={() => setExpanded(null)}>
            <BarChart width={840} height={360} data={dadosBarras} barCategoryGap="30%" barGap={4} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: T.fontBody, fill: T.textMut }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fontFamily: T.fontBody, fill: T.textMut }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="realizado" name="Realizado" radius={[4,4,0,0]}>
                {dadosBarras.map((entry, i) => {
                  const pct = entry.limite ? (entry.realizado / entry.limite * 100) : 0
                  return <Cell key={i} fill={percentColor(pct)} />
                })}
              </Bar>
              <Bar dataKey="limite" name="Limite" fill="rgba(0,68,68,0.10)" radius={[4,4,0,0]} />
            </BarChart>
          </ExpandModal>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
