import api from "./api";

type HourlyRecord = {
    DT_MEDICAO: string;
    HR_MEDICAO: string;
    TEM_MIN?: string | number | null;
    TEM_MAX?: string | number | null;
    UMD_MAX?: string | number | null;
    UMD_MIN?: string | number | null;
    UMD_MED?: string | number | null;
    CHUVA?: string | number | null;
    RAD_GLO?: string | number | null;
    VEN_VEL?: string | number | null;
    VEN_RAJ?: string | number | null;
    VEN_DIR?: string | null;
};

type DailyRecord = {
    DT_MEDICAO: string;
    TEMP_MAX?: string | number | null;
    TEMP_MIN?: string | number | null;
    TEMP_MED?: string | number | null;
    UMID_MIN?: string | number | null;
    UMID_MED?: string | number | null;
    CHUVA?: string | number | null;
    VEL_VENTO_MED?: string | number | null;
};

type DailyProcessed = {
    DT_MEDICAO: string;
    TEMP_MAX?: string | number | null;
    TEMP_MIN?: string | number | null;
    TEMP_MED?: string | number | null;
    UMD_MIN?: string | number | null;
    UMD_MED?: string | number | null;
    CHUVA?: string | number | null;
    VEN_VEL?: string | number | null;
    maiorUmidade: number | null;
    radiacaoSolar: number;
    rajadaDeVento: number | null;
    direcaoRajada: string | null;
};

export class ApiINMET {

    private readonly stationCode: string;
    private readonly token: string;

    constructor(stationCode: string = "A025", token: string = process.env.INMET_TOKEN ?? "") {
        this.stationCode = stationCode;
        this.token = token;
    }

    // ==================================================
    // MÉTODOS PRIVADOS PARA BUSCAR DADOS BRUTOS DA API
    // ==================================================

    private async getHourlyData(dateInicial: string, dateFinal: string){
        try {
            const { data } = await api.get(`/token/estacao/${dateInicial}/${dateFinal}/${this.stationCode}/${this.token}`);
            // Garante que sempre retorna um array, mesmo se a API retornar outra coisa
            return Array.isArray(data) ? (data as HourlyRecord[]) : [];
        } catch ( error ) {
            console.error(`Erro ao buscar dados horários de ${dateInicial} a ${dateFinal}:`, error);
            return []; // Retorna um array vazio em caso de erro
        }
    }

    private async getForDailyData(dateInicial: string, dateFinal:string) {
        try {
            const { data } = await api.get(`/token/estacao/diaria/${dateInicial}/${dateFinal}/${this.stationCode}/${this.token}`);
            return Array.isArray(data) ? (data as DailyRecord[]) : [];
        } catch ( error ) {
            console.error(`Erro ao buscar dados diários de ${dateInicial} a ${dateFinal}:`, error);
            return []; // Retorna um array vazio em caso de erro
        }
    }

    // =================================================================
    // FUNÇÃO PRINCIPAL PARA PROCESSAR DADOS DIÁRIOS (A VERSÃO CORRIGIDA E UNIFICADA)
    // =================================================================

    async dadosHorariosDoDia(dateInicial: string, dateFinal: string){
       function converterHoraUTCparaBRT(hrMedicao: string, data: string): string {
            const hora = parseInt(hrMedicao.substring(0, 2), 10);
            const minuto = parseInt(hrMedicao.substring(2, 4), 10);

            // cria objeto Date em UTC
            const dataUTC = new Date(`${data}T${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}:00Z`);

            // já retorna no fuso de Brasília
            return dataUTC.toLocaleTimeString('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }

        const dataHorario = await this.getHourlyData(dateInicial, dateFinal);

        const filtrados = dataHorario.map((item: HourlyRecord) => ({
            DT_MEDICAO: item.DT_MEDICAO,
            HR_MEDICAO: converterHoraUTCparaBRT(item.HR_MEDICAO, item.DT_MEDICAO),
            TEM_MIN: item.TEM_MIN,
            TEM_MAX: item.TEM_MAX,
            UMD_MAX: item.UMD_MAX,
            UMD_MIN: item.UMD_MIN,
            UMD_MED: item.UMD_MED,
            CHUVA: item.CHUVA,
            RAD_GLO: (Number(item.RAD_GLO ?? 0) / 1000),
            VEN_VEL: item.VEN_VEL,
            VEN_RAJ: item.VEN_RAJ,
            VEN_DIR: item.VEN_DIR ?? null,
            
        }));

        return filtrados;
    }

    async filtrarDadosDiarios(dateInicial: string, dateFinal: string) {
        // Busca os dados brutos
        const dataDiario = await this.getForDailyData(dateInicial, dateFinal);
        const dataHorario = await this.getHourlyData(dateInicial, dateFinal);

        if (dataDiario.length === 0) {
            console.warn(`Aviso: Não foram encontrados dados DIÁRIOS para o período ${dateInicial} a ${dateFinal}`);
            return [];
        }

        const dadosProcessados = dataDiario.map((dailyRecord: DailyRecord): DailyProcessed => {
            const currentDate = dailyRecord.DT_MEDICAO;
    
            const hourlyDataForThisDay = dataHorario.filter(
                (hourlyRecord: HourlyRecord) => hourlyRecord.DT_MEDICAO === currentDate
            );
    
            if (hourlyDataForThisDay.length === 0) {
                return {
                    DT_MEDICAO: dailyRecord.DT_MEDICAO,
                    TEMP_MAX: dailyRecord.TEMP_MAX,
                    TEMP_MIN: dailyRecord.TEMP_MIN,
                    TEMP_MED: dailyRecord.TEMP_MED,
                    UMD_MIN: dailyRecord.UMID_MIN,
                    UMD_MED: dailyRecord.UMID_MED,
                    CHUVA: dailyRecord.CHUVA,
                    VEN_VEL: dailyRecord.VEL_VENTO_MED,
                    maiorUmidade: null,
                    radiacaoSolar: 0,
                    rajadaDeVento: null,
                    direcaoRajada: null
                };
            }
    
            // --- CÁLCULOS DIÁRIOS A PARTIR DOS DADOS HORÁRIOS ---
            const maiorUmidade = hourlyDataForThisDay
                .reduce((max, dado) => {
                    const umidadeStr = dado.UMD_MAX || dado.UMD_MED;
                    if (umidadeStr == null) return max;
                    const umidadeAtual = parseFloat(String(umidadeStr));
                    return umidadeAtual > max ? umidadeAtual : max;
                }, Number.NEGATIVE_INFINITY);
    
            const radiacaoSolar = hourlyDataForThisDay
                .reduce((sum, dado) => {
                    if (dado.RAD_GLO == null) return sum;
                    return sum + parseFloat(String(dado.RAD_GLO));
                }, 0) / 1000;
    
            const rajadaInfo = hourlyDataForThisDay.reduce(
                (acc, dado) => {
                    const valor = dado.VEN_RAJ == null ? Number.NEGATIVE_INFINITY : parseFloat(String(dado.VEN_RAJ));
                    if (valor > acc.valor) {
                        return { valor, direcao: dado.VEN_DIR ?? null };
                    }
                    return acc;
                },
                { valor: Number.NEGATIVE_INFINITY, direcao: null as string | null }
            );
    
            return {
                DT_MEDICAO: dailyRecord.DT_MEDICAO,
                TEMP_MAX: dailyRecord.TEMP_MAX,
                TEMP_MIN: dailyRecord.TEMP_MIN,
                TEMP_MED: dailyRecord.TEMP_MED,
                UMD_MIN: dailyRecord.UMID_MIN,
                UMD_MED: dailyRecord.UMID_MED,
                CHUVA: dailyRecord.CHUVA,
                VEN_VEL: dailyRecord.VEL_VENTO_MED,
                maiorUmidade: maiorUmidade === Number.NEGATIVE_INFINITY ? null : maiorUmidade,
                radiacaoSolar: radiacaoSolar,
                rajadaDeVento: rajadaInfo.valor === Number.NEGATIVE_INFINITY ? null : rajadaInfo.valor,
                direcaoRajada: rajadaInfo.direcao,
            };
        });
    
        return dadosProcessados;
    }

    // =================================================================
    // FUNÇÕES DE AGREGAÇÃO MENSAL E ANUAL
    // =================================================================

    calcularResumoMensal(dadosDiariosProcessados: DailyProcessed[]) {
        if (!dadosDiariosProcessados || dadosDiariosProcessados.length === 0) return null;

        const safeParseFloat = (value: string | number | null | undefined) => {
            if (value == null) return 0;
            const parsed = parseFloat(String(value));
            return isNaN(parsed) ? 0 : parsed;
        };

        const resumoInicial = { /* ... (O código desta função estava correto, mantido como antes) ... */ };
        // O restante do código da sua função calcularResumoMensal continua aqui...
        // ... (Vou omitir por ser longo, mas o seu código original estava correto)
        const estatisticasFinais = dadosDiariosProcessados.reduce((acc, dia) => {
            const tempMaxDia = safeParseFloat(dia.TEMP_MAX);
            const tempMinDia = safeParseFloat(dia.TEMP_MIN);
            const tempMedDia = safeParseFloat(dia.TEMP_MED);
            const umidadeMaxDia = safeParseFloat(dia.maiorUmidade);
            const umidadeMinDia = safeParseFloat(dia.UMD_MIN);
            const umidadeMedDia = safeParseFloat(dia.UMD_MED);
            const velVentoDia = safeParseFloat(dia.VEN_VEL);
            const rajadaDia = safeParseFloat(dia.rajadaDeVento);
            const precipitacaoDia = safeParseFloat(dia.CHUVA);
            const radiacaoDia = safeParseFloat(dia.radiacaoSolar);
            
            if (tempMaxDia > acc.tempMaxAbsoluta) acc.tempMaxAbsoluta = tempMaxDia;
            if (tempMinDia < acc.tempMinAbsoluta) acc.tempMinAbsoluta = tempMinDia;
            if (umidadeMaxDia > acc.umidadeMaxAbsoluta) acc.umidadeMaxAbsoluta = umidadeMaxDia;
            if (umidadeMinDia < acc.umidadeMinAbsoluta) acc.umidadeMinAbsoluta = umidadeMinDia;

            if (rajadaDia > acc.maiorRajadaObj.rajadaDeVento) {
                acc.maiorRajadaObj = { rajadaDeVento: rajadaDia, direcaoRajada: dia.direcaoRajada };
            }

            if (dia.TEMP_MAX != null) { acc.somaTempMax += tempMaxDia; acc.countTempMax++; }
            if (dia.TEMP_MED != null) { acc.somaTempMed += tempMedDia; acc.countTempMed++; }
            if (dia.UMD_MED != null) { acc.somaUmidadeMed += umidadeMedDia; acc.countUmidadeMed++; }
            if (dia.VEN_VEL != null) { acc.somaVelVento += velVentoDia; acc.countVelVento++; }
            
            acc.somaPrecipitacao += precipitacaoDia;
            acc.somaRadiacaoSolar += radiacaoDia;
            
            return acc;
        }, {
            tempMaxAbsoluta: Number.NEGATIVE_INFINITY, tempMinAbsoluta: Number.POSITIVE_INFINITY,
            umidadeMaxAbsoluta: Number.NEGATIVE_INFINITY, umidadeMinAbsoluta: Number.POSITIVE_INFINITY,
            maiorRajadaObj: { rajadaDeVento: Number.NEGATIVE_INFINITY, direcaoRajada: null },
            somaTempMax: 0, somaTempMed: 0, somaUmidadeMed: 0, somaPrecipitacao: 0,
            somaRadiacaoSolar: 0, somaVelVento: 0, countTempMax: 0, countTempMed: 0,
            countUmidadeMed: 0, countVelVento: 0,
        } as {
            tempMaxAbsoluta: number; tempMinAbsoluta: number;
            umidadeMaxAbsoluta: number; umidadeMinAbsoluta: number;
            maiorRajadaObj: { rajadaDeVento: number; direcaoRajada: string | null };
            somaTempMax: number; somaTempMed: number; somaUmidadeMed: number; somaPrecipitacao: number;
            somaRadiacaoSolar: number; somaVelVento: number; countTempMax: number; countTempMed: number;
            countUmidadeMed: number; countVelVento: number;
        });

        return {
            temperaturaMaximaMes: estatisticasFinais.tempMaxAbsoluta,
            mediaTemperaturasMaximas: estatisticasFinais.somaTempMax / (estatisticasFinais.countTempMax || 1),
            temperaturaMinimaMes: estatisticasFinais.tempMinAbsoluta,
            temperaturaMediaMes: estatisticasFinais.somaTempMed / (estatisticasFinais.countTempMed || 1),
            umidadeMaximaMes: estatisticasFinais.umidadeMaxAbsoluta === Number.NEGATIVE_INFINITY ? null : estatisticasFinais.umidadeMaxAbsoluta,
            umidadeMinimaMes: estatisticasFinais.umidadeMinAbsoluta === Number.POSITIVE_INFINITY ? null : estatisticasFinais.umidadeMinAbsoluta,
            umidadeMediaMes: estatisticasFinais.somaUmidadeMed / (estatisticasFinais.countUmidadeMed || 1),
            precipitacaoTotalMes: estatisticasFinais.somaPrecipitacao,
            radiacaoSolarTotalMes: estatisticasFinais.somaRadiacaoSolar,
            ventoMediaMes: estatisticasFinais.somaVelVento / (estatisticasFinais.countVelVento || 1),
            maiorRajadaVentoMes: estatisticasFinais.maiorRajadaObj.rajadaDeVento === Number.NEGATIVE_INFINITY ? null : estatisticasFinais.maiorRajadaObj.rajadaDeVento,
            direcaoMaiorRajada: estatisticasFinais.maiorRajadaObj.direcaoRajada,
        };
    }

    async buscarResumosMensaisDoAno(year: number) {
        const resumosMensais = [];
        for (let month = 1; month <= 12; month++) {
            const monthStr = String(month).padStart(2, '0');
            const dateInicial = `${year}-${monthStr}-01`;
            const ultimoDia = new Date(year, month, 0).getDate();
            const dateFinal = `${year}-${monthStr}-${ultimoDia}`;

            console.log(`Buscando e processando dados para ${dateInicial} a ${dateFinal}...`);

            // CHAMADA CORRIGIDA: Agora chama a função correta
            const dadosDiariosDoMes = await this.filtrarDadosDiarios(dateInicial, dateFinal);

            // CHAMADA CORRIGIDA: Passa o array diretamente
            const resumoDoMes = this.calcularResumoMensal(dadosDiariosDoMes);

            resumosMensais.push({ mes: month, ...(resumoDoMes ?? {}) })
        }
        return resumosMensais;
    }

    async buscarDadosDiariosDoMes(year: number, month: number) {
        const monthStr = String(month).padStart(2, '0');
        const dateInicial = `${year}-${monthStr}-01`;
        const ultimoDia = new Date(year, month, 0).getDate();
        const dateFinal = `${year}-${monthStr}-${ultimoDia}`;

        console.log(`Buscando dados diários para ${dateInicial} a ${dateFinal}...`);

        // Busca os dados diários processados do mês
        const dadosDiariosDoMes = await this.filtrarDadosDiarios(dateInicial, dateFinal);

        // Retorna os dados diários com informações adicionais do mês
        return {
            ano: year,
            mes: month,
            periodo: {
                dataInicial: dateInicial,
                dataFinal: dateFinal,
                totalDias: ultimoDia
            },
            dadosDiarios: dadosDiariosDoMes,
            totalRegistros: dadosDiariosDoMes.length
        };
    }
    
    agregarParaResumoAnual(resumosMensais: any[]) {
        // O seu código original para esta função estava correto, pode mantê-lo.
        // ... (Vou omitir por ser longo)
        if (!resumosMensais || resumosMensais.length === 0) return null;

        const resumoInicial = {
            tempMaxAbsoluta: Number.NEGATIVE_INFINITY, tempMinAbsoluta: Number.POSITIVE_INFINITY,
            precipitacaoTotal: 0, radiacaoTotal: 0, maiorRajadaObj: { valor: Number.NEGATIVE_INFINITY, direcao: null },
            somaMediaTempMax: 0, somaMediaTemp: 0, somaMediaVento: 0, countMeses: 0,
        };

        const estatisticasAnuais = resumosMensais.reduce((acc, mes) => {
            if (!mes) return acc;
            acc.tempMaxAbsoluta = Math.max(acc.tempMaxAbsoluta, mes.temperaturaMaximaMes);
            acc.tempMinAbsoluta = Math.min(acc.tempMinAbsoluta, mes.temperaturaMinimaMes);
            if (mes.maiorRajadaVentoMes > acc.maiorRajadaObj.valor) {
                acc.maiorRajadaObj.valor = mes.maiorRajadaVentoMes;
                acc.maiorRajadaObj.direcao = mes.direcaoMaiorRajada;
            }
            acc.precipitacaoTotal += mes.precipitacaoTotalMes;
            acc.radiacaoTotal += mes.radiacaoSolarTotalMes;
            acc.somaMediaTempMax += mes.mediaTemperaturasMaximas;
            acc.somaMediaTemp += mes.temperaturaMediaMes;
            acc.somaMediaVento += mes.ventoMediaMes;
            acc.countMeses++;
            return acc;
        }, resumoInicial);

        const numMeses = estatisticasAnuais.countMeses || 1;
        return {
            temperaturaMaximaAno: estatisticasAnuais.tempMaxAbsoluta,
            temperaturaMinimaAno: estatisticasAnuais.tempMinAbsoluta,
            precipitacaoTotalAno: estatisticasAnuais.precipitacaoTotal,
            radiacaoSolarTotalAno: estatisticasAnuais.radiacaoTotal,
            maiorRajadaVentoAno: estatisticasAnuais.maiorRajadaObj.valor,
            direcaoMaiorRajadaAno: estatisticasAnuais.maiorRajadaObj.direcao,
            mediaAnualDasTempMaximas: estatisticasAnuais.somaMediaTempMax / numMeses,
            temperaturaMediaAnual: estatisticasAnuais.somaMediaTemp / numMeses,
            ventoMediaAnual: estatisticasAnuais.somaMediaVento / numMeses,
            mesesComDados: estatisticasAnuais.countMeses,
        };
    }
}