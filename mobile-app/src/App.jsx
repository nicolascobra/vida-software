import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SelectUser from './pages/SelectUser';
import Home from './pages/Home';
import Alimentacao from './pages/Alimentacao';
import Financeiro from './pages/Financeiro';
import Exercicio from './pages/Exercicio';

function App() {
  const userId = localStorage.getItem('user_id');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={userId ? <Navigate to="/home" /> : <SelectUser />} />
        <Route path="/home" element={<Home />} />
        <Route path="/alimentacao" element={<Alimentacao />} />
        <Route path="/financeiro" element={<Financeiro />} />
        <Route path="/exercicio" element={<Exercicio />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
