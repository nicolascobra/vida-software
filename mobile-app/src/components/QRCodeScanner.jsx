import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { registrarTransacao } from '../services/api';

const T = {
  glass:       'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.90)',
  blur:        'blur(28px) saturate(200%)',
  ink:         '#0a0a0a',
  textSub:     '#525252',
  fontBody:    "'DM Sans', sans-serif"
};

const categories = ['alimentacao', 'transporte', 'lazer', 'saude', 'moradia', 'investimento', 'salario'];

export default function QRCodeScanner({ onClose, onSaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  
  const [step, setStep] = useState('scanner');
  
  const [reviewData, setReviewData] = useState({
    estabelecimento: '',
    valor_total: '',
    data: new Date().toISOString().split('T')[0],
    categoria: '',
    observacoes: ''
  });

  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (step === 'scanner') {
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");
      
      const safelyResume = () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.getState() !== 1) { // 1 = NOT_STARTED
          try { html5QrCodeRef.current.resume(); } catch (e) {}
        }
      };

      const onScanSuccess = async (decodedText) => {
        try { html5QrCodeRef.current.pause(true); } catch(e) {}
        
        const lowerText = decodedText.toLowerCase();
        const isValid = ['sefaz', 'nfce', 'fazenda', 'qrcode'].some(k => lowerText.includes(k));
        
        if (!isValid) {
          setToast('QR Code inválido, tente novamente');
          setTimeout(() => { setToast(''); safelyResume(); }, 3000);
          return;
        }

        setLoading(true);
        try {
          const BASE_URL = import.meta.env.VITE_API_URL || "https://vida-software-backend.onrender.com";
          const response = await fetch(`${BASE_URL}/nota-fiscal/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qrcode_url: decodedText })
          });
          
          const data = await response.json();
          setLoading(false);
          
          if (data.erro === "nao_disponivel") {
            setToast('Não foi possível ler a nota. Tente novamente.');
            setTimeout(() => { setToast(''); safelyResume(); }, 3000);
            return;
          }
          
          try {
            await html5QrCodeRef.current.stop();
            html5QrCodeRef.current.clear();
          } catch(e) {}
          
          setReviewData({
            estabelecimento: data.estabelecimento || '',
            valor_total: data.valor_total ? data.valor_total.toString().replace('.', ',') : '',
            data: data.data || new Date().toISOString().split('T')[0],
            categoria: '',
            observacoes: data.estabelecimento || ''
          });
          setStep('review');
          
        } catch (err) {
          setLoading(false);
          setToast('Erro na conexão com API');
          setTimeout(() => { setToast(''); safelyResume(); }, 3000);
        }
      };

      const onScanFailure = (error) => {
        // Ignorar erros de rotina da leitura
      };

      html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        onScanFailure
      ).catch((err) => {
        setToast('Erro ao acessar a câmera. Verifique as permissões.');
      });

      return () => {
        if (html5QrCodeRef.current) {
          try {
            html5QrCodeRef.current.stop().then(() => {
              html5QrCodeRef.current.clear();
            }).catch(() => {
              html5QrCodeRef.current.clear();
            });
          } catch (e) {
            try { html5QrCodeRef.current.clear(); } catch(e2) {}
          }
        }
      };
    }
  }, [step]);

  const handleSave = async () => {
    if (!reviewData.categoria) {
      setToast('Selecione uma categoria');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    
    const numericValue = parseFloat(reviewData.valor_total.replace(',', '.'));
    if (isNaN(numericValue) || numericValue <= 0) {
      setToast('Valor inválido');
      setTimeout(() => setToast(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      await registrarTransacao({
        user_id: userId,
        data: reviewData.data,
        tipo: 'saida', // NFC-e é saída
        categoria: reviewData.categoria,
        valor: numericValue,
        descricao: reviewData.observacoes || null,
        custo_fixo: false
      });
      
      setLoading(false);
      onSaveSuccess();
    } catch (err) {
      setLoading(false);
      setToast('Erro ao salvar lançamento');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const inputStyle = {
    width: '100%', minHeight: 48, padding: '14px 16px', background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, fontFamily: T.fontBody,
    fontSize: 16, color: '#fff', outline: 'none', marginBottom: 20,
  };
  const labelStyle = { display: 'block', fontFamily: T.fontBody, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 };

  // Forçar o background preto no modal e estilos clean
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: T.ink, display: 'flex', flexDirection: 'column', zIndex: 9999 }}>
      
      {toast && (
        <div style={{ position: 'absolute', top: 80, left: '5%', width: '90%', padding: 14, background: '#dc2626', color: '#fff', textAlign: 'center', fontFamily: T.fontBody, fontWeight: 700, borderRadius: 14, zIndex: 10000, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      {step === 'scanner' && (
        <>
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end', position: 'absolute', top: 0, right: 0, zIndex: 10 }}>
            <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: T.blur, color: '#fff', border: 'none', borderRadius: 20, padding: '10px 18px', fontFamily: T.fontBody, fontSize: 15, fontWeight: 700 }}>
              ✕ Cancelar
            </button>
          </div>
          
          <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
            {loading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontBody, fontWeight: 700, color: '#fff', fontSize: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
                Consultando SEFAZ...
              </div>
            )}
            
            <div id="qr-reader" style={{ width: '100%', height: '100%', border: 'none' }}></div>
          </div>
        </>
      )}

      {step === 'review' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
          <h2 style={{ fontFamily: T.fontHead, fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 24, marginTop: 10 }}>Revisar NFC-e</h2>
          
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontBody, fontWeight: 600, color: '#fff', fontSize: 18 }}>
              Salvando...
            </div>
          )}

          <label style={labelStyle}>Estabelecimento</label>
          <input type="text" value={reviewData.estabelecimento} onChange={e => setReviewData({...reviewData, estabelecimento: e.target.value})} style={inputStyle} />
          
          <label style={labelStyle}>Valor Total</label>
          <input type="number" step="0.01" inputMode="decimal" value={reviewData.valor_total} onChange={e => setReviewData({...reviewData, valor_total: e.target.value})} style={{...inputStyle, fontSize: 28, fontWeight: 700, height: 64}} required />

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
            <button onClick={handleSave} style={{ width: '100%', background: '#fff', color: T.ink, border: 'none', borderRadius: 14, padding: 18, fontFamily: T.fontBody, fontSize: 16, fontWeight: 800, marginBottom: 12 }}>
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
