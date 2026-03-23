import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrarTreino } from '../services/api';
import LoadingOverlay from '../components/LoadingOverlay';

const T = {
  glass:       'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.90)',
  blur:        'blur(28px) saturate(200%)',
  ink:         '#0a0a0a',
  qGreen:      '#16a34a',
  qYellow:     '#ca8a04',
  qRed:        '#dc2626',
  textSub:     '#525252',
  textMut:     '#a3a3a3',
  fontHead:    "'Syne', sans-serif",
  fontBody:    "'DM Sans', sans-serif",
};

const formatarData = (valor) => {
  const nums = valor.replace(/\D/g, '').slice(0, 8);
  if (nums.length <= 2) return nums;
  if (nums.length <= 4) return `${nums.slice(0,2)}/${nums.slice(2)}`;
  return `${nums.slice(0,2)}/${nums.slice(2,4)}/${nums.slice(4)}`;
};

const paraISO = (dataStr) => {
  if (!dataStr || dataStr.length !== 10) return new Date().toISOString().split('T')[0];
  const [d, m, a] = dataStr.split('/');
  return `${a}-${m}-${d}`;
};

const CATEGORIAS = ['costas', 'triceps', 'biceps', 'perna', 'peito', 'ombro', 'cardio', 'full_body', 'outro'];

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
  
  const hoje = new Date();
  const dInit = String(hoje.getDate()).padStart(2, '0') + '/' + String(hoje.getMonth() + 1).padStart(2, '0') + '/' + hoje.getFullYear();
  
  const [data, setData] = useState(dInit);
  const [categorias, setCategorias] = useState([]);
  const [qualidade, setQualidade] = useState('medio');
  const [calorias, setCalorias] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleCategoria = (cat) => {
    setCategorias(prev => {
      if (prev.includes(cat)) return prev.filter(c => c !== cat);
      return [...prev, cat];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (categorias.length === 0) return setStatus('Erro: Selecione ao menos uma categoria');
    if (data.length !== 10) return setStatus('Erro: Data incompleta');

    setIsLoading(true);
    try {
      await registrarTreino({
        user_id: userId, 
        data: paraISO(data), 
        categoria: categorias, // List[str] per requirements
        qualidade,
        calorias_gastas: calorias ? parseInt(calorias) : null,
        observacoes: observacoes || null
      });
      setIsLoading(false);
      setStatus('Treino salvo!');
      setCalorias(''); setObservacoes(''); setCategorias([]);
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setIsLoading(false);
      setStatus('Erro ao salvar');
      setTimeout(() => setStatus(null), 3000);
    }
  };

  return (
    <div className="container">
      {isLoading && <LoadingOverlay text="Salvando treino..." />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 30 }}>
        <button className="back-btn" onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', fontSize: 24, color: T.textMut, padding: 0 }}>←</button>
        <h1 className="title">Exercício</h1>
      </div>

      {status && <div style={{ padding: 16, background: status.includes('Erro') ? 'rgba(220,38,38,0.1)' : 'rgba(34,197,94,0.1)', color: status.includes('Erro') ? '#dc2626' : '#16a34a', borderRadius: 10, marginBottom: 20, textAlign: 'center', fontFamily: T.fontBody, fontWeight: 600 }}>{status}</div>}

      <form onSubmit={handleSubmit} style={{ background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: `1px solid ${T.glassBorder}`, borderRadius: 14, padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        
        <label style={labelStyle}>Data</label>
        <input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={data} onChange={e => setData(formatarData(e.target.value))} style={inputStyle} required />

        <label style={labelStyle}>Grupos musculares (múltipla seleção)</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {CATEGORIAS.map(cat => (
            <button 
              key={cat} 
              type="button" 
              onClick={() => toggleCategoria(cat)} 
              style={{ 
                padding: '8px 14px', 
                borderRadius: 20, 
                border: 'none', 
                background: categorias.includes(cat) ? T.ink : 'rgba(255,255,255,0.5)', 
                color: categorias.includes(cat) ? '#fff' : T.textSub, 
                fontFamily: T.fontBody, fontSize: 13, fontWeight: 600,
                textTransform: 'capitalize'
              }}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <label style={labelStyle}>Qualidade</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { key: 'abaixo_esperado', label: 'Abaixo', color: T.qRed },
            { key: 'medio',           label: 'Médio',  color: T.qYellow },
            { key: 'acima_esperado',  label: 'Acima',  color: T.qGreen },
          ].map(({ key, label, color }) => (
            <button key={key} type="button"
              onClick={() => setQualidade(key)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, cursor: 'pointer',
                fontFamily: T.fontBody, fontSize: 13, fontWeight: 600,
                border: qualidade === key ? 'none' : `1px solid rgba(0,0,0,0.1)`,
                background: qualidade === key ? color : 'rgba(255,255,255,0.5)',
                color: qualidade === key ? '#fff' : T.textSub,
                transition: 'all 0.14s ease',
              }}>{label}</button>
          ))}
        </div>

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
