// src/services/api.ts

import axios from 'axios';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

/**
 * Cria uma instância do Axios com a URL base e o token de autorização
 * pré-configurados a partir das variáveis de ambiente.
 */
const api = axios.create({
  baseURL: process.env.API_BASE_URL,
});

export default api;