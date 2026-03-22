import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrarTransacao } from '../services/api';

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
const categories = ['alimentacao', 'transporte', 'lazer', 'saude', 'moradia', 'investimento', 'salario'];

export default function Financeiro() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');

  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [tipo, setTipo] = useState('saida');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [custoFixo, setCustoFixo] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoria) return alert("Selecione uma categoria");
    setStatus('loading');
    let numericValue = parseFloat(valor.replace(',', '.'));
    if (isNaN(numericValue)) return setStatus(' Erro: Valor inválido');

    try {
      await registrarTransacao({
        user_id: userId, data, tipo, categoria, valor: numericValue,
        descricao: descricao || null, custo_fixo: custoFixo
      });
      setStatus('Registrado!');
      setValor(''); setDescricao(''); setCustoFixo(false);
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setStatus(' Erro ao registrar');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 30 }}>
        <button className="back-btn" onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', fontSize: 24, color: T.textMut, padding: 0 }}>←</button>
        <h1 className="title">Financeiro</h1>
      </div>

      {status && <div style={{ padding: 16, background: status.includes('Erro') ? 'rgba(220,38,38,0.1)' : 'rgba(34,197,94,0.1)', color: status.includes('Erro') ? '#dc2626' : '#16a34a', borderRadius: 10, marginBottom: 20, textAlign: 'center', fontFamily: T.fontBody, fontWeight: 600 }}>{status === 'loading' ? '⏳ Salvando...' : status}</div>}

      <form onSubmit={handleSubmit} style={{ background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: `1px solid ${T.glassBorder}`, borderRadius: 14, padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        
        <label style={labelStyle}>Data</label>
        <input type="date" value={data} onChange={e => setData(e.target.value)} style={inputStyle} required />

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button type="button" onClick={() => setTipo('entrada')} style={{ flex: 1, padding: 14, borderRadius: 10, border: '1px solid rgba(0,0,0,0.05)', background: tipo === 'entrada' ? '#004444' : 'rgba(255,255,255,0.6)', color: tipo === 'entrada' ? '#fff' : T.textSub, fontWeight: 700, fontFamily: T.fontBody }}>Entrada</button>
          <button type="button" onClick={() => setTipo('saida')} style={{ flex: 1, padding: 14, borderRadius: 10, border: '1px solid rgba(0,0,0,0.05)', background: tipo === 'saida' ? '#a52a2a' : 'rgba(255,255,255,0.6)', color: tipo === 'saida' ? '#fff' : T.textSub, fontWeight: 700, fontFamily: T.fontBody }}>Saída</button>
        </div>

        <label style={labelStyle}>Valor</label>
        <input type="number" step="0.01" inputMode="decimal" placeholder="0.00" value={valor} onChange={e => setValor(e.target.value)} style={{ ...inputStyle, fontSize: 32, padding: 20, textAlign: 'center', fontWeight: 700 }} required />

        <label style={labelStyle}>Categoria</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {categories.map(cat => (
            <div key={cat} onClick={() => setCategoria(cat)} style={{ padding: '10px 16px', borderRadius: 20, background: categoria === cat ? T.ink : 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.05)', color: categoria === cat ? '#fff' : T.textSub, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: T.fontBody, textTransform: 'capitalize' }}>
              {cat}
            </div>
          ))}
        </div>

        <label style={labelStyle}>Descrição (opcional)</label>
        <input type="text" placeholder="Ex: Conta de luz" value={descricao} onChange={e => setDescricao(e.target.value)} style={inputStyle} />

        <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30, background: 'rgba(255,255,255,0.5)', padding: 14, borderRadius: 10 }}>
          <input type="checkbox" checked={custoFixo} onChange={e => setCustoFixo(e.target.checked)} style={{ width: 22, height: 22, margin: 0, accentColor: T.ink }} />
          <span style={{ fontFamily: T.fontBody, fontSize: 15, fontWeight: 600, color: T.ink }}>Custo Fixo Mensal</span>
        </label>

        <button type="submit" style={{ width: '100%', background: T.ink, color: '#fff', border: 'none', borderRadius: 10, padding: 16, fontFamily: T.fontBody, fontSize: 16, fontWeight: 700 }}>
          Registrar {tipo === 'entrada' ? 'Entrada' : 'Saída'}
        </button>
      </form>
    </div>
  );
}
