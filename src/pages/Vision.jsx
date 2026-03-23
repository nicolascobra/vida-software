import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'

// ── Theme ──────────────────────────────────────────────────────────────────────

const T = {
  bg:       '#07090e',
  surface:  'rgba(255,255,255,0.04)',
  surfaceMd:'rgba(255,255,255,0.07)',
  border:   'rgba(255,255,255,0.08)',
  borderMd: 'rgba(255,255,255,0.13)',
  ink:      '#f0f4f8',
  inkMd:    'rgba(255,255,255,0.55)',
  inkLt:    'rgba(255,255,255,0.28)',
  inkXLt:   'rgba(255,255,255,0.10)',
  fontHead: "'Syne', sans-serif",
  fontBody: "'DM Sans', sans-serif",
}

// ── Verticals (3 axes of VTR) ─────────────────────────────────────────────────

const VERTICALS = [
  { key: 'thrive',  label: 'Thrive',  color: '#22d3ee', angle: -90  },
  { key: 'returns', label: 'Returns', color: '#a3e635', angle:  30  },
  { key: 'vitals',  label: 'Vitals',  color: '#4ade80', angle: 150  },
]

// ── Users ──────────────────────────────────────────────────────────────────────

const USERS_CFG = [
  { id: 'nicolas', label: 'Nicolas', color: '#00e5c9', glow: 'rgba(0,229,201,0.30)' },
  { id: 'andre',   label: 'André',   color: '#a78bfa', glow: 'rgba(167,139,250,0.30)' },
]

// ── Math helpers ──────────────────────────────────────────────────────────────

function toRad(deg) { return deg * Math.PI / 180 }

function axisPoint(cx, cy, R, angleDeg, score = 1) {
  return {
    x: cx + R * score * Math.cos(toRad(angleDeg)),
    y: cy + R * score * Math.sin(toRad(angleDeg)),
  }
}

function polygonPoints(cx, cy, R, scores) {
  return VERTICALS
    .map(a => axisPoint(cx, cy, R, a.angle, Math.max(0.02, scores[a.key] || 0)))
    .map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')
}

// Residual vector: points toward dominant vertical, length = avg score
function computeVector(scores) {
  let vx = 0, vy = 0
  VERTICALS.forEach(a => {
    const s = scores[a.key] || 0
    vx += s * Math.cos(toRad(a.angle))
    vy += s * Math.sin(toRad(a.angle))
  })
  const avg = (Object.values(scores).reduce((s, v) => s + v, 0)) / 3
  const len = Math.sqrt(vx * vx + vy * vy)
  if (len < 0.04) return { vx: 0, vy: -avg }           // balanced → aponta pra cima
  return { vx: (vx / len) * avg, vy: (vy / len) * avg }
}

// ── Data fetcher ──────────────────────────────────────────────────────────────

async function fetchScores(userId) {
  const hoje = new Date()
  const ano  = hoje.getFullYear()
  const mes  = hoje.getMonth() + 1
  const priDia = `${ano}-${String(mes).padStart(2, '0')}-01`
  const ultDia = new Date(ano, mes, 0).toISOString().split('T')[0]
  const diasNoMes     = new Date(ano, mes, 0).getDate()
  const diasDecorridos = Math.max(1, hoje.getDate())

  const [rResumo, rTrans, rCentros, rEx, rAlim] = await Promise.allSettled([
    api.get(`/financas/resumo/${userId}`,    { params: { ano, mes } }),
    api.get(`/financas/transacao/${userId}`, { params: { data_inicio: priDia, data_fim: ultDia } }),
    api.get(`/financas/configuracao/${userId}`),
    api.get(`/exercicios/${userId}`,          { params: { data_inicio: priDia, data_fim: ultDia } }),
    api.get(`/alimentacao/${userId}`,         { params: { data_inicio: priDia, data_fim: ultDia } }),
  ])

  // Returns: escalonado variável vs gasto variável
  let returns = 0.5
  if (rResumo.status === 'fulfilled' && rTrans.status === 'fulfilled' && rCentros.status === 'fulfilled') {
    const centros = rCentros.value.data || []
    const trans   = rTrans.value.data   || []
    const totalLimite = centros.reduce((s, c) => s + (c.limite_mensal || 0), 0)
    let totalVar = 0
    trans.filter(t => t.tipo === 'saida' && !t.custo_fixo).forEach(t => { totalVar += t.valor })
    const escalonado = totalLimite * (diasDecorridos / diasNoMes)
    if (escalonado > 0) returns = Math.min(1, escalonado / Math.max(0.01, totalVar))
  }

  // Thrive: dias únicos de treino vs meta (5x/semana)
  let thrive = 0.5
  if (rEx.status === 'fulfilled') {
    const recs = rEx.value.data || []
    const uniqueDays = new Set(recs.map(r => r.data)).size
    const target = Math.max(1, Math.round(diasDecorridos * 5 / 7))
    thrive = Math.min(1, uniqueDays / target)
  }

  // Vitals: refeições registradas vs esperadas (3/dia)
  let vitals = 0.5
  if (rAlim.status === 'fulfilled') {
    const recs = rAlim.value.data || []
    const expected = diasDecorridos * 3
    vitals = Math.min(1, recs.length / Math.max(1, expected))
  }

  return { thrive, vitals, returns }
}

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score, color, label, size = 72, delay = 0 }) {
  const r    = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const pct  = Math.round((score || 0) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke="rgba(255,255,255,0.07)" strokeWidth={5} />
          <motion.circle
            cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={5} strokeLinecap="round"
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - circ * (score || 0) }}
            transition={{ duration: 1.3, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ strokeDasharray: circ }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.4 }}
            style={{ fontFamily: T.fontHead, fontSize: 13, fontWeight: 800, color: '#fff' }}
          >{pct}%</motion.span>
        </div>
      </div>
      <span style={{ fontFamily: T.fontBody, fontSize: 9, fontWeight: 700, color,
        textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</span>
    </div>
  )
}

// ── Triaxial vector chart ──────────────────────────────────────────────────────

function VectorChart({ usersData }) {
  const W = 500, H = 460
  const cx = W / 2, cy = H / 2 + 10
  const R  = 160
  const gridLevels = [0.25, 0.5, 0.75, 1.0]

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', maxWidth: W, margin: '0 auto' }}>
      {/* Ambient glow blobs */}
      <defs>
        <radialGradient id="glow-center" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.06)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={R * 1.1} fill="url(#glow-center)" />

      {/* Grid rings */}
      {gridLevels.map(level => (
        <circle key={level} cx={cx} cy={cy} r={R * level}
          fill="none"
          stroke={level === 1 ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.05)'}
          strokeWidth={level === 1 ? 1.5 : 1}
          strokeDasharray={level < 1 ? '2 7' : undefined}
        />
      ))}

      {/* % labels on Y axis */}
      {[0.25, 0.5, 0.75].map(level => (
        <text key={level} x={cx + 4} y={cy - R * level + 4}
          fill="rgba(255,255,255,0.18)" fontSize={8} fontFamily={T.fontBody}>
          {Math.round(level * 100)}%
        </text>
      ))}

      {/* Axis lines + labels */}
      {VERTICALS.map(a => {
        const tip   = axisPoint(cx, cy, R * 1.04, a.angle)
        const label = axisPoint(cx, cy, R * 1.24, a.angle)
        const labelOffset = {
          thrive:  { dx: 0,   dy: -6  },
          returns: { dx: 14,  dy:  6  },
          vitals:  { dx: -14, dy:  6  },
        }[a.key] || { dx: 0, dy: 0 }

        return (
          <g key={a.key}>
            <line x1={cx} y1={cy} x2={tip.x} y2={tip.y}
              stroke={a.color} strokeWidth={1.5} opacity={0.45}
              strokeDasharray="4 4"
            />
            <circle cx={tip.x} cy={tip.y} r={3} fill={a.color} opacity={0.7} />
            <text
              x={label.x + labelOffset.dx}
              y={label.y + labelOffset.dy}
              textAnchor="middle" dominantBaseline="central"
              fill={a.color} fontSize={12}
              fontFamily={T.fontHead} fontWeight={700}
              letterSpacing={-0.5}
            >{a.label}</text>
          </g>
        )
      })}

      {/* Per-user polygon + vector */}
      {usersData.map((ud, i) => {
        if (!ud.scores) return null
        const cfg  = USERS_CFG.find(u => u.id === ud.id)
        const poly = polygonPoints(cx, cy, R, ud.scores)
        const vec  = computeVector(ud.scores)
        const vtx  = cx + vec.vx * R
        const vty  = cy + vec.vy * R
        const nameAnchor = vtx > cx ? 'start' : 'end'
        const nameDx     = vtx > cx ? 14 : -14
        const nameDy     = vty > cy ?  14 : -10

        return (
          <g key={ud.id}>
            {/* Filled radar polygon */}
            <motion.polygon
              points={poly}
              fill={cfg.color} fillOpacity={0.09}
              stroke={cfg.color} strokeWidth={1.5} strokeOpacity={0.50}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.0, delay: 0.5 + i * 0.25, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />

            {/* Score dots on each axis */}
            {VERTICALS.map(a => {
              const pt = axisPoint(cx, cy, R, a.angle, ud.scores[a.key] || 0)
              return (
                <motion.circle key={a.key} cx={pt.x} cy={pt.y} r={3.5}
                  fill={cfg.color} opacity={0.8}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.2, type: 'spring', stiffness: 400 }}
                  style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                />
              )
            })}

            {/* Vector line */}
            <motion.line
              x1={cx} y1={cy} x2={vtx} y2={vty}
              stroke={cfg.color} strokeWidth={2.5} strokeLinecap="round"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: 1, pathLength: 1 }}
              transition={{ duration: 0.7, delay: 1.1 + i * 0.2 }}
            />

            {/* Arrowhead */}
            <motion.circle cx={vtx} cy={vty} r={5} fill={cfg.color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.4 + i * 0.2, type: 'spring', stiffness: 500, damping: 18 }}
              style={{ transformOrigin: `${vtx}px ${vty}px` }}
            />

            {/* Pulsing glow around arrowhead */}
            <motion.circle cx={vtx} cy={vty} r={10} fill={cfg.color} fillOpacity={0.22}
              animate={{ r: [10, 18, 10], fillOpacity: [0.22, 0.04, 0.22] }}
              transition={{ duration: 2.8, repeat: Infinity, delay: 1.6 + i * 0.2 }}
            />

            {/* User label near tip */}
            <motion.text
              x={vtx + nameDx} y={vty + nameDy}
              textAnchor={nameAnchor} dominantBaseline="central"
              fill={cfg.color} fontSize={11}
              fontFamily={T.fontHead} fontWeight={700}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 + i * 0.2 }}
            >{cfg.label}</motion.text>
          </g>
        )
      })}

      {/* Origin */}
      <circle cx={cx} cy={cy} r={3.5} fill="rgba(255,255,255,0.35)" />
      <circle cx={cx} cy={cy} r={8}   fill="rgba(255,255,255,0.06)" />
    </svg>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const spring = { type: 'spring', stiffness: 260, damping: 30 }

export default function Vision() {
  const [usersData, setUsersData] = useState(
    USERS_CFG.map(u => ({ ...u, scores: null, loading: true }))
  )

  useEffect(() => {
    USERS_CFG.forEach(async (u, i) => {
      try {
        const scores = await fetchScores(u.id)
        setUsersData(prev => prev.map((ud, idx) =>
          idx === i ? { ...ud, scores, loading: false } : ud
        ))
      } catch {
        setUsersData(prev => prev.map((ud, idx) =>
          idx === i ? { ...ud, scores: { thrive: 0.5, vitals: 0.5, returns: 0.5 }, loading: false } : ud
        ))
      }
    })
  }, [])

  const overallColor = (pct) =>
    pct >= 80 ? '#4ade80' : pct >= 55 ? '#d97706' : '#f87171'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ minHeight: '100vh', background: T.bg, fontFamily: T.fontBody }}
    >
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '44px 24px 80px' }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.05 }}
          style={{ marginBottom: 40 }}
        >
          <span style={{ fontFamily: T.fontBody, fontSize: 10, fontWeight: 600, color: T.inkLt,
            textTransform: 'uppercase', letterSpacing: '0.18em', display: 'block', marginBottom: 6 }}>
            Vision · {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <h1 style={{ fontFamily: T.fontHead, fontSize: 42, fontWeight: 800, color: T.ink,
            margin: 0, letterSpacing: '-0.06em', lineHeight: 1 }}>
            vetor
          </h1>
          <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.inkLt, margin: '8px 0 0', lineHeight: 1.6 }}>
            Dashboard estratégica — Thrive · Vitals · Returns
          </p>
        </motion.div>

        {/* ── User hero cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {usersData.map((ud, i) => {
            const avgPct = ud.scores
              ? Math.round(((ud.scores.thrive + ud.scores.vitals + ud.scores.returns) / 3) * 100)
              : null
            return (
              <motion.div
                key={ud.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...spring, delay: 0.1 + i * 0.1 }}
                style={{
                  background: T.surface,
                  border: `1px solid ${T.borderMd}`,
                  borderRadius: 18, padding: '22px 24px',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Ambient glow blob */}
                <div style={{
                  position: 'absolute', top: -50, right: -50,
                  width: 140, height: 140, borderRadius: '50%',
                  background: ud.color, filter: 'blur(70px)', opacity: 0.14,
                  pointerEvents: 'none',
                }} />

                {/* Name + overall */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                  <div>
                    <span style={{ fontFamily: T.fontBody, fontSize: 9, fontWeight: 600, color: T.inkLt,
                      textTransform: 'uppercase', letterSpacing: '0.14em', display: 'block', marginBottom: 4 }}>
                      vetor
                    </span>
                    <span style={{ fontFamily: T.fontHead, fontSize: 24, fontWeight: 800,
                      color: '#fff', letterSpacing: '-0.04em' }}>
                      {ud.label}
                    </span>
                  </div>
                  {avgPct !== null && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontFamily: T.fontBody, fontSize: 9, color: T.inkLt,
                        textTransform: 'uppercase', letterSpacing: '0.10em', display: 'block', marginBottom: 3 }}>
                        geral
                      </span>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 + i * 0.15 }}
                        style={{ fontFamily: T.fontHead, fontSize: 26, fontWeight: 800,
                          color: overallColor(avgPct), letterSpacing: '-0.04em' }}
                      >{avgPct}%</motion.span>
                    </div>
                  )}
                </div>

                {/* Score rings */}
                {ud.loading || !ud.scores
                  ? (
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                      {VERTICALS.map(v => (
                        <div key={v.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 72, height: 72, borderRadius: '50%', background: T.surfaceMd }} />
                          <span style={{ fontSize: 9, color: T.inkLt, textTransform: 'uppercase', letterSpacing: '0.10em' }}>{v.label}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                      {VERTICALS.map((v, vi) => (
                        <ScoreRing
                          key={v.key}
                          score={ud.scores[v.key]}
                          color={v.color}
                          label={v.label}
                          size={72}
                          delay={0.2 + i * 0.15 + vi * 0.1}
                        />
                      ))}
                    </div>
                  )
                }
              </motion.div>
            )
          })}
        </div>

        {/* ── Vector chart card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.3 }}
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 20, padding: '28px 24px 20px',
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Radial background */}
          <div style={{
            position: 'absolute', top: '55%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 380, height: 380, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Card header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontFamily: T.fontBody, fontSize: 9, fontWeight: 600, color: T.inkLt,
                textTransform: 'uppercase', letterSpacing: '0.14em', display: 'block', marginBottom: 3 }}>
                Plano tridimensional
              </span>
              <span style={{ fontFamily: T.fontHead, fontSize: 17, fontWeight: 700,
                color: T.ink, letterSpacing: '-0.03em' }}>
                Vetor de Performance
              </span>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {USERS_CFG.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%',
                    background: u.color, display: 'inline-block',
                    boxShadow: `0 0 6px ${u.glow}` }} />
                  <span style={{ fontFamily: T.fontBody, fontSize: 11, color: T.inkMd }}>{u.label}</span>
                </div>
              ))}
            </div>
          </div>

          <VectorChart usersData={usersData} />

          <p style={{ fontFamily: T.fontBody, fontSize: 10, color: T.inkLt,
            textAlign: 'center', margin: '12px 0 0', lineHeight: 1.7 }}>
            O vetor aponta para a vertical dominante&nbsp;·&nbsp;
            Comprimento = performance média&nbsp;·&nbsp;
            Polígono = cobertura das três dimensões
          </p>
        </motion.div>

      </div>
    </motion.div>
  )
}
