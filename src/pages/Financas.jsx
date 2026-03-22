import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import api from '../services/api'

// ─── Constantes ───────────────────────────────────────────────────────────────

const CATEGORIAS_INPUT = ['alimentacao', 'transporte', 'lazer', 'saude', 'moradia', 'investimento', 'salario', 'outro']
const CATEGORIAS_LABEL = {
  alimentacao: 'Alimentação', transporte: 'Transporte', lazer: 'Lazer',
  saude: 'Saúde', moradia: 'Moradia', investimento: 'Investimento',
  salario: 'Salário', outro: 'Outro',
}
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

// ─── Tokens ───────────────────────────────────────────────────────────────────

const T = {
  bgGradient:  'linear-gradient(135deg, #d4d4d4 0%, #e8e8e8 40%, #f4f4f4 70%, #ffffff 100%)',
  glass:       'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.90)',
  blur:        'blur(28px) saturate(200%)',
  text:    '#0a0a0a',
  textSub: '#525252',
  textMut: '#a3a3a3',
  ink:     '#0a0a0a',
  inkMd:   '#737373',
  inkLt:   '#e5e5e5',
  // paleta teal
  teal:      '#004444',
  tealMd:    '#005555',
  tealLt:    '#006666',
  tealXLt:   '#007777',
  tealDark:  '#003333',
  tealAlpha: 'rgba(0,68,68,0.08)',
  tealBorder:'rgba(0,68,68,0.18)',
  // semântica
  green:  '#16a34a',
  red:    '#dc2626',
  yellow: '#ca8a04',
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
  boxShadow: '0 2px 20px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,1) inset',
}

const heroCard = {
  background: 'rgba(0,51,51,0.92)',
  backdropFilter: 'blur(28px) saturate(200%)',
  WebkitBackdropFilter: 'blur(28px) saturate(200%)',
  borderRadius: 14,
  padding: '20px 22px',
  border: '1px solid rgba(0,119,119,0.25)',
  boxShadow: '0 8px 40px rgba(0,51,51,0.30)',
}

const sectionLabel = {
  fontFamily: T.fontBody, fontSize: 10, fontWeight: 600,
  color: T.textMut, textTransform: 'uppercase',
  letterSpacing: '0.1em', marginBottom: 12, display: 'block',
}
const heroLabel  = { ...sectionLabel, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }
const fieldLabel = { fontFamily: T.fontBody, fontSize: 12, fontWeight: 500, color: T.textSub, display: 'block', marginBottom: 5 }
const inputStyle = {
  width: '100%', padding: '8px 11px', boxSizing: 'border-box',
  borderRadius: 7, border: '1px solid rgba(255,255,255,0.65)',
  background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)', color: T.text,
  fontSize: 13, fontFamily: T.fontBody, outline: 'none',
}

// ─── Framer Motion ────────────────────────────────────────────────────────────

const springSnappy = { type: 'spring', stiffness: 460, damping: 28 }
const springFluid  = { type: 'spring', stiffness: 280, damping: 32 }
const springModal  = { type: 'spring', stiffness: 360, damping: 28 }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val ?? 0)
}

function percentColor(pct) {
  if (pct == null) return T.teal
  if (pct >= 100) return T.red
  if (pct >= 80)  return T.yellow
  return T.teal
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

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
          <span style={{ color: p.color || T.teal, marginRight: 4 }}>■</span>
          {p.name}: <strong>{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

// ─── Modal genérico ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
  return (
    <motion.div
      key="modal-backdrop"
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
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(28px) saturate(200%)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%)',
          borderRadius: 18, border: '1px solid rgba(255,255,255,0.95)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 2px 0 rgba(255,255,255,1) inset',
          padding: '28px 32px', width: '100%', maxWidth: 460,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontFamily: T.fontHead, fontSize: 17, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em' }}>{title}</span>
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

// ─── Barra de progresso de categoria ─────────────────────────────────────────

function CategoriaBar({ categoria, realizado, limite, percentual }) {
  const pct   = percentual ?? (limite ? Math.round(realizado / limite * 100) : null)
  const cor   = percentColor(pct)
  const label = CATEGORIAS_LABEL[categoria] || categoria

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={springFluid}
      style={{ marginBottom: 16 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, color: T.text, textTransform: 'capitalize' }}>
          {label}
        </span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: T.fontBody, fontSize: 12, color: T.textSub }}>
            {fmt(realizado)}{limite ? ` / ${fmt(limite)}` : ''}
          </span>
          {pct != null && (
            <span style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, color: cor, minWidth: 36, textAlign: 'right' }}>
              {pct}%
            </span>
          )}
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct ?? 0, 100)}%` }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ height: '100%', borderRadius: 99, background: cor }}
        />
      </div>
    </motion.div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Financas() {
  const navigate = useNavigate()
  const userId   = localStorage.getItem('user_id') || 'nicolas'

  const hoje  = new Date()
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())

  const [resumo,     setResumo]     = useState(null)
  const [transacoes, setTransacoes] = useState([])
  const [centros,    setCentros]    = useState([])
  const [loading,    setLoading]    = useState(true)

  const [modalNovaTransacao, setModalNovaTransacao] = useState(false)
  const [enviando,           setEnviando]           = useState(false)
  const [form, setForm] = useState({
    data: hoje.toISOString().split('T')[0],
    tipo: 'saida',
    valor: '',
    categoria: 'alimentacao',
    descricao: '',
    custo_fixo: false,
  })

  // ── Fetch ────────────────────────────────────────────────────────────────────

  async function fetchTudo() {
    setLoading(true)
    try {
      const primeiroDia = `${ano}-${String(mes).padStart(2,'0')}-01`
      const ultimoDia   = new Date(ano, mes, 0).toISOString().split('T')[0]

      const [resResumo, resTrans, resCentros] = await Promise.all([
        api.get(`/financas/resumo/${userId}`, { params: { ano, mes } }),
        api.get(`/financas/transacao/${userId}`, { params: { data_inicio: primeiroDia, data_fim: ultimoDia } }),
        api.get(`/financas/configuracao/${userId}`),
      ])
      setResumo(resResumo.data)
      setTransacoes(resTrans.data)
      setCentros(resCentros.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTudo() }, [mes, ano, userId])

  // ── Derivações ───────────────────────────────────────────────────────────────

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

  const dadosGrafico = useMemo(() => {
    return categoriasComDados.map(c => ({
      name: (CATEGORIAS_LABEL[c.categoria] || c.categoria).slice(0, 6),
      realizado: c.realizado,
      limite: c.limite_mensal,
    }))
  }, [categoriasComDados])

  const { totalFixo, totalVariavel } = useMemo(() => {
    let fix = 0, vari = 0
    transacoes.filter(t => t.tipo === 'saida').forEach(t => {
      t.custo_fixo ? (fix += t.valor) : (vari += t.valor)
    })
    return { totalFixo: fix, totalVariavel: vari }
  }, [transacoes])

  const transacoesRecentes = useMemo(() =>
    [...transacoes].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 15),
  [transacoes])

  // ── Ações ────────────────────────────────────────────────────────────────────

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
      await api.post('/financas/transacao', {
        ...form,
        user_id: userId,
        valor: parseFloat(form.valor),
      })
      setModalNovaTransacao(false)
      setForm({ data: hoje.toISOString().split('T')[0], tipo: 'saida', valor: '', categoria: 'alimentacao', descricao: '', custo_fixo: false })
      fetchTudo()
    } catch (e) {
      console.error(e)
    } finally {
      setEnviando(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const saldo = resumo?.saldo ?? 0

  return (
    <div style={{ minHeight: '100vh', background: T.bgGradient, fontFamily: T.fontBody }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springFluid}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => navigate('/dashboard')} style={{
              background: 'rgba(255,255,255,0.45)', border: `1px solid ${T.glassBorder}`,
              borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: T.textSub, fontSize: 16,
            }}>←</button>
            <div>
              <h1 style={{ fontFamily: T.fontHead, fontSize: 22, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: '-0.03em' }}>
                Financeiro
              </h1>
              <span style={{ fontFamily: T.fontBody, fontSize: 12, color: T.textMut, textTransform: 'capitalize' }}>{userId}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ ...thinGlass, padding: '7px 4px', display: 'flex', alignItems: 'center', gap: 2 }}>
              <button onClick={() => navMes(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSub, fontSize: 14, padding: '2px 8px' }}>‹</button>
              <span style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 600, color: T.text, minWidth: 100, textAlign: 'center' }}>
                {MESES[mes - 1]} {ano}
              </span>
              <button onClick={() => navMes(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textSub, fontSize: 14, padding: '2px 8px' }}>›</button>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setModalNovaTransacao(true)}
              style={{
                background: T.teal, border: 'none', borderRadius: 9,
                padding: '9px 16px', cursor: 'pointer', color: '#fff',
                fontSize: 12, fontWeight: 700, fontFamily: T.fontBody,
                letterSpacing: '0.02em', boxShadow: `0 4px 16px rgba(0,68,68,0.30)`,
              }}
            >+ Transação</motion.button>
          </div>
        </motion.div>

        {/* ── Hero — Saldo ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springFluid, delay: 0.06 }}
          style={{ ...heroCard, marginBottom: 14 }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            <div>
              <span style={heroLabel}>Saldo do mês</span>
              <p style={{ fontFamily: T.fontHead, fontSize: 32, fontWeight: 800, color: saldo >= 0 ? '#5eead4' : '#f87171', margin: 0, letterSpacing: '-0.04em' }}>
                {fmt(saldo)}
              </p>
            </div>
            <div>
              <span style={heroLabel}>Entradas</span>
              <p style={{ fontFamily: T.fontHead, fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>
                {fmt(resumo?.total_entradas)}
              </p>
            </div>
            <div>
              <span style={heroLabel}>Saídas</span>
              <p style={{ fontFamily: T.fontHead, fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.75)', margin: 0, letterSpacing: '-0.03em' }}>
                {fmt(resumo?.total_saidas)}
              </p>
              <div style={{ marginTop: 10, display: 'flex', gap: 16 }}>
                <div>
                  <span style={{ fontFamily: T.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fixo</span>
                  <p style={{ fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0' }}>{fmt(totalFixo)}</p>
                </div>
                <div>
                  <span style={{ fontFamily: T.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Variável</span>
                  <p style={{ fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0' }}>{fmt(totalVariavel)}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Grid: orçamento + gráfico ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springFluid, delay: 0.10 }}
            style={card}
          >
            <span style={sectionLabel}>Orçamento por Categoria</span>
            {loading
              ? <p style={{ color: T.textMut, fontSize: 13, fontFamily: T.fontBody }}>Carregando…</p>
              : categoriasComDados.length === 0
                ? <p style={{ color: T.textMut, fontSize: 13, fontFamily: T.fontBody }}>Sem dados este mês.</p>
                : categoriasComDados.map(c => (
                    <CategoriaBar
                      key={c.categoria}
                      categoria={c.categoria}
                      realizado={c.realizado}
                      limite={c.limite_mensal}
                      percentual={c.percentual}
                    />
                  ))
            }
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springFluid, delay: 0.13 }}
            style={card}
          >
            <span style={sectionLabel}>Realizado vs Limite</span>
            {loading
              ? <p style={{ color: T.textMut, fontSize: 13, fontFamily: T.fontBody }}>Carregando…</p>
              : <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={dadosGrafico} barCategoryGap="28%" barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: T.fontBody, fill: T.textMut }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fontFamily: T.fontBody, fill: T.textMut }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip content={<CleanTooltip />} />
                    <Bar dataKey="realizado" name="Realizado" radius={[4,4,0,0]}>
                      {dadosGrafico.map((entry, i) => {
                        const pct = entry.limite ? (entry.realizado / entry.limite * 100) : 0
                        return <Cell key={i} fill={percentColor(pct)} />
                      })}
                    </Bar>
                    <Bar dataKey="limite" name="Limite" fill="rgba(0,68,68,0.12)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </motion.div>
        </div>

        {/* ── Transações recentes ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springFluid, delay: 0.16 }}
          style={card}
        >
          <span style={sectionLabel}>Transações do Mês</span>
          {loading
            ? <p style={{ color: T.textMut, fontSize: 13, fontFamily: T.fontBody }}>Carregando…</p>
            : transacoesRecentes.length === 0
              ? <p style={{ color: T.textMut, fontSize: 13, fontFamily: T.fontBody }}>Nenhuma transação este mês.</p>
              : transacoesRecentes.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springSnappy, delay: i * 0.025 }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 9, marginBottom: 6,
                      background: 'rgba(255,255,255,0.40)',
                      border: '1px solid rgba(255,255,255,0.70)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        fontFamily: T.fontBody, fontSize: 10, fontWeight: 700,
                        color: t.tipo === 'entrada' ? T.green : T.tealMd,
                        background: t.tipo === 'entrada' ? 'rgba(22,163,74,0.08)' : T.tealAlpha,
                        border: `1px solid ${t.tipo === 'entrada' ? 'rgba(22,163,74,0.20)' : T.tealBorder}`,
                        borderRadius: 5, padding: '2px 7px', textTransform: 'uppercase', letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                      }}>
                        {CATEGORIAS_LABEL[t.categoria] || t.categoria}
                      </span>
                      <div>
                        <span style={{ fontFamily: T.fontBody, fontSize: 13, color: T.text, fontWeight: 500 }}>
                          {t.descricao || '—'}
                        </span>
                        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                          <span style={{ fontFamily: T.fontBody, fontSize: 11, color: T.textMut }}>{t.data}</span>
                          {t.custo_fixo && (
                            <span style={{ fontFamily: T.fontBody, fontSize: 10, color: T.textMut, fontStyle: 'italic' }}>fixo</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span style={{
                      fontFamily: T.fontHead, fontSize: 15, fontWeight: 700,
                      color: t.tipo === 'entrada' ? T.green : T.text,
                      letterSpacing: '-0.02em', whiteSpace: 'nowrap',
                    }}>
                      {t.tipo === 'entrada' ? '+' : '-'}{fmt(t.valor)}
                    </span>
                  </motion.div>
                ))
          }
        </motion.div>
      </div>

      {/* ── Modal: Nova Transação ── */}
      <AnimatePresence>
        {modalNovaTransacao && (
          <Modal title="Nova Transação" onClose={() => setModalNovaTransacao(false)}>
            <form onSubmit={submitTransacao}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={fieldLabel}>Data</label>
                  <input
                    type="date"
                    value={form.data}
                    onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={fieldLabel}>Tipo</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['saida','entrada'].map(tipo => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, tipo }))}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 7, cursor: 'pointer',
                          fontFamily: T.fontBody, fontSize: 12, fontWeight: 600,
                          border: form.tipo === tipo ? 'none' : `1px solid ${T.inkLt}`,
                          background: form.tipo === tipo
                            ? (tipo === 'entrada' ? T.green : T.teal)
                            : 'rgba(255,255,255,0.45)',
                          color: form.tipo === tipo ? '#fff' : T.textSub,
                        }}
                      >{tipo === 'entrada' ? 'Entrada' : 'Saída'}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={fieldLabel}>Valor (R$)</label>
                <input
                  type="number" step="0.01" min="0" placeholder="0,00"
                  value={form.valor}
                  onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={fieldLabel}>Categoria</label>
                <select
                  value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {CATEGORIAS_INPUT.map(c => (
                    <option key={c} value={c}>{CATEGORIAS_LABEL[c]}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={fieldLabel}>Descrição (opcional)</label>
                <input
                  type="text" placeholder="ex: mercado, aluguel…"
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox" id="custo_fixo"
                  checked={form.custo_fixo}
                  onChange={e => setForm(f => ({ ...f, custo_fixo: e.target.checked }))}
                  style={{ accentColor: T.teal, width: 15, height: 15, cursor: 'pointer' }}
                />
                <label htmlFor="custo_fixo" style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSub, cursor: 'pointer' }}>
                  Custo fixo (aluguel, plano de saúde…)
                </label>
              </div>

              <motion.button
                type="submit"
                whileTap={{ scale: 0.97 }}
                disabled={enviando}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 9, border: 'none',
                  background: enviando ? T.tealLt : T.teal,
                  color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: T.fontBody,
                  cursor: enviando ? 'default' : 'pointer',
                  boxShadow: `0 4px 16px rgba(0,68,68,0.25)`,
                  letterSpacing: '0.01em',
                }}
              >
                {enviando ? 'Salvando…' : 'Salvar Transação'}
              </motion.button>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}
