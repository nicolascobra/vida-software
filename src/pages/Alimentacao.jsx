import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
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

// ─── Paleta verde — floresta + lima ───────────────────────────────────────────

const T = {
  bgGradient: '#ffffff',
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
  caramel:     '#fef9ca',
  caramelMd:   '#8fc040',
  // macros
  mProt: '#71b340',   // verde brilhante — proteína
  mCarb: '#a0c870',   // verde médio — carboidrato
  mGord: '#354f36',   // verde escuro — gordura
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

const thinGlass = {
  background: 'rgba(255,255,255,0.26)',
  backdropFilter: 'blur(40px) saturate(220%)',
  WebkitBackdropFilter: 'blur(40px) saturate(220%)',
  borderRadius: 14,
  padding: '18px 20px',
  border: '1px solid rgba(255,255,255,0.92)',
  boxShadow: '0 2px 20px rgba(53,79,54,0.05)',
}

const heroCard = {
  background: 'rgba(53,79,54,0.93)',
  backdropFilter: 'blur(28px) saturate(200%)',
  WebkitBackdropFilter: 'blur(28px) saturate(200%)',
  borderRadius: 14,
  padding: '20px 24px',
  border: '1px solid rgba(113,179,64,0.25)',
  boxShadow: '0 8px 40px rgba(53,79,54,0.32)',
}

const sectionLabel = {
  fontFamily: T.fontBody, fontSize: 10, fontWeight: 600,
  color: T.textMut, textTransform: 'uppercase',
  letterSpacing: '0.1em', marginBottom: 12, display: 'block',
}
const heroLabel = { ...sectionLabel, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }

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

function MacroBar({ label, val, meta, color }) {
  const pct = meta > 0 ? Math.min(100, Math.round(val / meta * 100)) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 600, color: T.text }}>{label}</span>
        <span style={{ fontFamily: T.fontBody, fontSize: 11, color: T.textSub }}>
          {val}g <span style={{ color: T.textMut }}>/ {meta}g</span>
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ height: '100%', borderRadius: 99, background: color }}
        />
      </div>
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
      fontFamily: T.fontBody, color: T.text, boxShadow: '0 4px 20px rgba(53,79,54,0.12)',
    }}>
      <p style={{ margin: '0 0 4px', color: T.textMut, fontSize: 11 }}>{lbl}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0' }}>
          <span style={{ color: p.fill, marginRight: 5 }}>■</span>
          {p.name}: <strong>{p.value} kcal</strong>
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
      key="modal-bg"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)',
        backgroundColor: 'rgba(200,220,200,0.45)',
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
          boxShadow: '0 24px 80px rgba(53,79,54,0.18), 0 2px 0 rgba(255,255,255,1) inset',
          padding: '28px 32px', width: '100%', maxWidth: 440,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <span style={{ fontFamily: T.fontHead, fontSize: 17, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em' }}>Nova refeição</span>
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.05)', border: `1px solid ${T.inkLt}`,
            borderRadius: 6, width: 28, height: 28, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.textMut, fontSize: 16,
          }}>×</button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSave(form) }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ ...sectionLabel, marginBottom: 5 }}>Data</label>
              <input type="date" value={form.data} onChange={e => set('data', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ ...sectionLabel, marginBottom: 5 }}>Refeição</label>
              <select value={form.tipo} onChange={e => set('tipo', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {TIPOS.map(t => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ ...sectionLabel, marginBottom: 5 }}>Descrição</label>
            <input value={form.descricao} onChange={e => set('descricao', e.target.value)}
              placeholder="Ex: arroz integral, frango grelhado..." style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 22 }}>
            {[
              { key: 'calorias',    label: 'Kcal',   placeholder: '0'  },
              { key: 'proteinas',   label: 'Prot. g', placeholder: '0g' },
              { key: 'carboidratos',label: 'Carb. g', placeholder: '0g' },
              { key: 'gorduras',    label: 'Gord. g', placeholder: '0g' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={{ ...sectionLabel, marginBottom: 5 }}>{label}</label>
                <input type="number" min="0" value={form[key]} onChange={e => set(key, e.target.value)}
                  placeholder={placeholder} style={{ ...inputStyle, padding: '8px 8px' }} />
              </div>
            ))}
          </div>

          <motion.button
            type="submit"
            disabled={enviando || !form.descricao || !form.calorias}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', padding: '11px 0',
              background: enviando ? T.caramelMd : T.terra,
              border: 'none', borderRadius: 9, cursor: enviando ? 'wait' : 'pointer',
              color: '#fff', fontFamily: T.fontBody, fontSize: 13, fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >{enviando ? 'Salvando…' : 'Salvar refeição'}</motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Alimentacao() {
  const userId = localStorage.getItem('user_id') || 'nicolas'
  const hoje   = new Date()

  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [ano, setAno] = useState(hoje.getFullYear())
  const [filterStart, setFilterStart] = useState(
    `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-01`
  )
  const [filterEnd, setFilterEnd] = useState(hoje.toISOString().split('T')[0])

  const [refeicoes,  setRefeicoes]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [enviando,   setEnviando]   = useState(false)

  // Metas diárias — idealmente vindas de uma config; valores default por ora
  const metas = { calorias: 2000, proteinas: 150, carboidratos: 250, gorduras: 65 }

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
        user_id:      userId,
        data:         form.data,
        tipo:         form.tipo,
        descricao:    form.descricao,
        calorias:     parseInt(form.calorias)      || 0,
        proteinas:    parseFloat(form.proteinas)   || 0,
        carboidratos: parseFloat(form.carboidratos) || 0,
        gorduras:     parseFloat(form.gorduras)    || 0,
      })
      setModalOpen(false)
      fetchRefeicoes()
    } catch(e) { console.error(e) }
    finally    { setEnviando(false) }
  }

  // ── Derivações ──────────────────────────────────────────────────────────────

  const hoje_str = hoje.toISOString().split('T')[0]

  const refeicoesHoje = useMemo(() =>
    refeicoes.filter(r => r.data === hoje_str),
  [refeicoes, hoje_str])

  const totalHoje = useMemo(() => ({
    calorias:     refeicoesHoje.reduce((s, r) => s + (r.calorias || 0), 0),
    proteinas:    refeicoesHoje.reduce((s, r) => s + (r.proteinas || 0), 0),
    carboidratos: refeicoesHoje.reduce((s, r) => s + (r.carboidratos || 0), 0),
    gorduras:     refeicoesHoje.reduce((s, r) => s + (r.gorduras || 0), 0),
  }), [refeicoesHoje])

  const caloriasPct = metas.calorias > 0
    ? Math.min(100, Math.round(totalHoje.calorias / metas.calorias * 100))
    : 0

  // Calorias por dia no período (para o bar chart)
  const calPorDia = useMemo(() => {
    const mapa = {}
    refeicoes.forEach(r => {
      mapa[r.data] = (mapa[r.data] || 0) + (r.calorias || 0)
    })
    return Object.entries(mapa)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, kcal]) => ({
        dia: data.slice(8) + '/' + data.slice(5,7),
        kcal,
      }))
  }, [refeicoes])

  // Refeições do período agrupadas por tipo (aceita todos os tipos presentes nos dados)
  const porTipo = useMemo(() => {
    const grupos = {}
    refeicoes.forEach(r => {
      const key = r.tipo || 'outro'
      if (!grupos[key]) grupos[key] = []
      grupos[key].push(r)
    })
    return grupos
  }, [refeicoes])

  function navMes(dir) {
    let nm = mes + dir, na = ano
    if (nm < 1)  { nm = 12; na-- }
    if (nm > 12) { nm = 1;  na++ }
    setMes(nm); setAno(na)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

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
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', gap: 24, alignItems: 'start' }}>

            {/* Calorias — coluna principal */}
            <div>
              <span style={heroLabel}>Calorias hoje</span>
              <p style={{ fontFamily: T.fontHead, fontSize: 30, fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.04em' }}>
                {totalHoje.calorias.toLocaleString('pt-BR')}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.35)', marginLeft: 6 }}>kcal</span>
              </p>
              {/* barra de calorias */}
              <div style={{ height: 5, background: 'rgba(255,255,255,0.12)', borderRadius: 99, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${caloriasPct}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  style={{
                    height: '100%', borderRadius: 99,
                    background: caloriasPct >= 95 ? '#f87171' : T.terra,
                  }}
                />
              </div>
              <p style={{ fontFamily: T.fontBody, fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: '6px 0 0', letterSpacing: '0.04em' }}>
                meta: {metas.calorias.toLocaleString('pt-BR')} kcal · {caloriasPct}%
              </p>
            </div>

            {/* Macros mini-KPIs */}
            {[
              { label: 'Proteínas',    val: totalHoje.proteinas,    meta: metas.proteinas,    cor: T.mProt },
              { label: 'Carboidratos', val: totalHoje.carboidratos, meta: metas.carboidratos, cor: T.mCarb },
              { label: 'Gorduras',     val: totalHoje.gorduras,     meta: metas.gorduras,     cor: T.mGord },
            ].map(({ label, val, meta, cor }) => (
              <div key={label}>
                <span style={heroLabel}>{label}</span>
                <p style={{ fontFamily: T.fontHead, fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
                  {val}g
                </p>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.10)', borderRadius: 99, overflow: 'hidden' }}>
                  <motion.div
                    animate={{ width: `${meta > 0 ? Math.min(100, val / meta * 100) : 0}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    style={{ height: '100%', borderRadius: 99, background: cor }}
                  />
                </div>
                <p style={{ fontFamily: T.fontBody, fontSize: 9, color: 'rgba(255,255,255,0.25)', margin: '5px 0 0', letterSpacing: '0.04em' }}>
                  meta {meta}g
                </p>
              </div>
            ))}
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
              accentColor={T.terra} fontBody={T.fontBody}
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setModalOpen(true)}
            style={{
              background: T.caramelMd, border: 'none', borderRadius: 7,
              padding: '7px 14px', cursor: 'pointer', color: '#fff',
              fontSize: 11, fontWeight: 700, fontFamily: T.fontBody,
              letterSpacing: '0.02em', flexShrink: 0,
            }}
          >+ Registrar refeição</motion.button>
        </div>

        {/* ── 3 colunas ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 14, alignItems: 'start' }}>

          {/* ══ Col 1: Macros do período ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }} transition={{ ...springFluid, delay: 0.08 }}
              style={card}
            >
              <span style={sectionLabel}>Macros do período</span>
              {loading
                ? <p style={{ color: T.textMut, fontSize: 13 }}>Carregando…</p>
                : (() => {
                    const tot = {
                      proteinas:    refeicoes.reduce((s, r) => s + (r.proteinas    || 0), 0),
                      carboidratos: refeicoes.reduce((s, r) => s + (r.carboidratos || 0), 0),
                      gorduras:     refeicoes.reduce((s, r) => s + (r.gorduras     || 0), 0),
                    }
                    const diasPeriodo = Math.max(1, Math.round((new Date(filterEnd) - new Date(filterStart)) / 86400000) + 1)
                    return (
                      <>
                        <MacroBar label="Proteínas"    val={Math.round(tot.proteinas    / diasPeriodo)} meta={metas.proteinas}    color={T.mProt} />
                        <MacroBar label="Carboidratos" val={Math.round(tot.carboidratos / diasPeriodo)} meta={metas.carboidratos} color={T.mCarb} />
                        <MacroBar label="Gorduras"     val={Math.round(tot.gorduras     / diasPeriodo)} meta={metas.gorduras}     color={T.mGord} />
                        <p style={{ fontSize: 10, color: T.textMut, fontFamily: T.fontBody, margin: '8px 0 0' }}>média diária no período</p>
                      </>
                    )
                  })()
              }
            </motion.div>

            {/* Distribuição por tipo */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }} transition={{ ...springFluid, delay: 0.11 }}
              style={thinGlass}
            >
              <span style={sectionLabel}>Por tipo de refeição</span>
              {Object.keys(porTipo).sort().map(tipo => {
                const items = porTipo[tipo] || []
                if (!items.length) return null
                const kcal = items.reduce((s, r) => s + (r.calorias || 0), 0)
                return (
                  <div key={tipo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontFamily: T.fontBody, fontSize: 12, color: T.text }}>{TIPO_LABEL[tipo]}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: T.textMut }}>{items.length}×</span>
                      <span style={{
                        fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, color: T.terra,
                        background: T.terraAlpha, border: `1px solid ${T.terraBorder}`,
                        borderRadius: 20, padding: '2px 9px',
                      }}>{kcal} kcal</span>
                    </div>
                  </div>
                )
              })}
              {!refeicoes.length && <p style={{ color: T.textMut, fontSize: 13 }}>Sem dados no período.</p>}
            </motion.div>
          </div>

          {/* ══ Col 2: Evolução calórica + log de refeições ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Evolução calórica */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }} transition={{ ...springFluid, delay: 0.10 }}
              style={card}
            >
              <span style={sectionLabel}>Evolução calórica</span>
              {calPorDia.length < 2
                ? <p style={{ fontSize: 13, color: T.textMut, textAlign: 'center', padding: '28px 0', margin: 0 }}>Registre mais dias para ver o gráfico.</p>
                : <ResponsiveContainer width="100%" height={165}>
                    <BarChart data={calPorDia} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={14}>
                      <CartesianGrid strokeDasharray="2 4" stroke={T.inkLt} vertical={false} />
                      <XAxis dataKey="dia" tick={{ fontSize: 9, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} interval={Math.ceil(calPorDia.length / 8)} />
                      <YAxis tick={{ fontSize: 9, fill: T.textMut, fontFamily: T.fontBody }} axisLine={false} tickLine={false} width={32} />
                      <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(113,179,64,0.07)' }} />
                      <Bar dataKey="kcal" name="Calorias" fill={T.terra} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
              }
            </motion.div>

            {/* Log de refeições */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }} transition={{ ...springFluid, delay: 0.13 }}
              style={{ ...card, padding: '16px 14px' }}
            >
              <span style={sectionLabel}>Refeições no período</span>
              {loading
                ? <p style={{ color: T.textMut, fontSize: 13 }}>Carregando…</p>
                : refeicoes.length === 0
                  ? <p style={{ color: T.textMut, fontSize: 13 }}>Nenhum registro no período.</p>
                  : [...refeicoes]
                      .sort((a, b) => b.data.localeCompare(a.data) || TIPOS.indexOf(a.tipo) - TIPOS.indexOf(b.tipo))
                      .slice(0, 18)
                      .map(r => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={springFluid}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 10px', borderRadius: 9, marginBottom: 6,
                            background: 'rgba(255,255,255,0.30)',
                            border: '1px solid rgba(255,255,255,0.55)',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                              <span style={{
                                fontSize: 9, fontWeight: 700, color: T.terra,
                                background: T.terraAlpha, border: `1px solid ${T.terraBorder}`,
                                borderRadius: 20, padding: '1px 7px', textTransform: 'uppercase', letterSpacing: '0.05em',
                              }}>{TIPO_LABEL[r.tipo] || r.tipo}</span>
                              <span style={{ fontSize: 10, color: T.textMut }}>{r.data.slice(8)}/{r.data.slice(5,7)}</span>
                            </div>
                            <span style={{ fontSize: 12, color: T.text, fontFamily: T.fontBody }}>{r.descricao}</span>
                          </div>
                          <span style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 700, color: T.ink, flexShrink: 0, marginLeft: 10 }}>
                            {r.calorias} kcal
                          </span>
                        </motion.div>
                      ))
              }
            </motion.div>
          </div>

          {/* ══ Col 3: Resumo de hoje ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }} transition={{ ...springFluid, delay: 0.12 }}
              style={card}
            >
              <span style={sectionLabel}>Refeições de hoje</span>
              {refeicoesHoje.length === 0
                ? <p style={{ fontSize: 13, color: T.textMut, margin: 0 }}>Nenhum registro hoje.</p>
                : Object.keys(porTipo).sort().map(tipo => {
                    const items = refeicoesHoje.filter(r => r.tipo === tipo)
                    if (!items.length) return null
                    return (
                      <div key={tipo} style={{ marginBottom: 14 }}>
                        <p style={{ fontFamily: T.fontBody, fontSize: 10, fontWeight: 700, color: T.caramelMd, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>
                          {TIPO_LABEL[tipo]}
                        </p>
                        {items.map(r => (
                          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${T.inkLt}` }}>
                            <span style={{ fontSize: 12, color: T.text }}>{r.descricao}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: T.terra, flexShrink: 0, marginLeft: 8 }}>{r.calorias} kcal</span>
                          </div>
                        ))}
                      </div>
                    )
                  })
              }
            </motion.div>

            {/* Dica — meta calórica */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ...springFluid, delay: 0.15 }}
              style={{
                ...thinGlass,
                background: caloriasPct >= 90
                  ? 'rgba(113,179,64,0.10)'
                  : 'rgba(113,179,64,0.06)',
                border: caloriasPct >= 90
                  ? `1px solid ${T.terraBorder}`
                  : '1px solid rgba(113,179,64,0.20)',
              }}
            >
              <p style={{ fontFamily: T.fontBody, fontSize: 10, fontWeight: 700, color: T.caramelMd, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
                {caloriasPct >= 90 ? 'Meta quase atingida' : 'Saldo calórico hoje'}
              </p>
              <p style={{ fontFamily: T.fontHead, fontSize: 26, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: '-0.03em' }}>
                {Math.max(0, metas.calorias - totalHoje.calorias).toLocaleString('pt-BR')}
                <span style={{ fontSize: 12, fontWeight: 400, color: T.textMut, marginLeft: 5 }}>kcal restantes</span>
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <ModalRefeicao
            onClose={() => setModalOpen(false)}
            onSave={salvarRefeicao}
            enviando={enviando}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
