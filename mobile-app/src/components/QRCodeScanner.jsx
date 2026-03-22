import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const T = {
  glass:       'rgba(255,255,255,0.55)',
  glassBorder: 'rgba(255,255,255,0.90)',
  blur:        'blur(28px) saturate(200%)',
  ink:         '#0a0a0a',
  textSub:     '#525252',
  fontBody:    "'DM Sans', sans-serif"
};

export default function QRCodeScanner({ onScanSuccess, onManualInput }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    let scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: {width: 250, height: 250} },
      /* verbose= */ false
    );

    const onScan = async (decodedText) => {
      scanner.pause(true);
      
      const lowerText = decodedText.toLowerCase();
      const isValid = ['sefaz', 'nfce', 'fazenda', 'qrcode'].some(keyword => lowerText.includes(keyword));
      
      if (!isValid) {
        setToast('QR Code inválido, tente novamente');
        setTimeout(() => {
          setToast('');
          scanner.resume();
        }, 3000);
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
        onScanSuccess(data);
      } catch (err) {
        setLoading(false);
        setToast('Erro na conexão com API');
        setTimeout(() => {
          setToast('');
          scanner.resume();
        }, 3000);
      }
    };

    scanner.render(onScan, (err) => {
      // ignore silent scanning errors
    });

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [onScanSuccess]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', padding: '20px', zIndex: 9999 }}>
      
      <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, textAlign: 'center', background: T.ink, color: '#fff', fontFamily: T.fontBody, fontWeight: 700 }}>
          Ler QR Code da NFC-e
        </div>
        
        <div style={{ flex: 1, position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fontBody, fontWeight: 600, color: T.ink }}>
              Consultando SEFAZ...
            </div>
          )}
          
          <div id="reader" style={{ width: '100%', height: '100%', border: 'none' }}></div>
        </div>

        {toast && (
          <div style={{ padding: 12, background: '#dc2626', color: '#fff', textAlign: 'center', fontFamily: T.fontBody, fontWeight: 600 }}>
            {toast}
          </div>
        )}

      </div>
      
      <button onClick={onManualInput} style={{ marginTop: 20, background: 'rgba(255,255,255,0.15)', backdropFilter: T.blur, color: '#fff', border: 'none', borderRadius: 14, padding: 18, fontFamily: T.fontBody, fontSize: 16, fontWeight: 700 }}>
        Digitar manualmente
      </button>
    </div>
  );
}
