import { useNavigate } from 'react-router-dom';

const T = {
  glass:       'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.90)',
  blur:        'blur(28px) saturate(200%)',
  ink:         '#0a0a0a',
  fontHead:    "'Syne', sans-serif",
  fontBody:    "'DM Sans', sans-serif",
};

export default function SelectUser() {
  const navigate = useNavigate();

  const handleSelect = (user) => {
    localStorage.setItem('user_id', user);
    navigate('/home');
  };

  const btnStyle = {
    background: T.glass,
    backdropFilter: T.blur,
    WebkitBackdropFilter: T.blur,
    border: `1px solid ${T.glassBorder}`,
    borderRadius: 14,
    padding: '24px',
    fontSize: 20,
    fontWeight: 700,
    fontFamily: T.fontHead,
    color: T.ink,
    width: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.05), 0 2px 0 rgba(255,255,255,0.95) inset',
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh', gap: '20px', paddingBottom: 0 }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 className="title" style={{ fontSize: 32 }}>Quem é você?</h1>
      </div>
      <button style={btnStyle} onClick={() => handleSelect('andre')}>André</button>
      <button style={btnStyle} onClick={() => handleSelect('nicolas')}>Nicolas</button>
    </div>
  );
}
