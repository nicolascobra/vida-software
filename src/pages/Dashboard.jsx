import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const T = {
  bgGradient: 'linear-gradient(135deg, #d4d4d4 0%, #e8e8e8 40%, #f4f4f4 70%, #ffffff 100%)',
  glass:       'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.90)',
  blur:        'blur(28px) saturate(200%)',
  ink:     '#0a0a0a',
  textSub: '#525252',
  textMut: '#a3a3a3',
  fontHead: "'Syne', sans-serif",
  fontBody: "'DM Sans', sans-serif",
}

const MODULOS = [
  {
    path: '/thrive',
    label: 'Thrive',
    desc: 'Treinos, peso e consistência',
    accent: '#0a0a0a',
    accentAlpha: 'rgba(10,10,10,0.07)',
  },
  {
    path: '/returns',
    label: 'Returns',
    desc: 'Entradas, saídas e orçamento',
    accent: '#004444',
    accentAlpha: 'rgba(0,68,68,0.07)',
  },
  {
    path: '/vitals',
    label: 'Vitals',
    desc: 'Refeições, macros e adesão',
    accent: '#354f36',
    accentAlpha: 'rgba(53,79,54,0.07)',
  },
  {
    path: '/vision',
    label: 'Vision',
    desc: 'Dashboard estratégica — VTR',
    accent: '#5b21b6',
    accentAlpha: 'rgba(91,33,182,0.07)',
  },
]

const springFluid = { type: 'spring', stiffness: 280, damping: 32 }

export default function Dashboard() {
  const navigate = useNavigate()
  const userId   = localStorage.getItem('user_id') || 'nicolas'

  function logout() {
    localStorage.removeItem('user_id')
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bgGradient, fontFamily: T.fontBody }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '60px 20px' }}>

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springFluid}
          style={{ marginBottom: 48 }}
        >
          <p style={{ fontFamily: T.fontBody, fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>
            Olá, {userId}
          </p>
          <h1 style={{ fontFamily: T.fontHead, fontSize: 32, fontWeight: 800, color: T.ink, margin: 0, letterSpacing: '-0.06em' }}>
            vetor
          </h1>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MODULOS.map((m, i) => (
            <motion.button
              key={m.path}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springFluid, delay: i * 0.07 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(m.path)}
              style={{
                background: T.glass,
                backdropFilter: T.blur,
                WebkitBackdropFilter: T.blur,
                borderRadius: 14,
                padding: '22px 24px',
                border: `1px solid ${T.glassBorder}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 0 rgba(255,255,255,0.95) inset',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.accent, display: 'inline-block' }} />
                  <span style={{ fontFamily: T.fontHead, fontSize: 18, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em' }}>
                    {m.label}
                  </span>
                </div>
                <span style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSub, paddingLeft: 18 }}>
                  {m.desc}
                </span>
              </div>
              <span style={{
                fontSize: 16, color: m.accent,
                background: m.accentAlpha, width: 36, height: 36, borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>↗</span>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          style={{ marginTop: 32, textAlign: 'center' }}
        >
          <button
            onClick={logout}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: T.fontBody, fontSize: 12, color: T.textMut,
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}
          >Sair</button>
        </motion.div>
      </div>
    </div>
  )
}
