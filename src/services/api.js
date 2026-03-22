import axios from 'axios'

// api.js é o "garçom" da aplicação.
// Toda vez que o frontend precisar buscar ou enviar dados pro backend,
// ele usa esse objeto para fazer a chamada no endereço certo.
const api = axios.create({
  baseURL: 'http://localhost:8000',
})

export default api
