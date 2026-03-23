import React from 'react';

const T = {
  fontBody: "'DM Sans', sans-serif"
};

export default function LoadingOverlay({ text = "Aguarde..." }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <style>{`
        @keyframes spinOverlay { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
      <div style={{
        width: 48, height: 48,
        border: '4px solid rgba(255,255,255,0.2)',
        borderTop: '4px solid #fff',
        borderRadius: '50%',
        animation: 'spinOverlay 1s linear infinite'
      }} />
      <div style={{
        marginTop: 24,
        fontFamily: T.fontBody,
        fontWeight: 700,
        color: '#fff',
        fontSize: 16
      }}>
        {text}
      </div>
    </div>
  );
}
