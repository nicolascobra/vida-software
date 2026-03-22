import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrarTreino } from '../services/api';

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

const inputStyle = {
  width: '100%', minHeight: 48, padding: '14px 16px', background: 'rgba(255,255,255,0.8)',
  border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, fontFamily: T.fontBody,
  fontSize: 16, color: T.ink, outline: 'none', marginBottom: 20,
  boxShadow: '0 2px 4px rgba(0,0,0,0.02) inset'
};

const labelStyle = { display: 'block', fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, color: T.textSub, marginBottom: 6 };

export default function Exercicio() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');
  
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [categoria, setCategoria] = useState('costas');
  const [qualidade, setQualidade] = useState('medio');
  const [calorias, setCalorias] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await registrarTreino({
        user_id: userId, data, categoria, qualidade,
        calorias_gastas: calorias ? parseInt(calorias) : null,
        observacoes: observacoes || null
      });
      setStatus('Treino salvo!');
      setCalorias(''); setObservacoes('');
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus('Erro ao salvar');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 30 }}>
        <button className="back-btn" onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', fontSize: 24, color: T.textMut, padding: 0 }}>←</button>
        <h1 className="title">Exercício</h1>
      </div>

      {status && <div style={{ padding: 16, background: status.includes('Erro') ? 'rgba(220,38,38,0.1)' : 'rgba(34,197,94,0.1)', color: status.includes('Erro') ? '#dc2626' : '#16a34a', borderRadius: 10, marginBottom: 20, textAlign: 'center', fontFamily: T.fontBody, fontWeight: 600 }}>{status === 'loading' ? '⏳ Salvando...' : status}</div>}

      <form onSubmit={handleSubmit} style={{ background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: `1px solid ${T.glassBorder}`, borderRadius: 14, padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        
        <label style={labelStyle}>Data</label>
        <input type="date" value={data} onChange={e => setData(e.target.value)} style={inputStyle} required />

        <label style={labelStyle}>Categoria</label>
        <select value={categoria} onChange={e => setCategoria(e.target.value)} style={inputStyle}>
          <option value="costas">Costas</option>
          <option value="triceps">Tríceps</option>
          <option value="biceps">Bíceps</option>
          <option value="perna">Perna</option>
          <option value="peito">Peito</option>
          <option value="ombro">Ombro</option>
          <option value="cardio">Cardio</option>
          <option value="full_body">Full Body</option>
          <option value="outro">Outro</option>
        </select>

        <label style={labelStyle}>Qualidade</label>
        <select value={qualidade} onChange={e => setQualidade(e.target.value)} style={inputStyle}>
          <option value="abaixo_esperado">Abaixo do esperado</option>
          <option value="medio">Médio</option>
          <option value="acima_esperado">Acima do esperado</option>
        </select>

        <label style={labelStyle}>Calorias Gastas (opcional)</label>
        <input type="number" placeholder="ex: 450" value={calorias} onChange={e => setCalorias(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Observações (opcional)</label>
        <input type="text" placeholder="ex: senti dor leve no ombro" value={observacoes} onChange={e => setObservacoes(e.target.value)} style={inputStyle} />

        <button type="submit" style={{ width: '100%', background: T.ink, color: '#fff', border: 'none', borderRadius: 10, padding: 16, fontFamily: T.fontBody, fontSize: 16, fontWeight: 700, marginTop: 10 }}>
          Salvar treino
        </button>
      </form>
    </div>
  );
}
