import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CARDAPIO from '../constants/cardapio';
import { criarRefeicao, adicionarItem } from '../services/api';
import LoadingOverlay from '../components/LoadingOverlay';

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

const TIPOS = [
  { id: 'pre_treino', label: 'Pré Treino' },
  { id: 'cafe_da_manha', label: 'Café da Manhã' },
  { id: 'lanche_manha', label: 'Lanche da Manhã' },
  { id: 'almoco', label: 'Almoço' },
  { id: 'lanche_tarde', label: 'Lanche da Tarde' },
  { id: 'janta', label: 'Janta' },
  { id: 'ceia', label: 'Ceia' }
];

const inputStyle = {
  minHeight: 48, padding: '10px 14px', background: 'rgba(255,255,255,0.8)',
  border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, fontFamily: T.fontBody,
  fontSize: 16, color: T.ink, outline: 'none'
};

export default function Alimentacao() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');
  const hoje = new Date();
  const dInit = String(hoje.getDate()).padStart(2, '0') + '/' + String(hoje.getMonth() + 1).padStart(2, '0') + '/' + hoje.getFullYear();
  
  const [data, setData] = useState(dInit);
  const [aberto, setAberto] = useState(null);
  const [selecionados, setSelecionados] = useState({});
  const [status, setStatus] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const toggleItem = (tipo, index) => {
    setSelecionados(prev => {
      const listas = prev[tipo] || [];
      if (listas.includes(index)) return { ...prev, [tipo]: listas.filter(i => i !== index) };
      return { ...prev, [tipo]: [...listas, index] };
    });
  };

  const getResumo = (tipo) => {
    const sel = selecionados[tipo] || [];
    if (sel.length === 0) return null;
    let kcal = 0;
    sel.forEach(i => kcal += CARDAPIO[tipo][i][2]);
    return `${sel.length} itens • ${kcal.toFixed(0)} kcal`;
  };

  const salvarRefeicao = async (tipo) => {
    const sel = selecionados[tipo] || [];
    if (sel.length === 0) return;
    if (data.length !== 10) {
      setStatus(prev => ({ ...prev, [tipo]: 'Erro: Data incompleta' }));
      return;
    }

    setIsLoading(true);
    
    try {
      const dataRef = await criarRefeicao(userId, paraISO(data));
      const refId = dataRef.refeicao_diaria_id || dataRef.id;
      
      const itemsPayload = sel.map(index => {
        const itemInfo = CARDAPIO[tipo][index];
        return {
          nome_alimento: itemInfo[0], quantidade_g: itemInfo[1], calorias: itemInfo[2],
          proteinas_g: itemInfo[3], carboidratos_g: itemInfo[4], gorduras_g: itemInfo[5]
        };
      });

      await Promise.all(itemsPayload.map(item => adicionarItem(refId, tipo, item)));
      setIsLoading(false);
      setStatus(prev => ({ ...prev, [tipo]: 'Salvo com sucesso!' }));
      setTimeout(() => { setStatus(prev => ({ ...prev, [tipo]: null })); setAberto(null); }, 2000);
    } catch (err) {
      setIsLoading(false);
      setStatus(prev => ({ ...prev, [tipo]: 'Erro de processamento' }));
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 100 }}>
      {isLoading && <LoadingOverlay text="Salvando refeição..." />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', fontSize: 24, color: T.textMut, padding: 0 }}>
            ←
          </button>
          <h1 className="title">Alimentação</h1>
        </div>
        <input type="text" inputMode="numeric" placeholder="DD/MM" maxLength={10} value={data} onChange={e => setData(formatarData(e.target.value))} style={{ ...inputStyle, minHeight: 40, width: 120, textAlign: 'center' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {TIPOS.map(tipoObj => {
          const tipo = tipoObj.id;
          const isAberto = aberto === tipo;
          const resumo = getResumo(tipo);
          
          return (
            <div key={tipo} style={{ background: T.glass, backdropFilter: T.blur, WebkitBackdropFilter: T.blur, border: `1px solid ${T.glassBorder}`, borderRadius: 14, padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setAberto(isAberto ? null : tipo)}>
                <span style={{ fontFamily: T.fontHead, fontSize: 18, fontWeight: 700, color: T.ink }}>{tipoObj.label}</span>
                <span style={{ fontFamily: T.fontBody, fontSize: 14, color: T.textSub }}>{resumo}</span>
              </div>

              {isAberto && (
                <div style={{ marginTop: 20 }}>
                  {CARDAPIO[tipo]?.map((item, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: 14, background: 'rgba(255,255,255,0.7)', borderRadius: 10, border: '1px solid rgba(0,0,0,0.05)' }}>
                      <input type="checkbox" checked={(selecionados[tipo] || []).includes(idx)} onChange={() => toggleItem(tipo, idx)} style={{ width: 22, height: 22, margin: 0, accentColor: T.ink }} />
                      <span style={{ flex: 1, fontFamily: T.fontBody, fontSize: 15, color: T.ink }}>{item[0]}</span>
                      <span style={{ color: T.textSub, fontSize: 13, fontFamily: T.fontBody }}>{item[2]} kcal</span>
                    </label>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
                    <button onClick={() => salvarRefeicao(tipo)} style={{ flex: 1, background: T.ink, color: '#fff', border: 'none', borderRadius: 10, padding: 16, fontFamily: T.fontBody, fontSize: 15, fontWeight: 600 }}>
                      Salvar
                    </button>
                    {status[tipo] && <span style={{ fontFamily: T.fontBody, fontSize: 14, color: status[tipo].includes('Erro') ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{status[tipo]}</span>}
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
