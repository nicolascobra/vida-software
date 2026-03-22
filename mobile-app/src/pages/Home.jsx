import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id') || 'Usuário';

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    navigate('/');
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Olá, {userId}</h1>
        <button onClick={handleLogout} style={{ width: 'auto', padding: '8px 16px', fontSize: '14px', backgroundColor: '#333' }}>Sair</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '40px' }}>
        <div className="card" onClick={() => navigate('/alimentacao')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '40px 20px', fontSize: '24px', fontWeight: 'bold' }}>
          🥗 Alimentação
        </div>
        <div className="card" onClick={() => navigate('/financeiro')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '40px 20px', fontSize: '24px', fontWeight: 'bold' }}>
          💰 Financeiro
        </div>
        <div className="card" onClick={() => navigate('/exercicio')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '40px 20px', fontSize: '24px', fontWeight: 'bold' }}>
          🏋️ Exercício
        </div>
      </div>
    </div>
  );
}
