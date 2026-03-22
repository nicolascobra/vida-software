import axios from 'axios'

// api.js é o "garçom" da aplicação.
// Toda vez que o frontend precisar buscar ou enviar dados pro backend,
// ele usa esse objeto para fazer a chamada no endereço certo.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

export default api
