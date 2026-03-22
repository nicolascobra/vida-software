import { useNavigate } from 'react-router-dom';

const T = {
  glass:       'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.90)',
  blur:        'blur(28px) saturate(200%)',
  ink:         '#0a0a0a',
  textSub:     '#525252',
  textMut:     '#a3a3a3',
  fontHead:    "'Syne', sans-serif",
  fontBody:    "'DM Sans', sans-serif",
};

const MODULOS = [
  { path: '/alimentacao', label: 'Alimentação', desc: 'Refeições diárias', accent: '#a52a2a', accentAlpha: 'rgba(165,42,42,0.1)' },
  { path: '/financeiro',  label: 'Financeiro',  desc: 'Entradas e saídas', accent: '#004444', accentAlpha: 'rgba(0,68,68,0.1)' },
  { path: '/exercicio',   label: 'Exercício',   desc: 'Treinos e calorias', accent: '#0a0a0a', accentAlpha: 'rgba(10,10,10,0.1)' },
];

export default function Home() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id') || 'Usuário';

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    navigate('/');
  };

  return (
    <div className="container">
      <div style={{ marginBottom: 48, marginTop: 20 }}>
        <p style={{ fontFamily: T.fontBody, fontSize: 11, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 6px' }}>
          Olá, {userId}
        </p>
        <h1 className="title" style={{ fontSize: 32 }}>
          Vida App
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {MODULOS.map((m) => (
          <button
            key={m.path}
            onClick={() => navigate(m.path)}
            style={{
              background: T.glass,
              backdropFilter: T.blur,
              WebkitBackdropFilter: T.blur,
              borderRadius: 14,
              padding: '24px',
              border: `1px solid ${T.glassBorder}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.05), 0 2px 0 rgba(255,255,255,0.95) inset',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: m.accent, display: 'inline-block' }} />
                <span style={{ fontFamily: T.fontHead, fontSize: 20, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em' }}>
                  {m.label}
                </span>
              </div>
              <span style={{ fontFamily: T.fontBody, fontSize: 14, color: T.textSub, paddingLeft: 20 }}>
                {m.desc}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <button
          onClick={handleLogout}
          style={{
            background: 'none', border: 'none',
            fontFamily: T.fontBody, fontSize: 13, color: T.textMut,
            textDecoration: 'underline', textUnderlineOffset: 3,
            padding: 14
          }}
        >
          Sair
        </button>
      </div>
    </div>
  );
}
