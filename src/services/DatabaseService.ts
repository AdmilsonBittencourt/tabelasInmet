import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { DadosHorarios } from '../entities/DadosHorarios';
import { DadosDiarios } from '../entities/DadosDiarios';
import { ResumoMensal } from '../entities/ResumoMensal';
import { ResumoAnual } from '../entities/ResumoAnual';
import { ApiINMET } from '../servers/ApiINMET';

export class DatabaseService {
    private dadosHorariosRepo: Repository<DadosHorarios>;
    private dadosDiariosRepo: Repository<DadosDiarios>;
    private resumoMensalRepo: Repository<ResumoMensal>;
    private resumoAnualRepo: Repository<ResumoAnual>;
    private apiINMET: ApiINMET;

    constructor(apiINMET: ApiINMET) {
        this.apiINMET = apiINMET;
        this.dadosHorariosRepo = AppDataSource.getRepository(DadosHorarios);
        this.dadosDiariosRepo = AppDataSource.getRepository(DadosDiarios);
        this.resumoMensalRepo = AppDataSource.getRepository(ResumoMensal);
        this.resumoAnualRepo = AppDataSource.getRepository(ResumoAnual);
    }

    // Inicializa a conexão com o banco
    async initialize() {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('✅ Conexão com o banco de dados estabelecida');
        }
    }

    // Salva dados horários
    async salvarDadosHorarios(dateInicial: string, dateFinal: string, stationCode: string = 'A025') {
        try {
            const dados = await this.apiINMET.dadosHorariosDoDia(dateInicial, dateFinal);
            
            if (dados.length === 0) {
                console.log(`Nenhum dado horário encontrado para ${dateInicial} a ${dateFinal}`);
                return [];
            }

            const dadosParaSalvar = dados.map(item => {
                const registro = new DadosHorarios();
                registro.DT_MEDICAO = item.DT_MEDICAO || dateInicial;
                registro.HR_MEDICAO = item.HR_MEDICAO;
                registro.TEM_MIN = item.TEM_MIN != null ? parseFloat(String(item.TEM_MIN)) : null;
                registro.TEM_MAX = item.TEM_MAX != null ? parseFloat(String(item.TEM_MAX)) : null;
                registro.UMD_MAX = item.UMD_MAX != null ? parseFloat(String(item.UMD_MAX)) : null;
                registro.UMD_MIN = item.UMD_MIN != null ? parseFloat(String(item.UMD_MIN)) : null;
                registro.CHUVA = item.CHUVA != null ? parseFloat(String(item.CHUVA)) : null;
                registro.RAD_GLO = item.RAD_GLO != null ? parseFloat(String(item.RAD_GLO)) : null;
                registro.VEN_VEL = item.VEN_VEL != null ? parseFloat(String(item.VEN_VEL)) : null;
                registro.VEN_RAJ = item.VEN_RAJ != null ? parseFloat(String(item.VEN_RAJ)) : null;
                registro.VEN_DIR = item.VEN_DIR ?? null;
                registro.stationCode = stationCode;
                return registro;
            });

            // Remove duplicatas baseado em DT_MEDICAO, HR_MEDICAO e stationCode
            const datasUnicasHorarios = [...new Set(dadosParaSalvar.map(d => d.DT_MEDICAO))];
            const registrosExistentes = await this.dadosHorariosRepo
                .createQueryBuilder('dados')
                .where('dados.stationCode = :stationCode', { stationCode })
                .andWhere('dados.DT_MEDICAO IN (:...datas)', { datas: datasUnicasHorarios })
                .getMany();

            const dadosNovos = dadosParaSalvar.filter(novo => {
                return !registrosExistentes.some(existente => 
                    existente.DT_MEDICAO === novo.DT_MEDICAO && 
                    existente.HR_MEDICAO === novo.HR_MEDICAO
                );
            });

            if (dadosNovos.length > 0) {
                const salvos = await this.dadosHorariosRepo.save(dadosNovos);
                console.log(`✅ ${salvos.length} registros horários salvos no banco`);
                return salvos;
            } else {
                console.log('ℹ️ Nenhum novo registro horário para salvar');
                return [];
            }
        } catch (error) {
            console.error('Erro ao salvar dados horários:', error);
            throw error;
        }
    }

    // Salva dados diários
    async salvarDadosDiarios(dateInicial: string, dateFinal: string, stationCode: string = 'A025') {
        try {
            const dados = await this.apiINMET.filtrarDadosDiarios(dateInicial, dateFinal);
            
            if (dados.length === 0) {
                console.log(`Nenhum dado diário encontrado para ${dateInicial} a ${dateFinal}`);
                return [];
            }

            const dadosParaSalvar = dados.map(item => {
                const registro = new DadosDiarios();
                registro.DT_MEDICAO = item.DT_MEDICAO;
                registro.TEMP_MAX = item.TEMP_MAX != null ? parseFloat(String(item.TEMP_MAX)) : null;
                registro.TEMP_MIN = item.TEMP_MIN != null ? parseFloat(String(item.TEMP_MIN)) : null;
                registro.TEMP_MED = item.TEMP_MED != null ? parseFloat(String(item.TEMP_MED)) : null;
                registro.UMD_MIN = item.UMD_MIN != null ? parseFloat(String(item.UMD_MIN)) : null;
                registro.UMD_MED = item.UMD_MED != null ? parseFloat(String(item.UMD_MED)) : null;
                registro.CHUVA = item.CHUVA != null ? parseFloat(String(item.CHUVA)) : null;
                registro.VEN_VEL = item.VEN_VEL != null ? parseFloat(String(item.VEN_VEL)) : null;
                registro.maiorUmidade = item.maiorUmidade;
                registro.radiacaoSolar = item.radiacaoSolar;
                registro.rajadaDeVento = item.rajadaDeVento;
                registro.direcaoRajada = item.direcaoRajada;
                registro.stationCode = stationCode;
                return registro;
            });

            // Remove duplicatas
            const datasUnicas = [...new Set(dadosParaSalvar.map(d => d.DT_MEDICAO))];
            const registrosExistentes = await this.dadosDiariosRepo
                .createQueryBuilder('dados')
                .where('dados.stationCode = :stationCode', { stationCode })
                .andWhere('dados.DT_MEDICAO IN (:...datas)', { datas: datasUnicas })
                .getMany();

            const dadosNovos = dadosParaSalvar.filter(novo => {
                return !registrosExistentes.some(existente => 
                    existente.DT_MEDICAO === novo.DT_MEDICAO
                );
            });

            if (dadosNovos.length > 0) {
                const salvos = await this.dadosDiariosRepo.save(dadosNovos);
                console.log(`✅ ${salvos.length} registros diários salvos no banco`);
                return salvos;
            } else {
                console.log('ℹ️ Nenhum novo registro diário para salvar');
                return [];
            }
        } catch (error) {
            console.error('Erro ao salvar dados diários:', error);
            throw error;
        }
    }

    // Salva resumo mensal
    async salvarResumoMensal(year: number, month: number, stationCode: string = 'A025') {
        try {
            const monthStr = String(month).padStart(2, '0');
            const dateInicial = `${year}-${monthStr}-01`;
            const ultimoDia = new Date(year, month, 0).getDate();
            const dateFinal = `${year}-${monthStr}-${ultimoDia}`;

            const dadosDiarios = await this.apiINMET.filtrarDadosDiarios(dateInicial, dateFinal);
            const resumo = this.apiINMET.calcularResumoMensal(dadosDiarios);

            if (!resumo) {
                console.log(`Nenhum resumo mensal gerado para ${month}/${year}`);
                return null;
            }

            // Verifica se já existe
            const existente = await this.resumoMensalRepo.findOne({
                where: { ano: year, mes: month, stationCode }
            });

            const registro = existente || new ResumoMensal();
            registro.ano = year;
            registro.mes = month;
            registro.temperaturaMaximaMes = resumo.temperaturaMaximaMes;
            registro.mediaTemperaturasMaximas = resumo.mediaTemperaturasMaximas;
            registro.temperaturaMinimaMes = resumo.temperaturaMinimaMes;
            registro.temperaturaMediaMes = resumo.temperaturaMediaMes;
            registro.umidadeMaximaMes = resumo.umidadeMaximaMes;
            registro.umidadeMinimaMes = resumo.umidadeMinimaMes;
            registro.umidadeMediaMes = resumo.umidadeMediaMes;
            registro.precipitacaoTotalMes = resumo.precipitacaoTotalMes;
            registro.radiacaoSolarTotalMes = resumo.radiacaoSolarTotalMes;
            registro.ventoMediaMes = resumo.ventoMediaMes;
            registro.maiorRajadaVentoMes = resumo.maiorRajadaVentoMes;
            registro.direcaoMaiorRajada = resumo.direcaoMaiorRajada;
            registro.stationCode = stationCode;

            const salvo = await this.resumoMensalRepo.save(registro);
            console.log(`✅ Resumo mensal de ${month}/${year} salvo no banco`);
            return salvo;
        } catch (error) {
            console.error(`Erro ao salvar resumo mensal para ${month}/${year}:`, error);
            throw error;
        }
    }

    // Salva resumo anual
    async salvarResumoAnual(year: number, stationCode: string = 'A025') {
        try {
            const resumosMensais = await this.apiINMET.buscarResumosMensaisDoAno(year);
            const resumoAnual = this.apiINMET.agregarParaResumoAnual(resumosMensais);

            if (!resumoAnual) {
                console.log(`Nenhum resumo anual gerado para ${year}`);
                return null;
            }

            // Verifica se já existe
            const existente = await this.resumoAnualRepo.findOne({
                where: { ano: year, stationCode }
            });

            const registro = existente || new ResumoAnual();
            registro.ano = year;
            registro.temperaturaMaximaAno = resumoAnual.temperaturaMaximaAno;
            registro.temperaturaMinimaAno = resumoAnual.temperaturaMinimaAno;
            registro.precipitacaoTotalAno = resumoAnual.precipitacaoTotalAno;
            registro.radiacaoSolarTotalAno = resumoAnual.radiacaoSolarTotalAno;
            registro.maiorRajadaVentoAno = resumoAnual.maiorRajadaVentoAno;
            registro.direcaoMaiorRajadaAno = resumoAnual.direcaoMaiorRajadaAno;
            registro.mediaAnualDasTempMaximas = resumoAnual.mediaAnualDasTempMaximas;
            registro.temperaturaMediaAnual = resumoAnual.temperaturaMediaAnual;
            registro.ventoMediaAnual = resumoAnual.ventoMediaAnual;
            registro.mesesComDados = resumoAnual.mesesComDados;
            registro.stationCode = stationCode;

            const salvo = await this.resumoAnualRepo.save(registro);
            console.log(`✅ Resumo anual de ${year} salvo no banco`);
            return salvo;
        } catch (error) {
            console.error(`Erro ao salvar resumo anual para ${year}:`, error);
            throw error;
        }
    }

    // Popula um período completo (dados diários e horários)
    async popularPeriodo(dateInicial: string, dateFinal: string, stationCode: string = 'A025') {
        try {
            console.log(`\n📊 Iniciando população do banco para ${dateInicial} a ${dateFinal}...`);
            
            await this.salvarDadosDiarios(dateInicial, dateFinal, stationCode);
            // await this.salvarDadosHorarios(dateInicial, dateFinal, stationCode);
            
            console.log(`✅ Período ${dateInicial} a ${dateFinal} populado com sucesso!\n`);
        } catch (error) {
            console.error('Erro ao popular período:', error);
            throw error;
        }
    }

    // Popula um mês completo (dados diários, horários e resumo mensal)
    async popularMes(year: number, month: number, stationCode: string = 'A025') {
        try {
            console.log(`\n📊 Iniciando população do banco para ${month}/${year}...`);
            
            const monthStr = String(month).padStart(2, '0');
            const dateInicial = `${year}-${monthStr}-01`;
            const ultimoDia = new Date(year, month, 0).getDate();
            const dateFinal = `${year}-${monthStr}-${ultimoDia}`;

            await this.salvarDadosDiarios(dateInicial, dateFinal, stationCode);
            await this.salvarDadosHorarios(dateInicial, dateFinal, stationCode);
            await this.salvarResumoMensal(year, month, stationCode);
            
            console.log(`✅ Mês ${month}/${year} populado com sucesso!\n`);
        } catch (error) {
            console.error(`Erro ao popular mês ${month}/${year}:`, error);
            throw error;
        }
    }

    // Popula um ano completo
    async popularAno(year: number, stationCode: string = 'A025') {
        try {
            console.log(`\n📊 Iniciando população do banco para o ano ${year}...`);
            
            for (let month = 1; month <= 12; month++) {
                await this.popularMes(year, month, stationCode);
                // Pequeno delay para não sobrecarregar a API
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            await this.salvarResumoAnual(year, stationCode);
            
            console.log(`✅ Ano ${year} populado com sucesso!\n`);
        } catch (error) {
            console.error(`Erro ao popular ano ${year}:`, error);
            throw error;
        }
    }

    // Fecha a conexão
    async close() {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
            console.log('🔌 Conexão com o banco de dados fechada');
        }
    }
}

