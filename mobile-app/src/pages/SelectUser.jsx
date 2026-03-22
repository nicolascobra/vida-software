import { useNavigate } from 'react-router-dom';

export default function SelectUser() {
  const navigate = useNavigate();

  const handleSelect = (user) => {
    localStorage.setItem('user_id', user);
    navigate('/home');
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100vh', gap: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Quem é você?</h1>
      <button style={{ padding: '30px', fontSize: '24px' }} onClick={() => handleSelect('andre')}>André</button>
      <button style={{ padding: '30px', fontSize: '24px' }} onClick={() => handleSelect('nicolas')}>Nicolas</button>
    </div>
  );
}
