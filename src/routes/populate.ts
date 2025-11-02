import { Router } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { ApiINMET } from '../servers/ApiINMET';

const router = Router();
const apiINMET = new ApiINMET();
const dbService = new DatabaseService(apiINMET);

// Inicializa o banco antes de usar as rotas
router.use(async (req, res, next) => {
    try {
        await dbService.initialize();
        next();
    } catch (error) {
        console.error('Erro ao inicializar banco:', error);
        return res.status(500).json({ message: 'Erro ao conectar ao banco de dados' });
    }
});

// Rota para popular um período específico
router.post('/periodo/:dataInicial/:dataFinal', async (request, response) => {
    try {
        const { dataInicial, dataFinal } = request.params;
        const stationCode = (request.query.stationCode as string) || 'A025';
        
        await dbService.popularPeriodo(dataInicial, dataFinal, stationCode);
        
        return response.status(200).json({ 
            message: `Período ${dataInicial} a ${dataFinal} populado com sucesso`,
            dataInicial,
            dataFinal,
            stationCode
        });
    } catch (error) {
        console.error('Erro na rota /populate/periodo:', error);
        return response.status(500).json({ message: 'Erro interno ao popular período' });
    }
});

// Rota para popular um mês específico
router.post('/mes/:ano/:mes', async (request, response) => {
    try {
        const year = parseInt(request.params.ano);
        const month = parseInt(request.params.mes);
        const stationCode = (request.query.stationCode as string) || 'A025';
        
        if (isNaN(year) || year < 1900 || year > 2100) {
            return response.status(400).json({ message: 'Ano inválido.' });
        }
        
        if (isNaN(month) || month < 1 || month > 12) {
            return response.status(400).json({ message: 'Mês inválido. Deve ser entre 1 e 12.' });
        }
        
        await dbService.popularMes(year, month, stationCode);
        
        return response.status(200).json({ 
            message: `Mês ${month}/${year} populado com sucesso`,
            ano: year,
            mes: month,
            stationCode
        });
    } catch (error) {
        console.error('Erro na rota /populate/mes:', error);
        return response.status(500).json({ message: 'Erro interno ao popular mês' });
    }
});

// Rota para popular um ano completo
router.post('/ano/:ano', async (request, response) => {
    try {
        const year = parseInt(request.params.ano);
        const stationCode = (request.query.stationCode as string) || 'A025';
        
        if (isNaN(year) || year < 1900 || year > 2100) {
            return response.status(400).json({ message: 'Ano inválido.' });
        }
        
        await dbService.popularAno(year, stationCode);
        
        return response.status(200).json({ 
            message: `Ano ${year} populado com sucesso`,
            ano: year,
            stationCode
        });
    } catch (error) {
        console.error('Erro na rota /populate/ano:', error);
        return response.status(500).json({ message: 'Erro interno ao popular ano' });
    }
});

export default router;

