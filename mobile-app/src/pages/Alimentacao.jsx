import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buscarTabelaNutricional,
  criarAlimentoNutricional,
  registrarRefeicaoCompleta,
} from '../services/api';
import LoadingOverlay from '../components/LoadingOverlay';

// ─── Tema ───────────────────────────────────────────────────────

const T = {
  ink:         '#354f36',
  inkLt:       'rgba(53,79,54,0.18)',
  textSub:     '#4a6b4a',
  textMut:     'rgba(53,79,54,0.50)',
  fontHead:    "'Syne', sans-serif",
  fontBody:    "'DM Sans', sans-serif",
};

const NUT = {
  prot: '#7c4e32', protHero: '#c4855a',
  carb: '#b8890a', carbHero: '#e5b60f',
  fat:  '#c4527a', fatHero:  '#e879a0',
};

// ─── Constantes ─────────────────────────────────────────────────

const TIPOS = [
  { id: 'pre_treino',   label: 'Pré-treino',       icon: '⚡' },
  { id: 'cafe_manha',   label: 'Café da manhã',     icon: '☕' },
  { id: 'lanche_manha', label: 'Lanche da manhã',   icon: '🍎' },
  { id: 'almoco',       label: 'Almoço',             icon: '🍽' },
  { id: 'lanche_tarde', label: 'Lanche da tarde',    icon: '🥪' },
  { id: 'jantar',       label: 'Jantar',             icon: '🌙' },
  { id: 'ceia',         label: 'Ceia',               icon: '🌛' },
];

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

// ─── Estilos base ────────────────────────────────────────────────

const baseInput = {
  width: '100%', boxSizing: 'border-box',
  minHeight: 48, padding: '10px 14px',
  background: 'rgba(255,255,255,0.8)',
  border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10,
  fontFamily: T.fontBody, fontSize: 16, color: T.ink, outline: 'none',
};

const pill = (active) => ({
  padding: '10px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
  border: active ? 'none' : '1px solid rgba(0,0,0,0.10)',
  background: active ? T.ink : 'rgba(255,255,255,0.65)',
  transition: 'all 0.15s ease',
});

// ─── Modal: Novo Alimento ────────────────────────────────────────

function ModalNovoAlimento({ onClose, onSave }) {
  const [form, setForm] = useState({
    alimento: '', descricao_unidade: '1 unidade',
    kcal: '', proteina: '', carboidrato: '', gordura: '',
  });
  const [salvando, setSalvando] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSave(e) {
    e.preventDefault();
    if (!form.alimento || !form.kcal) return;
    setSalvando(true);
    try {
      const novo = await onSave({
        alimento: form.alimento,
        descricao_unidade: form.descricao_unidade || '1 unidade',
        kcal:        parseFloat(form.kcal)        || 0,
        proteina:    parseFloat(form.proteina)    || 0,
        carboidrato: parseFloat(form.carboidrato) || 0,
        gordura:     parseFloat(form.gordura)     || 0,
      });
      onClose(novo);
    } catch(e) { console.error(e); setSalvando(false); }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: 0,
    }} onClick={() => onClose(null)}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: '20px 20px 0 0',
        padding: '24px 20px 40px', width: '100%', maxWidth: 540,
        boxShadow: '0 -8px 32px rgba(0,0,0,0.15)',
      }}>
        <div style={{ width: 40, height: 4, background: 'rgba(0,0,0,0.15)', borderRadius: 99, margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontFamily: T.fontHead, fontSize: 17, fontWeight: 700, color: T.ink }}>Novo alimento</span>
          <button onClick={() => onClose(null)} style={{ background: 'none', border: 'none', fontSize: 22, color: T.textMut, cursor: 'pointer' }}>×</button>
        </div>
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSub, display: 'block', marginBottom: 5 }}>Nome do alimento</label>
            <input value={form.alimento} onChange={e => set('alimento', e.target.value)}
              placeholder="ex: Frango grelhado" style={baseInput} required />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textSub, display: 'block', marginBottom: 5 }}>Descrição da unidade</label>
            <input value={form.descricao_unidade} onChange={e => set('descricao_unidade', e.target.value)}
              placeholder="ex: 100g, 1 unidade, 1 colher" style={baseInput} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
            {[
              { key: 'kcal',        label: 'Kcal',   color: T.ink          },
              { key: 'proteina',    label: 'Prot. g', color: NUT.protHero   },
              { key: 'carboidrato', label: 'Carb. g', color: NUT.carbHero   },
              { key: 'gordura',     label: 'Gord. g', color: NUT.fatHero    },
            ].map(({ key, label, color }) => (
              <div key={key}>
                <label style={{ fontFamily: T.fontBody, fontSize: 11, color, fontWeight: 700, display: 'block', marginBottom: 4 }}>{label}</label>
                <input type="number" inputMode="decimal" min="0" step="0.1"
                  value={form[key]} onChange={e => set(key, e.target.value)}
                  placeholder="0" style={{ ...baseInput, padding: '8px', fontSize: 14, minHeight: 42 }} />
              </div>
            ))}
          </div>
          <button type="submit" disabled={salvando || !form.alimento || !form.kcal} style={{
            width: '100%', padding: 16, border: 'none', borderRadius: 12,
            background: (salvando || !form.alimento || !form.kcal) ? 'rgba(0,0,0,0.18)' : T.ink,
            color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: T.fontBody,
            cursor: (salvando || !form.alimento || !form.kcal) ? 'default' : 'pointer',
          }}>{salvando ? 'Salvando…' : 'Adicionar à tabela'}</button>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────

export default function Alimentacao() {
  const navigate   = useNavigate();
  const userId     = localStorage.getItem('user_id');
  const hoje       = new Date();
  const dInit      = String(hoje.getDate()).padStart(2,'0') + '/' +
                     String(hoje.getMonth()+1).padStart(2,'0') + '/' +
                     hoje.getFullYear();

  // ── State ──
  const [step,           setStep]           = useState(1); // 1=tipo, 2=alimentos
  const [data,           setData]           = useState(dInit);
  const [tipo,           setTipo]           = useState('');
  const [tabela,         setTabela]         = useState([]);
  const [loadingTabela,  setLoadingTabela]  = useState(true);
  const [selectedFoods,  setSelectedFoods]  = useState({}); // { id: qty }
  const [search,         setSearch]         = useState('');
  const [modalNovo,      setModalNovo]      = useState(false);
  const [salvando,       setSalvando]       = useState(false);
  const [statusMsg,      setStatusMsg]      = useState('');

  // ── Carrega tabela nutricional ──
  useEffect(() => {
    buscarTabelaNutricional()
      .then(d => setTabela(d || []))
      .catch(() => {})
      .finally(() => setLoadingTabela(false));
  }, []);

  // ── Derivações ──
  const filteredTabela = useMemo(() =>
    tabela.filter(t => t.alimento.toLowerCase().includes(search.toLowerCase())),
  [tabela, search]);

  const totais = useMemo(() =>
    Object.entries(selectedFoods).reduce((acc, [id, qty]) => {
      const item = tabela.find(t => t.id === parseInt(id));
      if (!item || qty === 0) return acc;
      return {
        kcal: acc.kcal + item.kcal        * qty,
        prot: acc.prot + item.proteina    * qty,
        carb: acc.carb + item.carboidrato * qty,
        fat:  acc.fat  + item.gordura     * qty,
      };
    }, { kcal: 0, prot: 0, carb: 0, fat: 0 }),
  [selectedFoods, tabela]);

  const itemsCount = Object.values(selectedFoods).filter(q => q > 0).length;

  // ── Handlers ──
  function setQty(id, delta) {
    setSelectedFoods(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) { const { [id]: _, ...rest } = prev; return rest; }
      return { ...prev, [id]: next };
    });
  }

  async function salvar() {
    if (!itemsCount || salvando) return;
    setSalvando(true);
    setStatusMsg('');
    try {
      const itens = Object.entries(selectedFoods)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => {
          const item = tabela.find(t => t.id === parseInt(id));
          return {
            tabela_nutricional_id: parseInt(id),
            alimento:     item.alimento,
            quantidade:   qty,
            calorias:     Math.round(item.kcal        * qty),
            proteinas:    Math.round(item.proteina    * qty),
            carboidratos: Math.round(item.carboidrato * qty),
            gorduras:     Math.round(item.gordura     * qty),
          };
        });

      await registrarRefeicaoCompleta({
        user_id: userId,
        data:    paraISO(data),
        tipo,
        itens,
      });

      setStatusMsg('✓ Salvo!');
      setTimeout(() => {
        setStatusMsg('');
        setSelectedFoods({});
        setSearch('');
        setStep(1);
        setTipo('');
      }, 1500);
    } catch(e) {
      console.error(e);
      setStatusMsg('Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  async function handleNovoAlimento(payload) {
    return criarAlimentoNutricional(payload);
  }

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="container" style={{ paddingBottom: 110 }}>
      {salvando && <LoadingOverlay text="Salvando refeição…" />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, marginTop: 20 }}>
        <button onClick={() => step === 2 ? setStep(1) : navigate('/home')}
          style={{ background: 'none', border: 'none', fontSize: 24, color: T.textMut, padding: 0, cursor: 'pointer' }}>
          ←
        </button>
        <h1 style={{ fontFamily: T.fontHead, fontSize: 22, fontWeight: 800, color: T.ink, margin: 0, flex: 1, letterSpacing: '-0.03em' }}>
          {step === 1 ? 'Alimentação' : `${TIPOS.find(t => t.id === tipo)?.icon} ${TIPOS.find(t => t.id === tipo)?.label}`}
        </h1>
        {/* Data — só visível na etapa 1 */}
        {step === 1 && (
          <input type="text" inputMode="numeric" placeholder="DD/MM/AAAA" maxLength={10}
            value={data} onChange={e => setData(formatarData(e.target.value))}
            style={{ ...baseInput, width: 130, minHeight: 40, fontSize: 14, textAlign: 'center' }} />
        )}
      </div>

      {/* ── Etapa 1: selecionar tipo de refeição ── */}
      {step === 1 && (
        <div>
          <p style={{ fontFamily: T.fontBody, fontSize: 13, color: T.textMut, marginBottom: 16, marginTop: 0 }}>
            Qual refeição você vai registrar?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TIPOS.map(t => (
              <button key={t.id} onClick={() => { setTipo(t.id); setStep(2); }}
                style={{
                  ...pill(tipo === t.id),
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 18px', textAlign: 'left',
                }}>
                <span style={{ fontSize: 24 }}>{t.icon}</span>
                <span style={{ fontFamily: T.fontBody, fontSize: 16, fontWeight: 600, color: tipo === t.id ? '#fff' : T.ink }}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Etapa 2: selecionar alimentos ── */}
      {step === 2 && (
        <div>
          {/* Busca */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: T.textMut }}>🔍</span>
            <input type="text" placeholder="Buscar alimento…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...baseInput, paddingLeft: 44 }} />
          </div>

          {/* Lista de alimentos */}
          {loadingTabela ? (
            <p style={{ fontFamily: T.fontBody, fontSize: 14, color: T.textMut, textAlign: 'center', padding: '32px 0' }}>
              Carregando tabela nutricional…
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {filteredTabela.length === 0 && (
                <p style={{ fontFamily: T.fontBody, fontSize: 14, color: T.textMut, textAlign: 'center', padding: '24px 0' }}>
                  {tabela.length === 0
                    ? 'Tabela nutricional vazia. Adicione um alimento abaixo.'
                    : 'Nenhum resultado para a busca.'}
                </p>
              )}
              {filteredTabela.map(item => {
                const qty = selectedFoods[item.id] || 0;
                const selected = qty > 0;
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 14px', borderRadius: 12,
                    background: selected ? 'rgba(53,79,54,0.08)' : 'rgba(255,255,255,0.75)',
                    border: selected ? `1.5px solid ${T.inkLt}` : '1px solid rgba(0,0,0,0.06)',
                    transition: 'all 0.12s ease',
                  }}>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: T.fontBody, fontSize: 15, fontWeight: selected ? 700 : 400, color: T.ink,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.alimento}
                      </div>
                      <div style={{ fontFamily: T.fontBody, fontSize: 12, color: T.textMut, marginTop: 2 }}>
                        {Math.round(item.kcal)} kcal · {item.descricao_unidade}
                        {item.proteina > 0 && (
                          <span style={{ color: NUT.prot }}> · {Math.round(item.proteina)}g prot</span>
                        )}
                      </div>
                    </div>

                    {/* Controle de quantidade */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => setQty(item.id, -1)} style={{
                        width: 36, height: 36, borderRadius: 8,
                        border: '1px solid rgba(0,0,0,0.14)',
                        background: selected ? T.ink : 'rgba(255,255,255,0.9)',
                        color: selected ? '#fff' : T.textMut,
                        fontSize: 20, fontWeight: 300, cursor: selected ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>−</button>
                      <span style={{
                        fontFamily: T.fontBody, fontSize: 16, fontWeight: 700,
                        color: selected ? T.ink : T.textMut, width: 24, textAlign: 'center',
                      }}>{qty}</span>
                      <button onClick={() => setQty(item.id, +1)} style={{
                        width: 36, height: 36, borderRadius: 8, border: 'none',
                        background: T.ink, color: '#fff',
                        fontSize: 20, fontWeight: 300, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>+</button>
                    </div>
                  </div>
                );
              })}

              {/* Botão + Outro */}
              <button onClick={() => setModalNovo(true)} style={{
                width: '100%', padding: '14px 0', borderRadius: 12, marginTop: 4,
                border: `2px dashed ${T.inkLt}`, background: 'transparent',
                fontFamily: T.fontBody, fontSize: 14, fontWeight: 600,
                color: T.textSub, cursor: 'pointer',
              }}>
                + Outro alimento (adicionar à tabela)
              </button>
            </div>
          )}

          {/* Total selecionado — sticky na base */}
          <div style={{
            position: 'sticky', bottom: 70, zIndex: 10,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 16, border: `1px solid ${T.inkLt}`,
            padding: '14px 18px', marginBottom: 12,
            boxShadow: '0 4px 24px rgba(53,79,54,0.10)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontFamily: T.fontBody, fontSize: 12, fontWeight: 600, color: T.textSub }}>
                Total{itemsCount > 0 ? ` · ${itemsCount} item${itemsCount > 1 ? 's' : ''}` : ''}
              </span>
              <span style={{ fontFamily: T.fontHead, fontSize: 20, fontWeight: 800, color: T.ink, letterSpacing: '-0.03em' }}>
                {Math.round(totais.kcal)} <span style={{ fontSize: 11, fontWeight: 400, color: T.textMut }}>kcal</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 18, marginBottom: 14 }}>
              {[
                { label: 'Proteína',    val: totais.prot, color: NUT.protHero },
                { label: 'Carboidrato', val: totais.carb, color: NUT.carbHero },
                { label: 'Gordura',     val: totais.fat,  color: NUT.fatHero  },
              ].map(({ label, val, color }) => (
                <div key={label}>
                  <span style={{ fontFamily: T.fontBody, fontSize: 14, fontWeight: 700, color }}>{Math.round(val)}g</span>
                  <span style={{ fontFamily: T.fontBody, fontSize: 11, color: T.textMut, marginLeft: 3 }}>{label}</span>
                </div>
              ))}
            </div>
            <button onClick={salvar} disabled={salvando || itemsCount === 0} style={{
              width: '100%', padding: 16, border: 'none', borderRadius: 12,
              background: (salvando || itemsCount === 0) ? 'rgba(0,0,0,0.18)' : T.ink,
              color: '#fff', fontSize: 16, fontWeight: 700, fontFamily: T.fontBody,
              cursor: (salvando || itemsCount === 0) ? 'default' : 'pointer',
            }}>
              {statusMsg || (salvando ? 'Salvando…' : 'Salvar refeição')}
            </button>
          </div>
        </div>
      )}

      {/* Modal: novo alimento */}
      {modalNovo && (
        <ModalNovoAlimento
          onSave={handleNovoAlimento}
          onClose={novo => {
            setModalNovo(false);
            if (novo) {
              setTabela(prev => [...prev, novo].sort((a, b) => a.alimento.localeCompare(b.alimento)));
              setSelectedFoods(prev => ({ ...prev, [novo.id]: 1 }));
            }
          }}
        />
      )}
    </div>
  );
}
