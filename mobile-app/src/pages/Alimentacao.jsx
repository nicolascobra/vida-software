import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CARDAPIO from '../constants/cardapio';
import { criarRefeicao, adicionarItem } from '../services/api';

const TIPOS = [
  { id: 'pre_treino', label: 'Pré Treino' },
  { id: 'cafe_da_manha', label: 'Café da Manhã' },
  { id: 'lanche_manha', label: 'Lanche da Manhã' },
  { id: 'almoco', label: 'Almoço' },
  { id: 'lanche_tarde', label: 'Lanche da Tarde' },
  { id: 'janta', label: 'Janta' },
  { id: 'ceia', label: 'Ceia' }
];

export default function Alimentacao() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [aberto, setAberto] = useState(null);
  
  const [selecionados, setSelecionados] = useState({});
  const [status, setStatus] = useState({});

  const toggleItem = (tipo, index) => {
    setSelecionados(prev => {
      const listas = prev[tipo] || [];
      if (listas.includes(index)) {
        return { ...prev, [tipo]: listas.filter(i => i !== index) };
      } else {
        return { ...prev, [tipo]: [...listas, index] };
      }
    });
  };

  const getResumo = (tipo) => {
    const sel = selecionados[tipo] || [];
    if (sel.length === 0) return null;
    const items = CARDAPIO[tipo];
    let kcal = 0;
    sel.forEach(i => {
      kcal += items[i][2];
    });
    return `${sel.length} itens • ${kcal.toFixed(0)} kcal`;
  };

  const salvarRefeicao = async (tipo) => {
    const sel = selecionados[tipo] || [];
    if (sel.length === 0) return;
    
    setStatus(prev => ({ ...prev, [tipo]: '⏳' }));
    
    try {
      const dataRef = await criarRefeicao(userId, data);
      const refId = dataRef.refeicao_diaria_id || dataRef.id;
      
      const itemsPayload = sel.map(index => {
        const itemInfo = CARDAPIO[tipo][index];
        return {
          nome_alimento: itemInfo[0],
          quantidade_g: itemInfo[1],
          calorias: itemInfo[2],
          proteinas_g: itemInfo[3],
          carboidratos_g: itemInfo[4],
          gorduras_g: itemInfo[5]
        };
      });

      await Promise.all(itemsPayload.map(item => adicionarItem(refId, tipo, item)));
      
      setStatus(prev => ({ ...prev, [tipo]: '✅ Salvo!' }));
      setTimeout(() => {
        setStatus(prev => ({ ...prev, [tipo]: null }));
        setAberto(null);
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setStatus(prev => ({ ...prev, [tipo]: '❌ Erro' }));
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '80px' }}>
      <div className="header">
        <button className="back-btn" onClick={() => navigate('/home')}>←</button>
        <input type="date" value={data} onChange={e => setData(e.target.value)} style={{ width: 'auto', marginBottom: 0, padding: '8px' }} />
        <div style={{width: '24px'}}></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {TIPOS.map(tipoObj => {
          const tipo = tipoObj.id;
          const isAberto = aberto === tipo;
          const resumo = getResumo(tipo);
          
          return (
            <div key={tipo} className="card" style={{ padding: '15px' }}>
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setAberto(isAberto ? null : tipo)}
              >
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{tipoObj.label}</div>
                <div style={{ color: '#888', fontSize: '14px' }}>{resumo}</div>
              </div>

              {isAberto && (
                <div style={{ marginTop: '20px' }}>
                  {CARDAPIO[tipo]?.map((item, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', padding: '10px', background: '#2a2a2a', borderRadius: '8px' }}>
                      <input 
                        type="checkbox" 
                        checked={(selecionados[tipo] || []).includes(idx)}
                        onChange={() => toggleItem(tipo, idx)}
                        style={{ width: '20px', height: '20px', margin: 0 }}
                      />
                      <span style={{flex: 1}}>{item[0]}</span>
                      <span style={{ color: '#aaa', fontSize: '14px' }}>{item[2]} kcal</span>
                    </label>
                  ))}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '15px' }}>
                    <button onClick={() => salvarRefeicao(tipo)} style={{ background: '#007bff', padding: '10px' }}>Salvar</button>
                    {status[tipo] && <span>{status[tipo]}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
