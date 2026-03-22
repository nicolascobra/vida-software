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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val ?? 0)
}

function percentColor(pct) {
  if (pct == null) return T.alertGood
  if (pct >= 90)  return T.alertOver  // laranja
  if (pct >= 70)  return T.alertWarn  // laranja escuro
  return T.alertGood                  // teal vibrante
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

function CategoriaBar({ categoria, realizado, limite, percentual, selected, onClick }) {
  const pct   = percentual ?? (limite ? Math.round(realizado / limite * 100) : null)
  const cor   = percentColor(pct)
  const label = CATEGORIAS_LABEL[categoria] || categoria

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={springFluid}
      onClick={onClick}
      style={{
        marginBottom: 13, cursor: 'pointer', padding: '8px 10px', borderRadius: 9,
        background: selected ? 'rgba(0,68,68,0.07)' : 'transparent',
        border: selected ? `1px solid ${T.tealBorder}` : '1px solid transparent',
        transition: 'background 0.15s, border 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'baseline' }}>
        <span style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 600, color: selected ? T.teal : T.text }}>
          {label}
        </span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontFamily: T.fontBody, fontSize: 11, color: T.textMut }}>
            {fmt(realizado)}{limite ? ` / ${fmt(limite)}` : ''}
          </span>
          {pct != null && (
            <span style={{ fontFamily: T.fontBody, fontSize: 10, fontWeight: 700, color: cor, minWidth: 30, textAlign: 'right' }}>
              {pct}%
            </span>
          )}
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
  const [dayDetail,   setDayDetail]   = useState(null) // { data, transacoes }

  // modais
  const [modalTransacao, setModalTransacao] = useState(false)
  const [modalConfig,    setModalConfig]    = useState(false)
  const [enviando,       setEnviando]       = useState(false)
  const [salvando,       setSalvando]       = useState(false)

  const [form, setForm] = useState({
    data: hoje.toISOString().split('T')[0],
    tipo: 'saida', valor: '', categoria: 'alimentacao', descricao: '', custo_fixo: false,
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
    const filterFn     = t => t.tipo === 'saida' && (!selectedCat || t.categoria === selectedCat)

    const byDay = {}
    transacoes.filter(filterFn).forEach(t => {
      const day = parseInt(t.data.split('-')[2])
      byDay[day] = (byDay[day] || 0) + t.valor
    })

    let cumul = 0
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      cumul += byDay[day] || 0
      return {
        dia: day,
        realizado: Math.round(cumul * 100) / 100,
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

  const { totalFixo, totalVariavel } = useMemo(() => {
    let fix = 0, vari = 0
    transacoes.filter(t => t.tipo === 'saida').forEach(t => {
      t.custo_fixo ? (fix += t.valor) : (vari += t.valor)
    })
    return { totalFixo: fix, totalVariavel: vari }
  }, [transacoes])

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
      setForm({ data: hoje.toISOString().split('T')[0], tipo: 'saida', valor: '', categoria: 'alimentacao', descricao: '', custo_fixo: false })
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
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 24, alignItems: 'start' }}>
            <div>
              <span style={heroLabel}>Saldo do mês</span>
              <p style={{ fontFamily: T.fontHead, fontSize: 30, fontWeight: 800, color: saldo >= 0 ? T.tealVibrant : '#f87171', margin: 0, letterSpacing: '-0.04em' }}>
                {fmt(saldo)}
              </p>
            </div>
            <div>
              <span style={heroLabel}>Entradas</span>
              <p style={{ fontFamily: T.fontHead, fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>
                {fmt(resumo?.total_entradas)}
              </p>
            </div>
            <div>
              <span style={heroLabel}>Saídas</span>
              <p style={{ fontFamily: T.fontHead, fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.70)', margin: 0, letterSpacing: '-0.03em' }}>
                {fmt(resumo?.total_saidas)}
              </p>
            </div>
            <div>
              <span style={heroLabel}>Composição</span>
              <div style={{ display: 'flex', gap: 16, marginTop: 2 }}>
                <div>
                  <span style={{ fontFamily: T.fontBody, fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fixo</span>
                  <p style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.50)', margin: '2px 0 0' }}>{fmt(totalFixo)}</p>
                </div>
                <div>
                  <span style={{ fontFamily: T.fontBody, fontSize: 9, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Variável</span>
                  <p style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.50)', margin: '2px 0 0' }}>{fmt(totalVariavel)}</p>
                </div>
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

        {/* ── 3 colunas ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2.4fr 1.6fr', gap: 14 }}>

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
              {loading
                ? <p style={{ color: T.textMut, fontSize: 13 }}>Carregando…</p>
                : categoriasComDados.length === 0
                  ? <p style={{ color: T.textMut, fontSize: 13 }}>Sem dados este mês.</p>
                  : categoriasComDados.map(c => (
                      <CategoriaBar
                        key={c.categoria}
                        categoria={c.categoria}
                        realizado={c.realizado}
                        limite={c.limite_mensal}
                        percentual={c.percentual}
                        selected={selectedCat === c.categoria}
                        onClick={() => setSelectedCat(prev => prev === c.categoria ? null : c.categoria)}
                      />
                    ))
              }
            </motion.div>
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
              <div style={{ marginBottom: 10 }}>
                <span style={sectionLabel}>
                  Ritmo de gastos — {selectedCat ? (CATEGORIAS_LABEL[selectedCat] || selectedCat) : 'Total'}
                </span>
                <p style={{ fontFamily: T.fontBody, fontSize: 10, color: T.textMut, margin: 0, lineHeight: 1.4 }}>
                  Linha sólida = realizado · Tracejada = ritmo esperado linear até o limite
                </p>
              </div>
              <p style={{ fontFamily: T.fontBody, fontSize: 10, color: T.tealVibrant, margin: '0 0 6px', cursor: 'default' }}>
                Clique em um ponto para ver as transações do dia
              </p>
              <ResponsiveContainer width="100%" height={160}>
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
                  }}
                  style={{ cursor: 'crosshair' }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 9, fontFamily: T.fontBody, fill: T.textMut }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 9, fontFamily: T.fontBody, fill: T.textMut }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<LineTooltip />} />
                  <Line dataKey="referencia" name="Esperado" stroke={T.neutralLt} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                  <Line dataKey="realizado"  name="Realizado" stroke={T.tealVibrant} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: T.tealVibrant, stroke: '#fff', strokeWidth: 2 }} />
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
              <span style={sectionLabel}>Realizado vs Limite</span>
              <ResponsiveContainer width="100%" height={170}>
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
                      onClick={() => !isFuturo && setDayDetail({ data: dataStr, transacoes: dayTrans })}
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
              <div style={{ display: 'flex', gap: 8, marginTop: 10, fontSize: 10, fontFamily: T.fontBody, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: T.textMut }}>sem mov.</span>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(0,182,173,0.28)', display: 'inline-block' }} />
                <span style={{ color: T.alertGood }}>entrada</span>
                <span style={{ color: T.textMut, margin: '0 2px' }}>·</span>
                {['rgba(255,116,0,0.09)','rgba(255,116,0,0.22)','rgba(255,116,0,0.50)','rgba(255,116,0,0.85)'].map((bg, i) => (
                  <span key={i} style={{ width: 12, height: 12, borderRadius: 3, background: bg, display: 'inline-block' }} />
                ))}
                <span style={{ color: T.orange }}>saída</span>
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
    </motion.div>
  )
}
