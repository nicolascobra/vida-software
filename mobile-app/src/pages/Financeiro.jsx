import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrarTransacao } from '../services/api';

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
    if (!categoria) {
      alert("Selecione uma categoria");
      return;
    }
    setStatus('loading');
    
    let numericValue = parseFloat(valor.replace(',', '.'));
    if (isNaN(numericValue)) {
      setStatus('❌ Erro: Valor inválido');
      return;
    }

    try {
      await registrarTransacao({
        user_id: userId,
        data,
        tipo,
        categoria,
        valor: numericValue,
        descricao: descricao || null,
        custo_fixo: custoFixo
      });
      setStatus('✅ Registrado com sucesso!');
      setValor('');
      setDescricao('');
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error(error);
      setStatus('❌ Erro ao registrar');
    }
  };

  return (
    <div className="container">
      <div className="header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <h1 className="title">Financeiro</h1>
        <div style={{width: '24px'}}></div>
      </div>

      {status && <div style={{ padding: '15px', background: status.includes('Erro') ? '#4a1111' : '#114a22', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>{status === 'loading' ? '⏳' : status}</div>}

      <form onSubmit={handleSubmit}>
        <label>Data</label>
        <input type="date" value={data} onChange={e => setData(e.target.value)} required />

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button type="button" onClick={() => setTipo('entrada')} style={{ background: tipo === 'entrada' ? '#2e7d32' : '#2a2a2a' }}>Entrada</button>
          <button type="button" onClick={() => setTipo('saida')} style={{ background: tipo === 'saida' ? '#c62828' : '#2a2a2a' }}>Saída</button>
        </div>

        <label>Valor</label>
        <input type="number" step="0.01" inputMode="decimal" placeholder="0.00" value={valor} onChange={e => setValor(e.target.value)} style={{ fontSize: '30px', padding: '20px', textAlign: 'center' }} required />

        <label>Categoria</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {categories.map(cat => (
            <div key={cat} onClick={() => setCategoria(cat)} style={{ padding: '8px 16px', borderRadius: '20px', background: categoria === cat ? '#007bff' : '#2a2a2a', cursor: 'pointer', fontSize: '14px', textTransform: 'capitalize' }}>
              {cat}
            </div>
          ))}
        </div>

        <label>Descrição (opcional)</label>
        <input type="text" placeholder="Ex: Conta de luz" value={descricao} onChange={e => setDescricao(e.target.value)} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
          <input type="checkbox" id="custoFixo" checked={custoFixo} onChange={e => setCustoFixo(e.target.checked)} style={{ width: '20px', height: '20px', margin: 0 }} />
          <label htmlFor="custoFixo">Custo Fixo Mensal</label>
        </div>

        <button type="submit" style={{ background: '#333' }}>Registrar</button>
      </form>
    </div>
  );
}
