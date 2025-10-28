// Importa o framework Express e a nossa classe de serviço
import express from 'express';
import { ApiINMET } from './servers/ApiINMET';

// Cria uma instância do aplicativo Express
const app = express();
const PORT = Number(process.env.PORT ?? 3000);

// Middleware para permitir que o Express entenda JSON
app.use(express.json());

// Cria uma única instância da nossa classe de serviço para ser usada por todas as rotas
const dataAPI = new ApiINMET();

// =================================================================
// ROTAS PRINCIPAIS DA API
// =================================================================

// Rota principal para verificar se a API está online
app.get('/horario/:dataInicial/:dataFinal', async (request, response) => {
    try {
        const { dataInicial, dataFinal } = request.params;
        const data = await dataAPI.dadosHorariosDoDia(dataInicial, dataFinal);
        return response.status(200).json(data);
    } catch (error) {
        console.error('Erro na rota /horario:', error);
        return response.status(500).json({ message: 'Erro interno' });
    }
});

// Rota para buscar dados diários já processados para um período
app.get('/diario/:dataInicial/:dataFinal', async (request, response) => {
    try {
        const { dataInicial, dataFinal } = request.params;
        const data = await dataAPI.filtrarDadosDiarios(dataInicial, dataFinal);
        return response.status(200).json(data);
    } catch (error) {
        console.error('Erro na rota /diario:', error);
        return response.status(500).json({ message: 'Erro interno' });
    }
});

// Rota para buscar o resumo MENSAL de um período
app.get('/mensal/:dataInicial/:dataFinal', async (request, response) => {
    try {
        const { dataInicial, dataFinal } = request.params;
        const dadosDiarios = await dataAPI.filtrarDadosDiarios(dataInicial, dataFinal);
        const resumoMensal = dataAPI.calcularResumoMensal(dadosDiarios);
        if (resumoMensal) {
            return response.status(200).json(resumoMensal);
        }
        return response.status(404).json({ message: 'Não foram encontrados dados para este período.' });
    } catch (error) {
        console.error('Erro na rota /mensal:', error);
        return response.status(500).json({ message: 'Erro interno' });
    }
});


app.get('/anual/lista/:ano', async (request, response) => {
    try {
        const year = parseInt(request.params.ano);
        if (isNaN(year) || year < 1900 || year > 2100) {
            return response.status(400).json({ message: 'Ano inválido.' });
        }
        const resumosMensais = await dataAPI.buscarResumosMensaisDoAno(year);
        return response.status(200).json(resumosMensais);
    } catch (error) {
        console.error('Erro ao processar a lista de dados anuais:', error);
        return response.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
    }
})

// Rota para buscar o resumo ANUAL de um ano específico
app.get('/anual/:ano', async (request, response) => {
    try {
        const year = parseInt(request.params.ano);
        if (isNaN(year) || year < 1900 || year > 2100) {
            return response.status(400).json({ message: 'Ano inválido.' });
        }
        const resumosMensais = await dataAPI.buscarResumosMensaisDoAno(year);
        const resumoAnual = dataAPI.agregarParaResumoAnual(resumosMensais);
        if (resumoAnual) {
            (resumoAnual as any).ano = year;
            return response.status(200).json(resumoAnual);
        }
        return response.status(404).json({ message: `Não foram encontrados dados para o ano ${year}.` });
    } catch (error) {
        console.error('Erro ao processar dados anuais:', error);
        return response.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}`);
});