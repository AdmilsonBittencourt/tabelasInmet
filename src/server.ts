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

const dataAPI = new ApiINMET()

app.get('/teste', async (request, response) => {
    const data = await dataAPI.filtrarDadosHorarios('2025-09-17', '2025-09-17');
    return response.status(200).json(data);
})

app.get('/diario', async (request, response) => {
    const data = await dataAPI.filtrarDadosDiarios('2025-09-02', '2025-09-02');
    return response.status(200).json(data);
})

app.get('/mensal', async (request, response) => {
    const data = await dataAPI.filtrarDadosDiariosDoMes('2024-12-01', '2024-12-30');
    return response.status(200).json(data);
})

app.get('/mensal/filtrada', async (request, response) => {
    // 1. Primeiro, busca e processa os dados diários como antes
    const dadosDiarios = await dataAPI.filtrarDadosDiariosDoMes('2025-09-01', '2025-09-30');

    // 2. Em seguida, passa esse resultado para a nova função de resumo mensal
    const resumoMensal = await dataAPI.calcularResumoMensal(dadosDiarios);

    if (resumoMensal) {
        return response.status(200).json(resumoMensal);
    } else {
        return response.status(404).json({ message: "Não foram encontrados dados para este período." });
    }
});

app.get('/anual/:ano', async (request, response) => {
    try {
        const year = parseInt(request.params.ano);
        
        // Validação simples do ano
        if (isNaN(year) || year < 1900 || year > 2100) {
            return response.status(400).json({ message: "Ano inválido." });
        }

        // 1. Busca os resumos de todos os meses do ano
        const resumosMensais = await dataAPI.buscarResumosMensaisDoAno(year);

           // <<< ADICIONE ESTAS LINHAS PARA DEPURAÇÃO >>>
        console.log("--- Resumos Mensais Coletados Antes da Agregação ---");
        // O JSON.stringify formata o output para ser mais fácil de ler
        console.log(JSON.stringify(resumosMensais, null, 2));
        console.log("--------------------------------------------------");

        // 2. Agrega os resumos mensais para o resumo anual
        const resumoAnual = dataAPI.agregarParaResumoAnual(resumosMensais);

        if (resumoAnual) {
            (resumoAnual as any).ano = year; // Garante que o ano correto está no resultado
            return response.status(200).json(resumoAnual);
        } else {
            return response.status(404).json({ message: `Não foram encontrados dados para o ano ${year}.` });
        }

    } catch (error) {
        console.error("Erro ao processar dados anuais:", error);
        return response.status(500).json({ message: "Ocorreu um erro interno no servidor." });
    }
});

// Inicia o servidor e o faz escutar na porta definida
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}`);
});