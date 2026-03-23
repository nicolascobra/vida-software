import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import api from '../services/api'
import DateRangeSlider from '../components/DateRangeSlider'

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPOS = ['cafe', 'almoco', 'lanche', 'jantar', 'outro']
const TIPO_LABEL = {
  cafe: 'Café da manhã', cafe_da_manha: 'Café da manhã', pre_treino: 'Pré-treino',
  almoco: 'Almoço',
  lanche: 'Lanche', lanche_manha: 'Lanche manhã', lanche_tarde: 'Lanche tarde',
  jantar: 'Jantar', janta: 'Jantar', ceia: 'Ceia',
  outro: 'Outro',
}
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const TIPO_ORDER  = ['pre_treino','cafe_da_manha','cafe','lanche_manha','almoco','lanche','lanche_tarde','jantar','janta','ceia','outro']

// ─── Nutrient palette ─────────────────────────────────────────────────────────

const NUT = {
  prot:       '#7c4e32',
  protAlpha:  'rgba(124,78,50,0.10)',
  protBorder: 'rgba(124,78,50,0.26)',
  protHero:   '#c4855a',
  carb:       '#b8890a',
  carbAlpha:  'rgba(184,137,10,0.10)',
  carbBorder: 'rgba(184,137,10,0.26)',
  carbHero:   '#e5b60f',
  fat:        '#c4527a',
  fatAlpha:   'rgba(196,82,122,0.10)',
  fatBorder:  'rgba(196,82,122,0.26)',
  fatHero:    '#e879a0',
}

// ─── Paleta verde ─────────────────────────────────────────────────────────────

const T = {
  bgGradient:  '#ffffff',
  glass:       'rgba(255,255,255,0.52)',
  glassBorder: 'rgba(255,255,255,0.88)',
  blur:        'blur(28px) saturate(200%)',
  text:    '#1a2e1a',
  textSub: '#4a6b4a',
  textMut: 'rgba(53,79,54,0.50)',
  ink:     '#354f36',
  inkLt:   'rgba(113,179,64,0.18)',
  terra:       '#71b340',
  terraAlpha:  'rgba(113,179,64,0.10)',
  terraBorder: 'rgba(113,179,64,0.28)',
  caramelMd:   '#8fc040',
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
  boxShadow: '0 8px 32px rgba(53,79,54,0.08), 0 2px 0 rgba(255,255,255,0.95) inset',
}
const heroCard = {
  background: 'rgba(53,79,54,0.93)',
  backdropFilter: 'blur(28px) saturate(200%)',
  WebkitBackdropFilter: 'blur(28px) saturate(200%)',
  borderRadius: 14, padding: '22px 26px',
  border: '1px solid rgba(113,179,64,0.25)',
  boxShadow: '0 8px 40px rgba(53,79,54,0.32)',
}
const sectionLabel = {
  fontFamily: T.fontBody, fontSize: 10, fontWeight: 600,
  color: T.textMut, textTransform: 'uppercase',
  letterSpacing: '0.1em', marginBottom: 12, display: 'block',
}
const heroLabel = { ...sectionLabel, color: 'rgba(255,255,255,0.32)', marginBottom: 8 }
const inputStyle = {
  padding: '7px 10px', boxSizing: 'border-box',
  borderRadius: 7, border: '1px solid rgba(0,0,0,0.10)',
  background: 'rgba(255,255,255,0.70)', color: T.text,
  fontSize: 12, fontFamily: T.fontBody, outline: 'none',
}
const modalInputStyle = {
  width: '100%', padding: '8px 11px', boxSizing: 'border-box',
  borderRadius: 7, border: '1px solid rgba(255,255,255,0.65)',
  background: 'rgba(255,255,255,0.45)', color: T.text,
  fontSize: 13, fontFamily: T.fontBody, outline: 'none',
}

// ─── Motion ───────────────────────────────────────────────────────────────────

const springFluid = { type: 'spring', stiffness: 280, damping: 32 }
const springModal = { type: 'spring', stiffness: 360, damping: 28 }

// ─── ExpandBtn ────────────────────────────────────────────────────────────────

function ExpandBtn({ onClick }) {
  return (
    <button onClick={onClick} title="Expandir" style={{
      background: 'rgba(0,0,0,0.05)', border: `1px solid rgba(113,179,64,0.18)`,
      borderRadius: 6, width: 26, height: 26, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: T.textMut, fontSize: 12, flexShrink: 0,
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
        backgroundColor: 'rgba(200,220,200,0.40)',
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
          boxShadow: '0 24px 80px rgba(53,79,54,0.18), 0 2px 0 rgba(255,255,255,1) inset',
          padding: '24px 28px', width: '100%', maxWidth: 900,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: T.fontHead, fontSize: 16, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em' }}>{title}</span>
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

// ─── scoreColor helper ────────────────────────────────────────────────────────

function scoreColor(pct) {
  if (pct >= 0.85) return T.terra
  if (pct >= 0.65) return NUT.carbHero
  if (pct > 0)     return '#ef4444'
  return null
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 92 }) {
  const r    = (size - 14) / 2
  const circ = 2 * Math.PI * r
  const c    = scoreColor(score) || '#ef4444'
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
      <motion.circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={c} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={`${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - circ * Math.min(1, score) }}
        transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        transform={`rotate(-90, ${size/2}, ${size/2})`}
      />
      <text x={size/2} y={size/2 - 4} textAnchor="middle" dominantBaseline="middle"
        style={{ fill: '#fff', fontFamily: T.fontHead, fontSize: size * 0.24, fontWeight: 800 }}>
        {Math.round(Math.min(1, score) * 100)}%
      </text>
      <text x={size/2} y={size/2 + size * 0.19} textAnchor="middle"
        style={{ fill: c, fontFamily: T.fontBody, fontSize: size * 0.10, fontWeight: 700, letterSpacing: '0.04em' }}>
        {score >= 0.85 ? 'ON TRACK' : score >= 0.65 ? 'ATENÇÃO' : 'DEFICIT'}
      </text>
    </svg>
  )
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label: lbl, unit = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.95)',
      borderRadius: 10, padding: '8px 12px', fontSize: 12,
      fontFamily: T.fontBody, color: T.text, boxShadow: '0 4px 20px rgba(53,79,54,0.12)',
    }}>
      <p style={{ margin: '0 0 4px', color: T.textMut, fontSize: 11 }}>{lbl}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0' }}>
          <span style={{ color: p.fill || p.color, marginRight: 5 }}>■</span>
          {p.name}: <strong>{p.value}{unit}</strong>
        </p>
      ))}
    </div>
  )
}

// ─── Modal de refeição ────────────────────────────────────────────────────────

function ModalRefeicao({ onClose, onSave, enviando }) {
  const hoje = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    data: hoje, tipo: 'almoco', descricao: '', calorias: '',
    proteinas: '', carboidratos: '', gorduras: '',
  })
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))
  return (
    <motion.div
      key="modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }} onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backdropFilter: 'blur(18px) saturate(160%)', WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        backgroundColor: 'rgba(200,220,200,0.45)',
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
          boxShadow: '0 24px 80px rgba(53,79,54,0.18), 0 2px 0 rgba(255,255,255,1) inset',
          padding: '28px 32px', width: '100%', maxWidth: 440,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <span style={{ fontFamily: T.fontHead, fontSize: 17, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em' }}>Nova refeição</span>
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.05)', border: `1px solid ${T.inkLt}`,
            borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMut, fontSize: 16,
          }}>×</button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ ...sectionLabel, marginBottom: 5 }}>Data</label>
              <input type="date" value={form.data} onChange={e => set('data', e.target.value)} style={modalInputStyle} />
            </div>
            <div>
              <label style={{ ...sectionLabel, marginBottom: 5 }}>Refeição</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} style={{ ...modalInputStyle, cursor: 'pointer' }}>
                {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ ...sectionLabel, marginBottom: 5 }}>Alimento / Descrição</label>
            <input value={form.descricao} onChange={e => set('descricao', e.target.value)}
              placeholder="Ex: frango grelhado, arroz integral..." style={modalInputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 22 }}>
            {[
              { key: 'calorias',     label: 'Kcal',   color: T.ink  },
              { key: 'proteinas',    label: 'Prot. g', color: NUT.prot },
              { key: 'carboidratos', label: 'Carb. g', color: NUT.carb },
              { key: 'gorduras',     label: 'Gord. g', color: NUT.fat  },
            ].map(({ key, label, color }) => (
              <div key={key}>
                <label style={{ ...sectionLabel, marginBottom: 5, color }}>{label}</label>
                <input type="number" min="0" value={form[key]} onChange={e => set(key, e.target.value)}
                  placeholder="0" style={{ ...modalInputStyle, padding: '8px 8px' }} />
              </div>
            ))}
          </div>
          <motion.button type="submit" disabled={enviando || !form.descricao || !form.calorias}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', padding: '11px 0',
              background: enviando ? T.caramelMd : T.ink,
              border: 'none', borderRadius: 9, cursor: enviando ? 'wait' : 'pointer',
              color: '#fff', fontFamily: T.fontBody, fontSize: 13, fontWeight: 700,
            }}
          >{enviando ? 'Salvando…' : 'Salvar refeição'}</motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Alimentacao() {
  const userId  = localStorage.getItem('user_id') || 'nicolas'
  const hoje    = new Date()
  const hojeStr = hoje.toISOString().split('T')[0]

  const [mes,         setMes]         = useState(hoje.getMonth() + 1)
  const [ano,         setAno]         = useState(hoje.getFullYear())
  const [filterStart, setFilterStart] = useState(
    `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-01`
  )
  const [filterEnd,   setFilterEnd]   = useState(hojeStr)
  const [refeicoes,   setRefeicoes]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [enviando,    setEnviando]    = useState(false)

  const [chartView,     setChartView]     = useState('calorias')
  const [calMes,        setCalMes]        = useState(hoje.getMonth())
  const [calAno,        setCalAno]        = useState(hoje.getFullYear())
  const [hoveredCalDay, setHoveredCalDay] = useState(null)
  const [expandedMeal,  setExpandedMeal]  = useState(null)
  const [hoveredBullet,    setHoveredBullet]    = useState(null)
  const [hoveredCompilado, setHoveredCompilado] = useState(null)
  const [expanded,         setExpanded]         = useState(null)

  const metas = { calorias: 2000, proteinas: 150, carboidratos: 250, gorduras: 65 }
  const REFEICOES_PLANEJADAS = 4

  // ── Fetch ──────────────────────────────────────────────────────────────────

  async function fetchRefeicoes() {
    setLoading(true)
    try {
      const r = await api.get(`/alimentacao/itens-usuario/${userId}`, {
        params: { data_inicio: filterStart, data_fim: filterEnd },
      })
      setRefeicoes(r.data)
    } catch(e) { console.error(e) }
    finally    { setLoading(false) }
  }

  useEffect(() => { fetchRefeicoes() }, [filterStart, filterEnd])
  useEffect(() => {
    setFilterStart(`${ano}-${String(mes).padStart(2,'0')}-01`)
    setFilterEnd(new Date(ano, mes, 0).toISOString().split('T')[0])
  }, [mes, ano])

  async function salvarRefeicao(form) {
    if (!form.calorias || !form.descricao) return
    setEnviando(true)
    try {
      await api.post('/alimentacao/refeicao-item', {
        user_id: userId, data: form.data, tipo: form.tipo, descricao: form.descricao,
        calorias:     parseInt(form.calorias)       || 0,
        proteinas:    parseFloat(form.proteinas)    || 0,
        carboidratos: parseFloat(form.carboidratos) || 0,
        gorduras:     parseFloat(form.gorduras)     || 0,
      })
      setModalOpen(false)
      fetchRefeicoes()
    } catch(e) { console.error(e) }
    finally    { setEnviando(false) }
  }

  // ── Derivações ───────────────────────────────────────────────────────────────

  // Agrupado por dia
  const byDay = useMemo(() => {
    const m = {}
    refeicoes.forEach(r => {
      if (!m[r.data]) m[r.data] = { kcal: 0, prot: 0, carb: 0, fat: 0, tipos: new Set() }
      m[r.data].kcal += r.calorias     || 0
      m[r.data].prot += r.proteinas    || 0
      m[r.data].carb += r.carboidratos || 0
      m[r.data].fat  += r.gorduras     || 0
      m[r.data].tipos.add(r.tipo)
    })
    return m
  }, [refeicoes])

  // Score diário de cada dia (para heatmap)
  const dailyScore = useMemo(() => {
    const m = {}
    Object.entries(byDay).forEach(([ds, d]) => {
      const calPct  = Math.min(1, d.kcal / metas.calorias)
      const protPct = Math.min(1, d.prot / metas.proteinas)
      const mealPct = Math.min(1, d.tipos.size / REFEICOES_PLANEJADAS)
      m[ds] = {
        score: 0.4 * calPct + 0.4 * protPct + 0.2 * mealPct,
        calPct, protPct, mealPct,
      }
    })
    return m
  }, [byDay, metas])

  // Score de Adesão do período
  const adesao = useMemo(() => {
    const dias = Object.values(dailyScore)
    if (!dias.length) return { score: 0, calPct: 0, protPct: 0, mealPct: 0, n: 0 }
    const n = dias.length
    const calPct  = dias.reduce((s, d) => s + d.calPct,  0) / n
    const protPct = dias.reduce((s, d) => s + d.protPct, 0) / n
    const mealPct = dias.reduce((s, d) => s + d.mealPct, 0) / n
    return { score: 0.4 * calPct + 0.4 * protPct + 0.2 * mealPct, calPct, protPct, mealPct, n }
  }, [dailyScore])

  // Dados dos gráficos
  const calPorDia = useMemo(() =>
    Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, d]) => ({ dia: data.slice(8)+'/'+data.slice(5,7), kcal: Math.round(d.kcal), prot: Math.round(d.prot) })),
    [byDay]
  )

  // Agrupado por (data, tipo) — para o log
  const mealsByKey = useMemo(() => {
    const g = {}
    refeicoes.forEach(r => {
      const key = `${r.data}|${r.tipo}`
      if (!g[key]) g[key] = { key, data: r.data, tipo: r.tipo, items: [], kcal: 0, prot: 0, carb: 0, fat: 0 }
      g[key].items.push(r)
      g[key].kcal += r.calorias     || 0
      g[key].prot += r.proteinas    || 0
      g[key].carb += r.carboidratos || 0
      g[key].fat  += r.gorduras     || 0
    })
    return Object.values(g).sort((a, b) => {
      if (a.data !== b.data) return b.data.localeCompare(a.data)
      const ia = TIPO_ORDER.indexOf(a.tipo)
      const ib = TIPO_ORDER.indexOf(b.tipo)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    })
  }, [refeicoes])

  // Bullet: adesão por tipo de refeição — média de cal/prot/carb/fat vs meta esperada por refeição
  const bulletData = useMemo(() => {
    const tiposSet = new Set(refeicoes.map(r => r.tipo))
    const expectedKcal = metas.calorias    / REFEICOES_PLANEJADAS
    const expectedProt = metas.proteinas   / REFEICOES_PLANEJADAS
    const expectedCarb = metas.carboidratos / REFEICOES_PLANEJADAS
    const expectedFat  = metas.gorduras    / REFEICOES_PLANEJADAS

    return Array.from(tiposSet).sort().map(tipo => {
      const occ = mealsByKey.filter(m => m.tipo === tipo)
      const n   = occ.length || 1
      const avgKcal = occ.reduce((s, m) => s + m.kcal, 0) / n
      const avgProt = occ.reduce((s, m) => s + m.prot, 0) / n
      const avgCarb = occ.reduce((s, m) => s + m.carb, 0) / n
      const avgFat  = occ.reduce((s, m) => s + m.fat,  0) / n

      const calPct  = Math.min(100, Math.round(avgKcal / expectedKcal * 100))
      const protPct = Math.min(100, Math.round(avgProt / expectedProt * 100))
      const carbPct = Math.min(100, Math.round(avgCarb / expectedCarb * 100))
      const fatPct  = Math.min(100, Math.round(avgFat  / expectedFat  * 100))
      const overall = Math.round((calPct + protPct + carbPct + fatPct) / 4)

      return {
        tipo, label: TIPO_LABEL[tipo] || tipo,
        overall, calPct, protPct, carbPct, fatPct,
        avgKcal: Math.round(avgKcal), avgProt: Math.round(avgProt),
        avgCarb: Math.round(avgCarb), avgFat:  Math.round(avgFat),
        count: occ.length,
      }
    }).sort((a, b) => {
      const ia = TIPO_ORDER.indexOf(a.tipo)
      const ib = TIPO_ORDER.indexOf(b.tipo)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    })
  }, [refeicoes, mealsByKey, metas])

  // Total e média de calorias no período
  const calTotais = useMemo(() => {
    const total = refeicoes.reduce((s, r) => s + (r.calorias || 0), 0)
    const n = Math.max(1, Object.keys(byDay).length)
    return { total, avg: total / n, n: Object.keys(byDay).length }
  }, [refeicoes, byDay])

  // Médias diárias de macros
  const macrosMedios = useMemo(() => {
    const n = Math.max(1, Object.keys(byDay).length)
    return {
      prot: Math.round(refeicoes.reduce((s, r) => s + (r.proteinas    || 0), 0) / n),
      carb: Math.round(refeicoes.reduce((s, r) => s + (r.carboidratos || 0), 0) / n),
      fat:  Math.round(refeicoes.reduce((s, r) => s + (r.gorduras     || 0), 0) / n),
    }
  }, [refeicoes, byDay])

  // Análise por dia da semana (Seg-Dom)
  const byWeekday = useMemo(() => {
    const acc = {}
    for (let i = 0; i < 7; i++) acc[i] = { calPctSum: 0, protPctSum: 0, mealPctSum: 0, n: 0 }
    Object.entries(dailyScore).forEach(([ds, d]) => {
      const dow = new Date(ds + 'T12:00:00').getDay()
      acc[dow].calPctSum  += d.calPct
      acc[dow].protPctSum += d.protPct
      acc[dow].mealPctSum += d.mealPct
      acc[dow].n++
    })
    return [1,2,3,4,5,6,0].map(dow => {
      const { calPctSum, protPctSum, mealPctSum, n } = acc[dow]
      return {
        dia: DIAS_SEMANA[dow], n,
        cal:  n ? Math.round(calPctSum  / n * 100) : null,
        prot: n ? Math.round(protPctSum / n * 100) : null,
        meal: n ? Math.round(mealPctSum / n * 100) : null,
      }
    }).filter(d => d.n > 0)
  }, [dailyScore])

  // Compilado por alimento
  const compilado = useMemo(() => {
    const g = {}
    refeicoes.forEach(r => {
      const key = (r.descricao || '').toLowerCase().trim()
      if (!key) return
      if (!g[key]) g[key] = { nome: r.descricao, count: 0, kcal: 0, prot: 0, carb: 0, fat: 0 }
      g[key].count++
      g[key].kcal += r.calorias     || 0
      g[key].prot += r.proteinas    || 0
      g[key].carb += r.carboidratos || 0
      g[key].fat  += r.gorduras     || 0
    })
    return Object.values(g).sort((a, b) => b.kcal - a.kcal)
  }, [refeicoes])

  // Calendar
  const primeiroDiaSemana = new Date(calAno, calMes, 1).getDay()
  const totalDiasMes      = new Date(calAno, calMes + 1, 0).getDate()

  function navMes(dir) {
    let nm = mes + dir, na = ano
    if (nm < 1)  { nm = 12; na-- }
    if (nm > 12) { nm = 1;  na++ }
    setMes(nm); setAno(na)
  }
  function navCal(dir) {
    setCalMes(prev => {
      const novo = prev + dir
      if (novo < 0)  { setCalAno(a => a - 1); return 11 }
      if (novo > 11) { setCalAno(a => a + 1); return 0  }
      return novo
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{ minHeight: '100vh', background: T.bgGradient, fontFamily: T.fontBody }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 20px 60px' }}>

        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...springFluid, delay: 0.05 }} style={{ ...heroCard, marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 32, alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <ScoreRing score={adesao.score} size={96} />
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontFamily: T.fontBody, letterSpacing: '0.06em' }}>
                {adesao.n} dia{adesao.n !== 1 ? 's' : ''} analisados
              </span>
            </div>
            <div>
              <span style={heroLabel}>Adesão ao Plano Alimentar</span>
              {[
                { label: 'Calorias',  pct: adesao.calPct,  peso: '40%', color: T.terra     },
                { label: 'Proteínas', pct: adesao.protPct, peso: '40%', color: NUT.protHero },
                { label: 'Refeições', pct: adesao.mealPct, peso: '20%', color: '#a3d97c'   },
              ].map(({ label, pct, peso, color }) => (
                <div key={label} style={{ marginBottom: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: T.fontBody, fontSize: 11, color: 'rgba(255,255,255,0.62)' }}>
                      {label}<span style={{ color: 'rgba(255,255,255,0.24)', fontSize: 9, marginLeft: 5 }}>peso {peso}</span>
                    </span>
                    <span style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.88)' }}>
                      {Math.round(pct * 100)}%
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${Math.min(100, pct * 100)}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      style={{ height: '100%', borderRadius: 99, background: color }} />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <span style={heroLabel}>Média diária no período</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Proteína',    val: macrosMedios.prot, meta: metas.proteinas,    color: NUT.protHero, unit: 'g' },
                  { label: 'Carboidrato', val: macrosMedios.carb, meta: metas.carboidratos, color: NUT.carbHero, unit: 'g' },
                  { label: 'Gordura',     val: macrosMedios.fat,  meta: metas.gorduras,     color: NUT.fatHero,  unit: 'g' },
                ].map(({ label, val, meta, color, unit }) => (
                  <div key={label}>
                    <p style={{ fontFamily: T.fontHead, fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 2px', letterSpacing: '-0.03em' }}>
                      {val}<span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.30)', marginLeft: 2 }}>{unit}</span>
                    </p>
                    <p style={{ fontFamily: T.fontBody, fontSize: 9, color, margin: 0, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
                    <div style={{ height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
                      <motion.div animate={{ width: `${meta > 0 ? Math.min(100, val / meta * 100) : 0}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                        style={{ height: '100%', background: color, borderRadius: 99 }} />
                    </div>
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.20)', margin: '3px 0 0' }}>meta {meta}{unit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Controles ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <button onClick={() => navMes(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSub, fontSize: 16, padding: '2px 5px' }}>‹</button>
            <span style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 600, color: T.text, minWidth: 80, textAlign: 'center' }}>
              {MESES[mes - 1]} {ano}
            </span>
            <button onClick={() => navMes(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSub, fontSize: 16, padding: '2px 5px' }}>›</button>
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <DateRangeSlider filterStart={filterStart} filterEnd={filterEnd}
              setFilterStart={setFilterStart} setFilterEnd={setFilterEnd} accentColor={T.terra} />
          </div>
          <input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} style={{ ...inputStyle, width: 128 }} />
          <span style={{ color: T.textMut, fontSize: 12 }}>—</span>
          <input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} style={{ ...inputStyle, width: 128 }} />
          <button onClick={() => { setFilterStart(hojeStr); setFilterEnd(hojeStr) }}
            style={{
              background: filterStart === hojeStr && filterEnd === hojeStr ? T.ink : 'rgba(0,0,0,0.06)',
              border: 'none', borderRadius: 7, padding: '7px 12px', cursor: 'pointer',
              color: filterStart === hojeStr && filterEnd === hojeStr ? '#fff' : T.textSub,
              fontSize: 11, fontWeight: 700, fontFamily: T.fontBody, flexShrink: 0,
            }}>Hoje</button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setModalOpen(true)}
            style={{
              background: T.ink, border: 'none', borderRadius: 7,
              padding: '7px 14px', cursor: 'pointer', color: '#fff',
              fontSize: 11, fontWeight: 700, fontFamily: T.fontBody, flexShrink: 0,
            }}>+ Registrar refeição</motion.button>
        </div>

        {/* ── Conteúdo ── */}
        {loading ? (
          <p style={{ color: T.textMut, fontSize: 13, textAlign: 'center', padding: '48px 0' }}>Carregando…</p>
        ) : refeicoes.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: '52px 24px' }}>
            <p style={{ fontSize: 36, margin: '0 0 14px' }}>🥦</p>
            <p style={{ fontFamily: T.fontHead, fontSize: 16, fontWeight: 700, color: T.ink, margin: '0 0 8px' }}>Nenhum registro no período</p>
            <p style={{ fontSize: 13, color: T.textMut, margin: 0 }}>Registre uma refeição ou ajuste o filtro de datas.</p>
          </div>
        ) : (
          <>
            {/* ── Row 1: [Kcal+Bullet] | Gráfico toggle | [Calendário+Macros] ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr', gap: 14, marginBottom: 14, alignItems: 'start' }}>

              {/* Col 1: mini kcal card + bullet journal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Mini card de calorias */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ ...springFluid, delay: 0.06 }}
                style={{ ...card, padding: '14px 18px', background: 'rgba(53,79,54,0.05)', border: `1px solid ${T.inkLt}` }}>
                <span style={sectionLabel}>Calorias no período</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: T.fontHead, fontSize: 30, fontWeight: 800, color: T.ink, letterSpacing: '-0.03em' }}>
                    {Math.round(calTotais.total).toLocaleString('pt-BR')}
                  </span>
                  <span style={{ fontSize: 10, color: T.textMut }}>kcal</span>
                </div>
                <div style={{ fontSize: 11, marginTop: 3 }}>
                  <span style={{ fontWeight: 700, color: T.terra }}>{Math.round(calTotais.avg)}</span>
                  <span style={{ color: T.textMut }}> kcal/dia · {calTotais.n} dia{calTotais.n !== 1 ? 's' : ''}</span>
                </div>
              </motion.div>

              {/* Bullet journal — adesão por tipo */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }} transition={{ ...springFluid, delay: 0.08 }} style={card}>
                <span style={sectionLabel}>Adesão por refeição</span>
                {bulletData.map(({ tipo, label, overall, calPct, protPct, carbPct, fatPct, avgKcal, avgProt, avgCarb, avgFat, count }) => {
                  const c      = overall >= 85 ? T.terra : overall >= 60 ? NUT.carb : '#ef4444'
                  const alpha  = overall >= 85 ? T.terraAlpha : overall >= 60 ? NUT.carbAlpha : 'rgba(239,68,68,0.10)'
                  const border = overall >= 85 ? T.terraBorder : overall >= 60 ? NUT.carbBorder : 'rgba(239,68,68,0.28)'
                  const isHov  = hoveredBullet === tipo
                  return (
                    <div key={tipo} style={{ marginBottom: 3 }}
                      onMouseEnter={() => setHoveredBullet(tipo)}
                      onMouseLeave={() => setHoveredBullet(null)}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 8px', borderRadius: 8,
                        background: isHov ? 'rgba(53,79,54,0.06)' : 'transparent',
                        transition: 'background 0.15s',
                      }}>
                        <div>
                          <span style={{ fontFamily: T.fontBody, fontSize: 11, color: T.text, fontWeight: 600 }}>{label}</span>
                          <span style={{ fontSize: 9, color: T.textMut, marginLeft: 5 }}>{count}×</span>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: c, background: alpha, border: `1px solid ${border}`, borderRadius: 20, padding: '1px 8px' }}>
                          {overall}%
                        </span>
                      </div>
                      <AnimatePresence>
                        {isHov && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}
                            style={{ overflow: 'hidden', padding: '0 8px 6px' }}>
                            {[
                              { label: 'Kcal',  pct: calPct,  val: avgKcal, unit: 'kcal', color: T.terra  },
                              { label: 'Prot',  pct: protPct, val: avgProt, unit: 'g',    color: NUT.prot },
                              { label: 'Carb',  pct: carbPct, val: avgCarb, unit: 'g',    color: NUT.carb },
                              { label: 'Gord',  pct: fatPct,  val: avgFat,  unit: 'g',    color: NUT.fat  },
                            ].map(({ label: ml, pct, val, unit, color }) => (
                              <div key={ml} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                                <span style={{ fontSize: 8, color, fontWeight: 700, width: 24, flexShrink: 0 }}>{ml}</span>
                                <div style={{ flex: 1, height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                                  <motion.div animate={{ width: `${pct}%` }}
                                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                                    style={{ height: '100%', background: color, borderRadius: 99 }} />
                                </div>
                                <span style={{ fontSize: 8, color: T.textMut, width: 36, textAlign: 'right', flexShrink: 0 }}>{val}{unit}</span>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </motion.div>
              </div>{/* fim col 1 */}

              {/* Gráfico com toggle */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }} transition={{ ...springFluid, delay: 0.10 }} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ ...sectionLabel, marginBottom: 0 }}>
                    {chartView === 'calorias' ? 'Calorias' : 'Proteínas'} — dia a dia
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ExpandBtn onClick={() => setExpanded('grafico')} />
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: 8, padding: 3, gap: 2 }}>
                      {[{ key: 'calorias', label: 'Calorias' }, { key: 'proteinas', label: 'Proteínas' }].map(({ key, label }) => (
                        <button key={key} onClick={() => setChartView(key)} style={{
                          padding: '4px 12px', border: 'none', borderRadius: 6, cursor: 'pointer',
                          fontFamily: T.fontBody, fontSize: 11, fontWeight: 600,
                          background: chartView === key ? (key === 'calorias' ? T.terra : NUT.prot) : 'transparent',
                          color: chartView === key ? '#fff' : T.textMut,
                          transition: 'all 0.18s ease',
                        }}>{label}</button>
                      ))}
                    </div>
                  </div>
                </div>
                {calPorDia.length < 2
                  ? <p style={{ fontSize: 12, color: T.textMut, textAlign: 'center', padding: '28px 0', margin: 0 }}>Poucos dias para o gráfico.</p>
                  : <ResponsiveContainer width="100%" height={210}>
                      <ComposedChart data={calPorDia} margin={{ top: 8, right: 6, bottom: 0, left: -12 }}
                        barSize={Math.max(4, Math.min(16, Math.floor(240 / calPorDia.length)))}>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(53,79,54,0.06)" vertical={false} />
                        <XAxis dataKey="dia" tick={{ fontSize: 8, fill: T.textMut, fontFamily: T.fontBody }}
                          axisLine={false} tickLine={false} interval={Math.ceil(calPorDia.length / 8)} />
                        <YAxis tick={{ fontSize: 8, fill: T.textMut, fontFamily: T.fontBody }}
                          axisLine={false} tickLine={false} width={30} />
                        <Tooltip content={<ChartTooltip unit={chartView === 'calorias' ? ' kcal' : 'g'} />}
                          cursor={{ fill: chartView === 'calorias' ? 'rgba(113,179,64,0.06)' : NUT.protAlpha }} />
                        <ReferenceLine y={chartView === 'calorias' ? metas.calorias : metas.proteinas}
                          stroke={chartView === 'calorias' ? T.terra : NUT.prot}
                          strokeDasharray="4 3" strokeWidth={1.5}
                          label={{ value: chartView === 'calorias' ? `${metas.calorias} kcal` : `${metas.proteinas}g`, position: 'insideTopRight', fontSize: 8, fill: chartView === 'calorias' ? T.terra : NUT.prot, fontFamily: T.fontBody }} />
                        <Bar dataKey={chartView === 'calorias' ? 'kcal' : 'prot'}
                          name={chartView === 'calorias' ? 'Calorias' : 'Proteínas'}
                          fill={chartView === 'calorias' ? T.terra : NUT.prot} radius={[3,3,0,0]} />
                      </ComposedChart>
                    </ResponsiveContainer>
                }
                {/* Análise por dia da semana */}
                {byWeekday.length > 1 && (
                  <>
                    <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '14px 0 10px' }} />
                    <span style={{ ...sectionLabel, marginBottom: 8 }}>Adesão por dia da semana</span>
                    <ResponsiveContainer width="100%" height={100}>
                      <ComposedChart data={byWeekday} margin={{ top: 2, right: 4, bottom: 0, left: -20 }} barSize={9} barGap={1}>
                        <CartesianGrid strokeDasharray="2 4" stroke="rgba(53,79,54,0.06)" vertical={false} />
                        <XAxis dataKey="dia" tick={{ fontSize: 8, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 7, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} width={22} tickFormatter={v => `${v}%`} />
                        <Tooltip content={({ active, payload, label: lbl }) => active && payload?.length ? (
                          <div style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontFamily: T.fontBody, color: T.text }}>
                            <p style={{ margin: '0 0 3px', color: T.textMut, fontSize: 10 }}>{lbl}</p>
                            {payload.map((p, i) => <p key={i} style={{ margin: '2px 0' }}><span style={{ color: p.fill, marginRight: 4 }}>■</span>{p.name}: <strong>{p.value}%</strong></p>)}
                          </div>
                        ) : null} cursor={{ fill: 'rgba(53,79,54,0.04)' }} />
                        <Bar dataKey="cal"  name="Calorias"  fill={T.terra}  radius={[2,2,0,0]} />
                        <Bar dataKey="prot" name="Proteínas" fill={NUT.prot} radius={[2,2,0,0]} />
                        <Bar dataKey="meal" name="Refeições" fill="#a3d97c"  radius={[2,2,0,0]} />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
                      {[{ color: T.terra, label: 'Calorias' }, { color: NUT.prot, label: 'Proteínas' }, { color: '#a3d97c', label: 'Refeições' }].map(({ color, label }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                          <span style={{ fontSize: 8, color: T.textMut, fontFamily: T.fontBody }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>

              {/* Col 3: calendário + macros */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Calendário heatmap — superior direito */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }} transition={{ ...springFluid, delay: 0.12 }} style={card}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <button onClick={() => navCal(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSub, fontSize: 15, padding: '1px 4px' }}>‹</button>
                  <span style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 600, color: T.text }}>
                    {MESES[calMes].slice(0,3)} {calAno}
                  </span>
                  <button onClick={() => navCal(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSub, fontSize: 15, padding: '1px 4px' }}>›</button>
                </div>
                {/* Dias da semana */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 3 }}>
                  {DIAS_SEMANA.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 7, color: T.textMut, fontWeight: 600, fontFamily: T.fontBody }}>{d}</div>
                  ))}
                </div>
                {/* Grid de dias */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, position: 'relative' }}>
                  {Array.from({ length: primeiroDiaSemana }).map((_, i) => <div key={`pad-${i}`} />)}
                  {Array.from({ length: totalDiasMes }, (_, i) => i + 1).map(dia => {
                    const ds   = `${calAno}-${String(calMes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
                    const isFut = ds > hojeStr
                    const data = dailyScore[ds]
                    const sc   = data?.score ?? null
                    const c    = isFut ? null : sc
                    const bg   = isFut ? 'rgba(0,0,0,0.03)'
                                : sc === null ? 'rgba(0,0,0,0.05)'
                                : sc >= 0.85  ? 'rgba(113,179,64,0.82)'
                                : sc >= 0.65  ? 'rgba(229,182,15,0.75)'
                                : 'rgba(239,68,68,0.60)'
                    const col  = isFut || sc === null ? T.textMut : '#fff'
                    const isHoje = ds === hojeStr
                    const isHov  = hoveredCalDay === ds
                    return (
                      <div key={dia} style={{ position: 'relative' }}>
                        <div
                          onMouseEnter={() => data && setHoveredCalDay(ds)}
                          onMouseLeave={() => setHoveredCalDay(null)}
                          style={{
                            aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: 4, background: bg,
                            fontSize: 8, fontWeight: sc !== null ? 700 : 400, color: col,
                            fontFamily: T.fontBody, cursor: data ? 'default' : 'default',
                            outline: isHoje ? `2px solid ${T.ink}` : 'none', outlineOffset: '-1px',
                          }}
                        >{dia}</div>

                        {/* Tooltip por dia */}
                        {isHov && data && (
                          <div style={{
                            position: 'absolute', zIndex: 20,
                            bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                            background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10,
                            padding: '9px 12px', minWidth: 148, pointerEvents: 'none',
                            boxShadow: '0 4px 20px rgba(53,79,54,0.14)',
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: T.ink, fontFamily: T.fontHead }}>
                                {dia}/{calMes+1}
                              </span>
                              <span style={{
                                fontSize: 10, fontWeight: 800,
                                color: scoreColor(data.score) || T.ink,
                                background: data.score >= 0.85 ? T.terraAlpha : data.score >= 0.65 ? NUT.carbAlpha : 'rgba(239,68,68,0.10)',
                                border: `1px solid ${scoreColor(data.score) || T.ink}33`,
                                borderRadius: 20, padding: '1px 7px',
                              }}>{Math.round(data.score * 100)}%</span>
                            </div>
                            {[
                              { label: 'Calorias',  pct: data.calPct,  color: T.terra    },
                              { label: 'Proteínas', pct: data.protPct, color: NUT.prot   },
                              { label: 'Refeições', pct: data.mealPct, color: '#71b340'  },
                            ].map(({ label, pct, color }) => (
                              <div key={label} style={{ marginBottom: 5 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                  <span style={{ fontSize: 9, color: T.textSub }}>{label}</span>
                                  <span style={{ fontSize: 9, fontWeight: 700, color }}>{Math.round(pct * 100)}%</span>
                                </div>
                                <div style={{ height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.min(100, pct * 100)}%`, background: color, borderRadius: 99 }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Legenda */}
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {[
                    { color: 'rgba(113,179,64,0.82)', label: '≥85%' },
                    { color: 'rgba(229,182,15,0.75)', label: '65–84%' },
                    { color: 'rgba(239,68,68,0.60)',  label: '<65%'  },
                  ].map(({ color, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                      <span style={{ fontSize: 8, color: T.textMut, fontFamily: T.fontBody }}>{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Macros — abaixo do calendário */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ ...springFluid, delay: 0.14 }} style={card}>
                <span style={sectionLabel}>Macros do período</span>
                {[
                  { label: 'Proteínas',    val: macrosMedios.prot, meta: metas.proteinas,    color: NUT.prot, alpha: NUT.protAlpha, border: NUT.protBorder },
                  { label: 'Carboidratos', val: macrosMedios.carb, meta: metas.carboidratos, color: NUT.carb, alpha: NUT.carbAlpha, border: NUT.carbBorder },
                  { label: 'Gorduras',     val: macrosMedios.fat,  meta: metas.gorduras,     color: NUT.fat,  alpha: NUT.fatAlpha,  border: NUT.fatBorder  },
                ].map(({ label, val, meta, color, alpha, border }) => {
                  const pct = meta > 0 ? Math.min(100, Math.round(val / meta * 100)) : 0
                  return (
                    <div key={label} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 600, color: T.text }}>{label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 800, color }}>{val}g</span>
                          <span style={{ fontSize: 9, color, background: alpha, border: `1px solid ${border}`, borderRadius: 20, padding: '1px 6px', fontWeight: 700 }}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: 4, borderRadius: 99, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <motion.div animate={{ width: `${pct}%` }}
                          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                          style={{ height: '100%', borderRadius: 99, background: color }} />
                      </div>
                      <span style={{ fontSize: 9, color: T.textMut, fontFamily: T.fontBody }}>meta {meta}g/dia</span>
                    </div>
                  )
                })}
              </motion.div>
              </div>{/* fim col 3 */}
            </div>{/* fim Row 1 */}

            {/* ── Row 2: Log | Compilado ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>

              {/* Log de refeições */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }} transition={{ ...springFluid, delay: 0.16 }}
                style={{ ...card, padding: '16px 18px' }}>
                <span style={sectionLabel}>Refeições no período</span>
                <div>
                  {mealsByKey.slice(0, 30).map(meal => {
                    const isOpen = expandedMeal === meal.key
                    return (
                      <div key={meal.key} style={{ marginBottom: 5 }}
                        onMouseEnter={() => setExpandedMeal(meal.key)}
                        onMouseLeave={() => setExpandedMeal(null)}>
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '7px 10px',
                          background: isOpen ? 'rgba(53,79,54,0.07)' : 'rgba(255,255,255,0.42)',
                          border: `1px solid ${isOpen ? 'rgba(113,179,64,0.22)' : 'rgba(255,255,255,0.62)'}`,
                          borderRadius: isOpen ? '9px 9px 0 0' : 9,
                          transition: 'background 0.15s, border-color 0.15s',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{
                              fontSize: 9, fontWeight: 700, color: T.terra,
                              background: T.terraAlpha, border: `1px solid ${T.terraBorder}`,
                              borderRadius: 20, padding: '1px 7px',
                              textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
                            }}>{TIPO_LABEL[meal.tipo] || meal.tipo}</span>
                            <span style={{ fontSize: 10, color: T.textMut, flexShrink: 0 }}>
                              {meal.data.slice(8)}/{meal.data.slice(5,7)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {meal.prot > 0 && (
                              <span style={{ fontSize: 9, color: NUT.prot, fontWeight: 700, background: NUT.protAlpha, border: `1px solid ${NUT.protBorder}`, borderRadius: 20, padding: '1px 5px' }}>
                                {Math.round(meal.prot)}g P
                              </span>
                            )}
                            <span style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 800, color: T.ink }}>
                              {Math.round(meal.kcal)} kcal
                            </span>
                          </div>
                        </div>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.16 }}
                              style={{
                                overflow: 'hidden', background: 'rgba(53,79,54,0.04)',
                                border: '1px solid rgba(113,179,64,0.22)',
                                borderTop: 'none', borderRadius: '0 0 9px 9px',
                              }}>
                              <div style={{ padding: '6px 10px 8px' }}>
                                {meal.items.map((item, idx) => (
                                  <div key={idx} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '4px 0',
                                    borderBottom: idx < meal.items.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                  }}>
                                    <span style={{ fontSize: 11, color: T.text }}>{item.descricao}</span>
                                    <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginLeft: 8 }}>
                                      {item.proteinas > 0 && <span style={{ fontSize: 9, color: NUT.prot, fontWeight: 700 }}>{Math.round(item.proteinas)}g P</span>}
                                      {item.carboidratos > 0 && <span style={{ fontSize: 9, color: NUT.carb, fontWeight: 700 }}>{Math.round(item.carboidratos)}g C</span>}
                                      {item.gorduras > 0 && <span style={{ fontSize: 9, color: NUT.fat, fontWeight: 700 }}>{Math.round(item.gorduras)}g G</span>}
                                      <span style={{ fontSize: 10, fontWeight: 700, color: T.ink }}>{Math.round(item.calorias)} kcal</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Compilado de alimentos */}
              {compilado.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -3 }} transition={{ ...springFluid, delay: 0.18 }}
                  style={{ ...card, padding: '16px 18px' }}>
                  <span style={sectionLabel}>Compilado de alimentos</span>
                  <div>
                    {compilado.map((item) => {
                      const isHov = hoveredCompilado === item.nome
                      return (
                        <div key={item.nome} style={{ marginBottom: 2 }}
                          onMouseEnter={() => setHoveredCompilado(item.nome)}
                          onMouseLeave={() => setHoveredCompilado(null)}>
                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '6px 8px', borderRadius: 8,
                            background: isHov ? 'rgba(53,79,54,0.06)' : 'transparent',
                            transition: 'background 0.15s',
                          }}>
                            <span style={{ fontSize: 11, color: T.text, fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
                              {item.nome}
                            </span>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 9, color: T.textMut }}>{item.count}×</span>
                              <span style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, color: T.ink }}>{Math.round(item.kcal)} kcal</span>
                            </div>
                          </div>
                          <AnimatePresence>
                            {isHov && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.14 }}
                                style={{ overflow: 'hidden', padding: '0 8px 6px' }}>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 9, color: NUT.prot, fontWeight: 700 }}>{Math.round(item.prot)}g prot</span>
                                  <span style={{ fontSize: 9, color: NUT.carb, fontWeight: 700 }}>{Math.round(item.carb)}g carb</span>
                                  <span style={{ fontSize: 9, color: NUT.fat,  fontWeight: 700 }}>{Math.round(item.fat)}g gord</span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {expanded === 'grafico' && (
          <ExpandModal key="grafico" title={`${chartView === 'calorias' ? 'Calorias' : 'Proteínas'} — dia a dia`} onClose={() => setExpanded(null)}>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={calPorDia} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
                barSize={Math.max(6, Math.min(24, Math.floor(400 / calPorDia.length)))}>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(53,79,54,0.06)" vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 10, fill: T.textMut, fontFamily: T.fontBody }}
                  axisLine={false} tickLine={false} interval={Math.ceil(calPorDia.length / 12)} />
                <YAxis tick={{ fontSize: 10, fill: T.textMut, fontFamily: T.fontBody }}
                  axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip unit={chartView === 'calorias' ? ' kcal' : 'g'} />}
                  cursor={{ fill: chartView === 'calorias' ? 'rgba(113,179,64,0.06)' : NUT.protAlpha }} />
                <ReferenceLine y={chartView === 'calorias' ? metas.calorias : metas.proteinas}
                  stroke={chartView === 'calorias' ? T.terra : NUT.prot}
                  strokeDasharray="4 3" strokeWidth={1.5}
                  label={{ value: chartView === 'calorias' ? `${metas.calorias} kcal` : `${metas.proteinas}g`, position: 'insideTopRight', fontSize: 10, fill: chartView === 'calorias' ? T.terra : NUT.prot, fontFamily: T.fontBody }} />
                <Bar dataKey={chartView === 'calorias' ? 'kcal' : 'prot'}
                  name={chartView === 'calorias' ? 'Calorias' : 'Proteínas'}
                  fill={chartView === 'calorias' ? T.terra : NUT.prot} radius={[4,4,0,0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </ExpandModal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && (
          <ModalRefeicao onClose={() => setModalOpen(false)} onSave={salvarRefeicao} enviando={enviando} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
