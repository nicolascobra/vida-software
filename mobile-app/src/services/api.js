const BASE_URL = import.meta.env.VITE_API_URL || "https://vida-software-backend.onrender.com";

const headers = {
  'Content-Type': 'application/json'
};

export const criarRefeicao = async (user_id, data) => {
  const res = await fetch(`${BASE_URL}/alimentacao/refeicao`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ user_id, data })
  });
  if (!res.ok) throw new Error('Erro ao criar refeição');
  return res.json();
};

export const adicionarItem = async (refeicao_diaria_id, tipo_refeicao, item) => {
  const res = await fetch(`${BASE_URL}/alimentacao/item`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      refeicao_diaria_id,
      tipo_refeicao,
      nome_alimento: item.nome_alimento,
      quantidade_g: item.quantidade_g,
      calorias: item.calorias,
      proteinas_g: item.proteinas_g,
      carboidratos_g: item.carboidratos_g,
      gorduras_g: item.gorduras_g
    })
  });
  if (!res.ok) throw new Error('Erro ao registrar item');
  return res.json();
};

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
