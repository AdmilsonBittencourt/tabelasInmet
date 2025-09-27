// Importa o framework Express e a nossa classe de serviço
import express, { request, response } from 'express';
import { ApiINMET } from './servers/ApiINMET';

// Cria uma instância do aplicativo Express
const app = express();
const PORT = 3000;

// Middleware para permitir que o Express entenda JSON
app.use(express.json());

// Cria uma única instância da nossa classe de serviço para ser usada por todas as rotas
const dataAPI = new ApiINMET();

// =================================================================
// ROTAS PRINCIPAIS DA API
// =================================================================

// Rota principal para verificar se a API está online
app.get('/horario/:dataInicial/:dataFinal', async (request, response) => {
    const { dataInicial, dataFinal } = request.params;

    const data = await dataAPI.dadosHorariosDoDia(dataInicial, dataFinal);

  return response.status(200).json(data);
});

// Rota para buscar dados diários já processados para um período
app.get('/diario/:dataInicial/:dataFinal', async (request, response) => {
    const { dataInicial, dataFinal } = request.params;
    const data = await dataAPI.filtrarDadosDiarios(dataInicial, dataFinal);
    return response.status(200).json(data);
});

// Rota para buscar o resumo MENSAL de um período
app.get('/mensal/:dataInicial/:dataFinal', async (request, response) => {
    const { dataInicial, dataFinal } = request.params;
    
    // 1. Busca e processa os dados diários
    const dadosDiarios = await dataAPI.filtrarDadosDiarios(dataInicial, dataFinal);

    // 2. Passa o resultado para a função de resumo mensal
    const resumoMensal = dataAPI.calcularResumoMensal(dadosDiarios);

    if (resumoMensal) {
        return response.status(200).json(resumoMensal);
    } else {
        return response.status(404).json({ message: "Não foram encontrados dados para este período." });
    }
});


app.get('/anual/lista/:ano', async (request, response) => {
    try {
         const year = parseInt(request.params.ano);

        if (isNaN(year) || year < 1900 || year > 2100) {
             return response.status(400).json({ message: "Ano inválido." });
        }
        const resumosMensais = await dataAPI.buscarResumosMensaisDoAno(year);
        return response.status(200).json(resumosMensais);

    } catch (error) {
        console.error("Erro ao processar a lista de dados anuais:", error);
        return response.status(500).json({ message: "Ocorreu um erro interno no servidor." });
    }
})

// Rota para buscar o resumo ANUAL de um ano específico
app.get('/anual/:ano', async (request, response) => {
    try {
        const year = parseInt(request.params.ano);
        
        if (isNaN(year) || year < 1900 || year > 2100) {
            return response.status(400).json({ message: "Ano inválido." });
        }

        // 1. Busca os resumos de todos os meses do ano
        const resumosMensais = await dataAPI.buscarResumosMensaisDoAno(year);
        console.log("--- Resumos Mensais Coletados Antes da Agregação ---");
        console.log(JSON.stringify(resumosMensais, null, 2));
        console.log("--------------------------------------------------");

        // 2. Agrega os resumos mensais para o resumo anual
        const resumoAnual = dataAPI.agregarParaResumoAnual(resumosMensais);

        if (resumoAnual) {
            (resumoAnual as any).ano = year;
            return response.status(200).json(resumoAnual);
        } else {
            return response.status(404).json({ message: `Não foram encontrados dados para o ano ${year}.` });
        }

    } catch (error) {
       console.error("Erro ao processar dados anuais:", error);
        return response.status(500).json({ message: "Ocorreu um erro interno no servidor." });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}`);
});