// src/services/api.ts

import axios from 'axios';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Sanitiza e valida a baseURL
const rawBaseURL = process.env.API_BASE_URL?.trim();
if (!rawBaseURL) {
  console.warn('[INMET] Variável de ambiente API_BASE_URL ausente. Defina-a no .env');
}
const baseURL = rawBaseURL && rawBaseURL.endsWith('/') ? rawBaseURL.slice(0, -1) : rawBaseURL;

const api = axios.create({
  baseURL: baseURL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'api-inmet/1.0 (+https://github.com/seu-usuario)'
  }
});

// Interceptor simples para logar erros de rede sem verbosidade excessiva
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('[INMET] Timeout ao chamar a API:', error.config?.url);
    } else if (error.response) {
      console.error(`[INMET] Erro ${error.response.status} na API:`, error.config?.url);
    } else {
      console.error('[INMET] Erro de rede ao chamar a API:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;