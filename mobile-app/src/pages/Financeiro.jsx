import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrarTransacao } from '../services/api';
import QRCodeScanner from '../components/QRCodeScanner';
import LoadingOverlay from '../components/LoadingOverlay';

const T = {
  glass:       'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.90)',
  blur:        'blur(28px) saturate(200%)',
  ink:         '#0a0a0a',
  textSub:     '#525252',
  textMut:     '#a3a3a3',
  fontBody:    "'DM Sans', sans-serif"
};

const formatarValor = (valor) => {
  const nums = valor.replace(/\D/g, '');
  const centavos = (parseInt(nums || '0') / 100).toFixed(2);
  return centavos.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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

const categories = ['alimentacao', 'transporte', 'lazer', 'saude', 'moradia', 'investimento', 'salario', 'outros'];
const paymentTypes = [
  { id: 'credito', label: 'Crédito' },
  { id: 'debito', label: 'Débito' },
  { id: 'pix', label: 'Pix' },
  { id: 'dinheiro', label: 'Dinheiro' }
];

export default function Financeiro() {
  const navigate = useNavigate();
  const hoje = new Date();
  const dInit = String(hoje.getDate()).padStart(2, '0') + '/' + String(hoje.getMonth() + 1).padStart(2, '0') + '/' + hoje.getFullYear();
  
  const [data, setData] = useState(dInit);
  const [tipo, setTipo] = useState('saida');
  const [valor, setValor] = useState('0,00');
  const [categoria, setCategoria] = useState('');
  const [tipoPagamento, setTipoPagamento] = useState('pix');
  const [descricao, setDescricao] = useState('');
  const [custoFixo, setCustoFixo] = useState(false);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoria) return alert("Selecione uma categoria");
    if (data.length !== 10) return setStatus('Erro: Data incompleta');
    
    setIsLoading(true);
    let numericValue = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numericValue) || numericValue <= 0) {
      setIsLoading(false);
      return setStatus('Erro: Valor inválido');
    }

    try {
      const userId = localStorage.getItem('user_id');
      await registrarTransacao({
        user_id: userId,
        data: paraISO(data),
        tipo,
        categoria,
        valor: numericValue,
        tipo_pagamento: tipoPagamento,
        descricao: descricao || null,
        custo_fixo: custoFixo
      });
      setIsLoading(false);
      setStatus('Registrado com sucesso!');
      setValor('0,00'); setDescricao(''); setCustoFixo(false);
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      setIsLoading(false);
      setStatus('Erro ao registrar');
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const inputStyle = { width: '100%', minHeight: 48, padding: '14px 16px', borderRadius: 10, border: 'none', fontFamily: T.fontBody, fontSize: 16, color: T.ink, outline: 'none', marginBottom: 20, background: 'rgba(255,255,255,0.8)' };
  const labelStyle = { display: 'block', fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, color: T.textSub, marginBottom: 6 };

  return (
    <div className="container" style={{ paddingBottom: 100 }}>
      {isLoading && <LoadingOverlay text="Salvando..." />}
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30, marginTop: 20 }}>
        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>←</button>
        <h1 className="title">Financeiro</h1>
      </div>

      {status && <div style={{ padding: 16, background: status.includes('Erro') ? 'rgba(220,38,38,0.1)' : 'rgba(34,197,94,0.1)', color: status.includes('Erro') ? '#dc2626' : '#16a34a', borderRadius: 10, marginBottom: 20, textAlign: 'center', fontFamily: T.fontBody, fontWeight: 600 }}>{status}</div>}

      <form onSubmit={handleSubmit} style={{ background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: `1px solid ${T.glassBorder}`, borderRadius: 14, padding: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        
        <button type="button" onClick={() => setShowScanner(true)} style={{ width: '100%', background: 'rgba(255,255,255,0.8)', color: T.ink, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 16, fontFamily: T.fontBody, fontSize: 15, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          Preencher com Nota Fiscal
        </button>

        <label style={labelStyle}>Data</label>
        <input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10} value={data} onChange={e => setData(formatarData(e.target.value))} style={inputStyle} required />

        <label style={labelStyle}>Tipo</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {['entrada', 'saida'].map(t => (
            <button key={t} type="button" onClick={() => setTipo(t)} style={{ flex: 1, padding: 14, borderRadius: 10, border: 'none', background: tipo === t ? T.ink : 'rgba(255,255,255,0.5)', color: tipo === t ? '#fff' : T.textSub, fontFamily: T.fontBody, fontWeight: 700 }}>
              {t === 'entrada' ? 'Receita' : 'Despesa'}
            </button>
          ))}
        </div>

        <label style={labelStyle}>Valor</label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 16, top: 14, fontFamily: T.fontBody, fontSize: 16, color: T.ink, fontWeight: 600 }}>R$</span>
          <input 
            type="text" 
            inputMode="numeric" 
            value={valor} 
            onChange={e => setValor(formatarValor(e.target.value))} 
            style={{...inputStyle, paddingLeft: 44, fontWeight: 700}} 
            required 
          />
        </div>

        <label style={labelStyle}>Categoria</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {categories.map(cat => (
            <button key={cat} type="button" onClick={() => setCategoria(cat)} style={{ padding: '8px 14px', borderRadius: 20, border: 'none', background: categoria === cat ? T.ink : 'rgba(255,255,255,0.5)', color: categoria === cat ? '#fff' : T.textSub, fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>
              {cat}
            </button>
          ))}
        </div>

        <label style={labelStyle}>Tipo de Pagamento</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {paymentTypes.map(pt => (
            <button key={pt.id} type="button" onClick={() => setTipoPagamento(pt.id)} style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.1)', background: tipoPagamento === pt.id ? T.ink : 'rgba(255,255,255,0.8)', color: tipoPagamento === pt.id ? '#fff' : T.ink, fontFamily: T.fontBody, fontSize: 13, fontWeight: 700 }}>
              {pt.label}
            </button>
          ))}
        </div>

        <label style={labelStyle}>Descrição</label>
        <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Mercado" style={inputStyle} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
          <input type="checkbox" checked={custoFixo} onChange={e => setCustoFixo(e.target.checked)} style={{ width: 20, height: 20 }} />
          <span style={{ fontFamily: T.fontBody, fontSize: 14, color: T.textSub, fontWeight: 600 }}>Custo Fixo (Repete mensalmente)</span>
        </div>

        <button type="submit" style={{ width: '100%', background: T.ink, color: '#fff', border: 'none', borderRadius: 10, padding: 16, fontFamily: T.fontBody, fontSize: 16, fontWeight: 700 }}>
          Registrar {tipo === 'entrada' ? 'Entrada' : 'Saída'}
        </button>
      </form>

      {showScanner && (
        <QRCodeScanner 
          onClose={() => setShowScanner(false)}
          onSaveSuccess={() => {
            setShowScanner(false);
            setStatus('Lançamento salvo!');
            setTimeout(() => setStatus(null), 3000);
          }}
        />
      )}
    </div>
  );
}
