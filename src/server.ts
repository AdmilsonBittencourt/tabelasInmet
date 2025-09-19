// Importa o framework Express
import express from 'express';
import { ApiINMET } from './servers/ApiINMET';

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

const datahorario = new ApiINMET()

app.get('/teste', async (request, response) => {
    const data = await datahorario.filtrarDadosHorarios('2025-09-17', '2025-09-17');
    return response.status(200).json(data);
})

app.get('/diario', async (request, response) => {
    const data = await datahorario.filtrarDadosDiarios('2025-09-02', '2025-09-02');
    return response.status(200).json(data);
})

app.get('/mensal', async (request, response) => {
    const data = await datahorario.filtrarDadosDiariosDoMes('2025-09-01', '2025-09-30');
    return response.status(200).json(data);
})

// Inicia o servidor e o faz escutar na porta definida
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}`);
});