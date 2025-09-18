// Importa o framework Express
import express from 'express';

// Cria uma instância do aplicativo Express
const app = express();

// Define a porta em que o servidor vai escutar
const PORT = 3000;

// Middleware para permitir que o Express entenda JSON no corpo das requisições
app.use(express.json());

// Define uma rota principal (endpoint) para o método GET na raiz ("/")
app.get('/', (request, response) => {
  // Retorna uma resposta em formato JSON
  return response.json({ message: 'Olá, Mundo! Bem-vindo à nossa API com TS!' });
});

// Inicia o servidor e o faz escutar na porta definida
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}`);
});