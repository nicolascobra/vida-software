import { useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { registrarTransacao } from '../services/api';
import LoadingOverlay from './LoadingOverlay';

const T = {
  glass:       'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.90)',
  blur:        'blur(28px) saturate(200%)',
  ink:         '#0a0a0a',
  textSub:     '#525252',
  fontBody:    "'DM Sans', sans-serif",
  fontHead:    "'Syne', sans-serif"
};

const categories = ['alimentacao', 'transporte', 'lazer', 'saude', 'moradia', 'investimento', 'salario', 'outros'];

const formatarValor = (valor) => {
  const nums = valor.replace(/\D/g, '');
  const centavos = (parseInt(nums || '0') / 100).toFixed(2);
  return centavos.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export default function QRCodeScanner({ onClose, onSaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  
  const [step, setStep] = useState('scanner');
  
  const [reviewData, setReviewData] = useState({
    estabelecimento: '',
    valor_total: '0,00',
    data: new Date().toISOString().split('T')[0],
    categoria: '',
    observacoes: ''
  });

  const [debugData, setDebugData] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    
    try {
      const html5QrCode = new Html5Qrcode("hidden-qr-reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      
      try { html5QrCode.clear(); } catch(e) {}
      
      const lowerText = decodedText.toLowerCase();
      const isValid = ['sefaz', 'nfce', 'fazenda', 'qrcode'].some(k => lowerText.includes(k));
      
      if (!isValid) {
        showToast('QR Code inválido, tente novamente');
        setLoading(false);
        return;
      }

      const BASE_URL = import.meta.env.VITE_API_URL || "https://vida-software-backend.onrender.com";
      const response = await fetch(`${BASE_URL}/nota-fiscal/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrcode_url: decodedText })
      });
      
      const data = await response.json();
      console.log('RESPOSTA SEFAZ:', JSON.stringify(data, null, 2));
      
      setLoading(false);
      
      if (!data || data.erro) {
        showToast(data.erro);
        return;
      }
      
      setDebugData(data);
      
      setReviewData({
        estabelecimento: data.estabelecimento || '',
        valor_total: data.valor_total ? formatarValor((data.valor_total * 100).toFixed(0).toString()) : '0,00',
        data: data.data || new Date().toISOString().split('T')[0],
        categoria: '',
        observacoes: data.estabelecimento || ''
      });
      
      setStep('review');
      
    } catch (err) {
      setLoading(false);
      showToast('QR Code não encontrado na imagem. Tente outra foto.');
    }
  };

  const handleSave = async () => {
    if (!reviewData.categoria) {
      showToast('Selecione uma categoria');
      return;
    }
    
    const numericValue = parseFloat(reviewData.valor_total.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numericValue) || numericValue <= 0) {
      showToast('Valor inválido');
      return;
    }

    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      await registrarTransacao({
        user_id: userId,
        data: reviewData.data,
        tipo: 'saida',
        categoria: reviewData.categoria,
        valor: numericValue,
        tipo_pagamento: 'pix',
        descricao: reviewData.observacoes || null,
        custo_fixo: false
      });
      
      setLoading(false);
      onSaveSuccess();
    } catch (err) {
      setLoading(false);
      showToast('Erro ao salvar lançamento');
    }
  };

  const inputStyle = {
    width: '100%', minHeight: 48, padding: '14px 16px', background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, fontFamily: T.fontBody,
    fontSize: 16, color: '#fff', outline: 'none', marginBottom: 20,
  };
  const labelStyle = { display: 'block', fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: T.ink, display: 'flex', flexDirection: 'column', zIndex: 9999 }}>
      
      {loading && <LoadingOverlay text="Carregando..." />}

      {toast && (
        <div style={{ position: 'absolute', top: 80, left: '5%', width: '90%', padding: 16, background: '#dc2626', color: '#fff', textAlign: 'center', fontFamily: T.fontBody, fontWeight: 700, borderRadius: 14, zIndex: 10000, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      {step === 'scanner' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: T.blur, color: '#fff', border: 'none', borderRadius: 20, padding: '10px 18px', fontFamily: T.fontBody, fontSize: 15, fontWeight: 700 }}>
              Cancelar
            </button>
          </div>
          
          <h2 style={{ fontFamily: T.fontHead, fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 40, textAlign: 'center' }}>
            Adicionar Nota Fiscal
          </h2>

          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <button onClick={() => fileInputRef.current?.click()} style={{ background: '#fff', color: T.ink, border: 'none', borderRadius: 14, padding: '18px 24px', fontFamily: T.fontBody, fontSize: 18, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' }}>
            Selecionar foto da NFC-e
          </button>

          {/* Fallback silencioso necessário como alvo para a biblioteca instanciar a classe */}
          <div id="hidden-qr-reader" style={{ display: 'none' }}></div>
        </div>
      )}

      {step === 'review' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
          <h2 style={{ fontFamily: T.fontHead, fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 24, marginTop: 10 }}>Revisar NFC-e</h2>

          {/* Debug Resposta */}
          <div style={{ marginBottom: 24 }}>
            <button onClick={() => setShowDebug(!showDebug)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 14px', fontFamily: T.fontBody, fontSize: 14, width: '100%', textAlign: 'left', fontWeight: 600 }}>
              {showDebug ? 'Esconder resposta da API (debug)' : 'Ver resposta da API (debug)'}
            </button>
            {showDebug && debugData && (
              <pre style={{ background: 'rgba(0,0,0,0.6)', padding: 14, borderRadius: 8, marginTop: 8, color: '#10b981', fontSize: 12, overflowX: 'auto', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(debugData, null, 2)}
              </pre>
            )}
          </div>

          <label style={labelStyle}>Estabelecimento</label>
          <input type="text" value={reviewData.estabelecimento} onChange={e => setReviewData({...reviewData, estabelecimento: e.target.value})} style={inputStyle} />
          
          <label style={labelStyle}>Valor Total</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ position: 'absolute', left: 16, top: 18, fontFamily: T.fontBody, fontSize: 22, color: '#fff', fontWeight: 700 }}>R$</span>
            <input type="text" inputMode="numeric" value={reviewData.valor_total} onChange={e => setReviewData({...reviewData, valor_total: formatarValor(e.target.value)})} style={{...inputStyle, paddingLeft: 56, fontSize: 28, fontWeight: 700, height: 64, marginBottom: 0}} required />
          </div>

          <label style={labelStyle}>Data da Compra</label>
          <input type="date" value={reviewData.data} onChange={e => setReviewData({...reviewData, data: e.target.value})} style={inputStyle} required />

          <label style={labelStyle}>Categoria</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {categories.map(cat => (
              <div key={cat} onClick={() => setReviewData({...reviewData, categoria: cat})} style={{ padding: '12px 18px', borderRadius: 20, background: reviewData.categoria === cat ? '#fff' : 'rgba(255,255,255,0.1)', color: reviewData.categoria === cat ? T.ink : '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: T.fontBody, textTransform: 'capitalize' }}>
                {cat}
              </div>
            ))}
          </div>

          <label style={labelStyle}>Observações</label>
          <input type="text" value={reviewData.observacoes} onChange={e => setReviewData({...reviewData, observacoes: e.target.value})} style={inputStyle} />

          <div style={{ marginTop: 'auto', paddingTop: 30, paddingBottom: 20 }}>
            <button onClick={handleSave} style={{ width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 14, padding: 18, fontFamily: T.fontBody, fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
              Confirmar e Salvar
            </button>
            <button onClick={onClose} style={{ width: '100%', background: 'transparent', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 14, padding: 18, fontFamily: T.fontBody, fontSize: 16, fontWeight: 700 }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
