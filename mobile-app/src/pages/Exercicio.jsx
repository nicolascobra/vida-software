import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registrarTreino } from '../services/api';

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
        user_id: userId,
        data,
        categoria,
        qualidade,
        calorias_gastas: calorias ? parseInt(calorias) : null,
        observacoes: observacoes || null
      });
      setStatus('✅ Treino salvo!');
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error(error);
      setStatus('❌ Erro ao salvar');
    }
  };

  return (
    <div className="container">
      <div className="header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <h1 className="title">Exercício</h1>
        <div style={{width: '24px'}}></div>
      </div>

      {status && <div style={{ padding: '15px', background: status.includes('Erro') ? '#4a1111' : '#114a22', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>{status === 'loading' ? '⏳' : status}</div>}

      <form onSubmit={handleSubmit}>
        <label>Data</label>
        <input type="date" value={data} onChange={e => setData(e.target.value)} required />

        <label>Categoria</label>
        <select value={categoria} onChange={e => setCategoria(e.target.value)}>
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

        <label>Qualidade</label>
        <select value={qualidade} onChange={e => setQualidade(e.target.value)}>
          <option value="abaixo_esperado">Abaixo do esperado</option>
          <option value="medio">Médio</option>
          <option value="acima_esperado">Acima do esperado</option>
        </select>

        <label>Calorias</label>
        <input type="number" placeholder="ex: 450" value={calorias} onChange={e => setCalorias(e.target.value)} />

        <label>Observações</label>
        <input type="text" placeholder="ex: senti dor no ombro" value={observacoes} onChange={e => setObservacoes(e.target.value)} />

        <button type="submit" style={{ marginTop: '20px', background: '#333' }}>Salvar treino</button>
      </form>
    </div>
  );
}
