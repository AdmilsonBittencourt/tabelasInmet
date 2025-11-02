// Importa o framework Express e a nossa classe de serviço
import 'reflect-metadata'; // Necessário para TypeORM decorators
import express from 'express';
import { ApiINMET } from './servers/ApiINMET';
import { DatabaseService } from './services/DatabaseService';
import { AppDataSource } from './database/data-source';
import populateRoutes from './routes/populate';

// Cria uma instância do aplicativo Express
const app = express();
const PORT = Number(process.env.PORT ?? 3000);

// Middleware para permitir que o Express entenda JSON
app.use(express.json());

// Cria uma única instância da nossa classe de serviço para ser usada por todas as rotas
const dataAPI = new ApiINMET();
const dbService = new DatabaseService(dataAPI);

// =================================================================
// ROTAS PRINCIPAIS DA API
// =================================================================

// Rotas de população do banco
app.use('/populate', populateRoutes);

// Rota buscar dados horários do dia
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

// Rota para buscar dados de um dia específico
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

// Rota para buscar dados diários completos de um mês específico
app.get('/mensal/dados/:ano/:mes', async (request, response) => {
    try {
        const year = parseInt(request.params.ano);
        const month = parseInt(request.params.mes);
        
        if (isNaN(year) || year < 1900 || year > 2100) {
            return response.status(400).json({ message: 'Ano inválido.' });
        }
        
        if (isNaN(month) || month < 1 || month > 12) {
            return response.status(400).json({ message: 'Mês inválido. Deve ser entre 1 e 12.' });
        }
        
        const dadosDiariosDoMes = await dataAPI.buscarDadosDiariosDoMes(year, month);
        
        if (dadosDiariosDoMes.totalRegistros === 0) {
            return response.status(404).json({ 
                message: `Não foram encontrados dados para ${month}/${year}.` 
            });
        }
        
        return response.status(200).json(dadosDiariosDoMes);
    } catch (error) {
        console.error('Erro ao processar dados diários do mês:', error);
        return response.status(500).json({ message: 'Ocorreu um erro interno no servidor.' });
    }
})

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

// Rota para buscar dados mensais de um ano específico
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

// Inicializa o banco de dados e inicia o servidor
async function startServer() {
    try {
        // Inicializa a conexão com o banco de dados
        await dbService.initialize();
        
        // Inicia o servidor
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Erro ao inicializar o servidor:', error);
        process.exit(1);
    }
}

startServer();

// Tratamento de encerramento gracioso
process.on('SIGINT', async () => {
    console.log('\n🛑 Encerrando servidor...');
    await dbService.close();
    process.exit(0);
});