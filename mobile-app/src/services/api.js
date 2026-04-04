const BASE_URL = import.meta.env.VITE_API_URL || "https://vida-software-backend.onrender.com";

const headers = { 'Content-Type': 'application/json' };

const post = (path, body) =>
  fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) })
    .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); });

const get = (path) =>
  fetch(`${BASE_URL}${path}`, { headers })
    .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); });

// ── Alimentação — novo fluxo ──────────────────────────────────

export const buscarTabelaNutricional = () =>
  get('/alimentacao/tabela-nutricional');

export const criarAlimentoNutricional = (payload) =>
  post('/alimentacao/tabela-nutricional', payload);

export const registrarRefeicaoCompleta = (payload) =>
  post('/alimentacao/refeicao-completa', payload);

// ── Alimentação — legado (compat) ─────────────────────────────

export const criarRefeicao = (user_id, data) =>
  post('/alimentacao/refeicao', { user_id, data });

export const adicionarItem = (refeicao_diaria_id, tipo_refeicao, item) =>
  post('/alimentacao/item', { refeicao_diaria_id, tipo_refeicao, ...item });

export const registrarTransacao = async (payload) => {
  const res = await fetch(`${BASE_URL}/financas/transacao`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erro ao registrar transação');
  return res.json();
};

export const registrarTreino = async (payload) => {
  const res = await fetch(`${BASE_URL}/exercicio/treino`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erro ao registrar treino');
  return res.json();
};

// TODO: analisarFoto(imagemBase64) → integração futura com Vision AI
// TODO: escanearNotaFiscal(qrCode) → integração futura com SEFAZ API
