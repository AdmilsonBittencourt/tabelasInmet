import api from "./api";

export class ApiINMET {

    private readonly stationCode: string;
    private readonly token: string;

    constructor(stationCode: string = "A025", token: string = process.env.INMET_TOKEN ?? "") {
        this.stationCode = stationCode;
        this.token = token;
    }

    // Busca dados horarios de hora em hora 
    async getHourlyData(dateInicial: string, dateFinal: string){
        
        try {
            const { data } = await api.get(`/token/estacao/${dateInicial}/${dateFinal}/${this.stationCode}/${this.token}`);
            return data;
        } catch ( error ) {
            console.error('Erro ao buscar dados horários de uma estação:', error);
        }
    }

    // Buscar dados diarios 
    async getForDailyData(dateInicial: string, dateFinal: string) {
        try {
            const { data } = await api.get(`/token/estacao/diaria/${dateInicial}/${dateFinal}/${this.stationCode}/${this.token}`);
            return data;
        } catch ( error ) {
            console.error('Erro ao buscar dados diários de uma estação:', error);
        }
    }


    async filtrarDadosHorarios(dateInicial: string, dateFinal: string){
        const data = await this.getHourlyData(dateInicial, dateFinal)

        const filter = data.map((hourlyRecord: { HR_MEDICAO: any; TEM_MIN: any; TEM_MAX: any; UMD_MIN: any; UMD_MAX: any; CHUVA: any; RAD_GLO: any; VEN_VEL: any; VEN_RAJ: any; VEN_DIR: any; }) => {
            return {
                HR_MEDICAO: hourlyRecord.HR_MEDICAO,
                TEM_MIN: hourlyRecord.TEM_MIN,
                TEM_MAX: hourlyRecord.TEM_MAX,
                UMD_MIN: hourlyRecord.UMD_MIN,
                UMD_MAX: hourlyRecord.UMD_MAX,
                CHUVA: hourlyRecord.CHUVA,
                RAD_GLO: hourlyRecord.RAD_GLO,
                VEN_VEL: hourlyRecord.VEN_VEL,
                VEN_RAJ: hourlyRecord.VEN_RAJ,
                VEN_DIR: hourlyRecord.VEN_DIR,
            }
        })

        return filter;
    }



    async filtrarDadosDiarios(dateInicial: string, dateFinal: string) {
        const dataDiario = await this.getForDailyData(dateInicial, dateFinal);
        const dataHorario = await this.getHourlyData(dateInicial, dateFinal);

        // Maior umidade (só valor numérico)
        const maiorUmidade = dataHorario
            .filter((dado: { UMD_MAX: string | null }) => dado.UMD_MAX != null)
            .reduce((max: number, dadoAtual: { UMD_MAX: string }) => {
                const umidadeAtual = parseFloat(dadoAtual.UMD_MAX);
                return umidadeAtual > max ? umidadeAtual : max;
            }, Number.NEGATIVE_INFINITY);

        // Radiação solar acumulada em MJ/m²
        const radiacaoSolar =
            dataHorario
                .filter((dado: { RAD_GLO: string | null }) => dado.RAD_GLO != null)
                .reduce((sum: number, day: { RAD_GLO: string }) => sum + parseFloat(day.RAD_GLO || "0"), 0) *
            3600 /
            1_000_000;

        // Maior rajada de vento (só valor numérico)
        const rajadaDeVento = dataHorario
            .filter((dado: { VEN_RAJ: string | null }) => dado.VEN_RAJ != null)
            .reduce((max: number, dadoAtual: { VEN_RAJ: string }) => {
                const rajadaAtual = parseFloat(dadoAtual.VEN_RAJ);
                return rajadaAtual > max ? rajadaAtual : max;
            }, Number.NEGATIVE_INFINITY);

            // Maior rajada de vento (objeto inteiro)
        const DeVento = dataHorario
        .filter((dado: { VEN_RAJ: string | null }) => dado.VEN_RAJ != null)
        .reduce(
            (maiorAteAgora: { VEN_RAJ: string }, dadoAtual: { VEN_RAJ: string }) => {
                const rajadaMaior = parseFloat(maiorAteAgora.VEN_RAJ);
                const rajadaAtual = parseFloat(dadoAtual.VEN_RAJ);
                return rajadaAtual > rajadaMaior ? dadoAtual : maiorAteAgora;
            },
             { VEN_RAJ: "-9999", VEN_DIR: null } 
        );

        // Agora você consegue acessar o VEN_DIR diretamente:
        const direcaoRajada = DeVento.VEN_DIR;


        // Dados diários tratados
        const dadosDiarios = dataDiario.map(
            (dailyRecord: {
                DT_MEDICAO: string;
                TEMP_MAX: string;
                TEMP_MIN: string;
                TEMP_MED: string;
                UMID_MIN: string;
                UMID_MED: string;
                CHUVA: string;
                VEL_VENTO_MED: string;
            }) => {
                return {
                    DT_MEDICAO: dailyRecord.DT_MEDICAO,
                    TEMP_MAX: dailyRecord.TEMP_MAX,
                    TEMP_MIN: dailyRecord.TEMP_MIN,
                    TEMP_MED: dailyRecord.TEMP_MED,
                    UMD_MIN: dailyRecord.UMID_MIN,
                    UMD_MED: dailyRecord.UMID_MED,
                    CHUVA: dailyRecord.CHUVA,
                    VEN_VEL: dailyRecord.VEL_VENTO_MED,
                };
            }
        );

        // Objeto final consolidado
        const processedData = {
            dadosDiarios,
            maiorUmidade,   // número (ex: 51)
            radiacaoSolar,  // número (ex: 83.13)
            rajadaDeVento, 
            direcaoRajada, // número (ex: 7)
        };

        return processedData;
    }

    async filtrarDadosDiariosDoMes(dateInicial: string, dateFinal: string) {
    // 1. Busca os dados brutos uma única vez
    const dataDiario = await this.getForDailyData(dateInicial, dateFinal);
    const dataHorario = await this.getHourlyData(dateInicial, dateFinal);

    // Se não houver dados, retorna um array vazio para evitar erros
    if (!dataDiario || dataDiario.length === 0) {
        return [];
    }

    // 2. Itera sobre cada dia da lista 'dataDiario'
    const dadosProcessados = dataDiario.map((dailyRecord: any) => {
        const currentDate = dailyRecord.DT_MEDICAO;

        // 3. Filtra os dados horários APENAS para o dia atual
        const hourlyDataForThisDay = dataHorario.filter(
            (hourlyRecord: any) => hourlyRecord.DT_MEDICAO === currentDate
        );

         // <<< ADICIONE ESTAS LINHAS PARA DEPURAÇÃO >>>
    // Vamos verificar os dados de um dia específico, por exemplo, o primeiro dia de Janeiro
    if (currentDate === '2024-01-01') {
        console.log(`--- Depurando o dia ${currentDate} ---`);
        console.log('Dados horários encontrados para este dia:', JSON.stringify(hourlyDataForThisDay, null, 2));
    }
    // <<< FIM DA SEÇÃO DE DEPURAÇÃO >>>

        // Se não houver dados horários para este dia, definimos valores padrão
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
                radiacaoSolar: null,
                rajadaDeVento: null,
                direcaoRajada: null,
            };
        }

        // 4. Executa os mesmos cálculos, mas AGORA na lista filtrada do dia
        const maiorUmidade = hourlyDataForThisDay
            .filter((dado: { UMD_MAX: string | null }) => dado.UMD_MAX != null)
            .reduce((max: number, dadoAtual: { UMD_MAX: string }) => {
                const umidadeAtual = parseFloat(dadoAtual.UMD_MAX);
                return umidadeAtual > max ? umidadeAtual : max;
            }, Number.NEGATIVE_INFINITY);

// <<< ADICIONE MAIS UM LOG AQUI >>>
    if (currentDate === '2024-01-01') {
        console.log('Valor calculado para maiorUmidade:', maiorUmidade);
    }
    // <<< FIM DA SEÇÃO DE DEPURAÇÃO >>>


        const radiacaoSolar =
            hourlyDataForThisDay
                .filter((dado: { RAD_GLO: string | null }) => dado.RAD_GLO != null)
                .reduce((sum: number, day: { RAD_GLO: string }) => sum + parseFloat(day.RAD_GLO || "0"), 0) *
            3600 /
            1_000_000;

        // Para pegar o objeto inteiro com a maior rajada e sua direção
        const maiorRajadaObj = hourlyDataForThisDay
            .filter((dado: { VEN_RAJ: string | null }) => dado.VEN_RAJ != null)
            .reduce(
                (maiorAteAgora: any, dadoAtual: any) => {
                    const rajadaMaior = parseFloat(maiorAteAgora.VEN_RAJ);
                    const rajadaAtual = parseFloat(dadoAtual.VEN_RAJ);
                    return rajadaAtual > rajadaMaior ? dadoAtual : maiorAteAgora;
                }, 
                { VEN_RAJ: "-9999" } // Valor inicial para a primeira comparação
            );
        
        const rajadaDeVento = maiorRajadaObj.VEN_RAJ === "-9999" ? null : parseFloat(maiorRajadaObj.VEN_RAJ);
        const direcaoRajada = maiorRajadaObj.VEN_RAJ === "-9999" ? null : maiorRajadaObj.VEN_DIR;


        // 5. Retorna um novo objeto para este dia, agora com os dados calculados
        return {
            DT_MEDICAO: dailyRecord.DT_MEDICAO,
            TEMP_MAX: dailyRecord.TEMP_MAX,
            TEMP_MIN: dailyRecord.TEMP_MIN,
            TEMP_MED: dailyRecord.TEMP_MED,
            UMD_MIN: dailyRecord.UMID_MIN,
            UMD_MED: dailyRecord.UMID_MED,
            CHUVA: dailyRecord.CHUVA,
            VEN_VEL: dailyRecord.VEL_VENTO_MED,
            // Adicionando os novos campos calculados
            maiorUmidade: maiorUmidade === Number.NEGATIVE_INFINITY ? null : maiorUmidade,
            radiacaoSolar: radiacaoSolar,
            rajadaDeVento: rajadaDeVento,
            direcaoRajada: direcaoRajada,
        };
    });

    return dadosProcessados;
}

/**
 * Analisa uma lista de dados diários processados e calcula um resumo estatístico para o mês.
 * @param dadosDiariosProcessados - Array de objetos, onde cada objeto contém os dados de um dia.
 * @returns Um objeto com as estatísticas consolidadas do mês.
 */
async calcularResumoMensal(dadosDiariosProcessados: any[]) {
    // Se não houver dados, retorna null para evitar erros.
    if (!dadosDiariosProcessados || dadosDiariosProcessados.length === 0) {
        return null;
    }

    // Helper para converter strings para números de forma segura, tratando null e valores inválidos.
    const safeParseFloat = (value: string | null) => {
        if (value === null || value === undefined) return 0;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    };

    // Usamos .reduce para iterar sobre todos os dias e acumular os resultados em um único objeto.
    const resumoInicial = {
        tempMaxAbsoluta: Number.NEGATIVE_INFINITY,
        tempMinAbsoluta: Number.POSITIVE_INFINITY,
        umidadeMaxAbsoluta: Number.NEGATIVE_INFINITY,
        umidadeMinAbsoluta: Number.POSITIVE_INFINITY,
        maiorRajadaObj: { rajadaDeVento: Number.NEGATIVE_INFINITY, direcaoRajada: null },
        
        // Acumuladores para calcular médias
        somaTempMax: 0,
        somaTempMed: 0,
        somaUmidadeMed: 0,
        somaPrecipitacao: 0,
        somaRadiacaoSolar: 0,
        somaVelVento: 0,
        
        // Contadores de dias com dados válidos para médias precisas
        countTempMax: 0,
        countTempMed: 0,
        countUmidadeMed: 0,
        countVelVento: 0,
    };

    const estatisticasFinais = dadosDiariosProcessados.reduce((acc, dia) => {
        // Converte os valores do dia para números
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
        
        // 1. Encontrar os valores MÁXIMOS e MÍNIMOS absolutos
        if (tempMaxDia > acc.tempMaxAbsoluta) acc.tempMaxAbsoluta = tempMaxDia;
        if (tempMinDia < acc.tempMinAbsoluta) acc.tempMinAbsoluta = tempMinDia;
        if (umidadeMaxDia > acc.umidadeMaxAbsoluta) acc.umidadeMaxAbsoluta = umidadeMaxDia;
        if (umidadeMinDia < acc.umidadeMinAbsoluta) acc.umidadeMinAbsoluta = umidadeMinDia;

        // 2. Encontrar a maior rajada de vento e guardar o seu objeto (para pegar a direção)
        if (rajadaDia > acc.maiorRajadaObj.rajadaDeVento) {
            acc.maiorRajadaObj = { rajadaDeVento: rajadaDia, direcaoRajada: dia.direcaoRajada };
        }

        // 3. SOMAR os valores para depois calcular as médias
        if (dia.TEMP_MAX != null) { acc.somaTempMax += tempMaxDia; acc.countTempMax++; }
        if (dia.TEMP_MED != null) { acc.somaTempMed += tempMedDia; acc.countTempMed++; }
        if (dia.UMD_MED != null) { acc.somaUmidadeMed += umidadeMedDia; acc.countUmidadeMed++; }
        if (dia.VEN_VEL != null) { acc.somaVelVento += velVentoDia; acc.countVelVento++; }
        
        acc.somaPrecipitacao += precipitacaoDia;
        acc.somaRadiacaoSolar += radiacaoDia;
        
        return acc;
    }, resumoInicial);

    // 4. Montar o objeto final com os cálculos de média
    return {
        temperaturaMaximaMes: estatisticasFinais.tempMaxAbsoluta,
        mediaTemperaturasMaximas: estatisticasFinais.somaTempMax / (estatisticasFinais.countTempMax || 1),
        temperaturaMinimaMes: estatisticasFinais.tempMinAbsoluta,
        temperaturaMediaMes: estatisticasFinais.somaTempMed / (estatisticasFinais.countTempMed || 1),
        umidadeMaximaMes: estatisticasFinais.umidadeMaxAbsoluta,
        umidadeMinimaMes: estatisticasFinais.umidadeMinAbsoluta,
        umidadeMediaMes: estatisticasFinais.somaUmidadeMed / (estatisticasFinais.countUmidadeMed || 1),
        precipitacaoTotalMes: estatisticasFinais.somaPrecipitacao,
        radiacaoSolarTotalMes: estatisticasFinais.somaRadiacaoSolar,
        ventoMediaMes: estatisticasFinais.somaVelVento / (estatisticasFinais.countVelVento || 1),
        maiorRajadaVentoMes: estatisticasFinais.maiorRajadaObj.rajadaDeVento,
        direcaoMaiorRajada: estatisticasFinais.maiorRajadaObj.direcaoRajada,
    };
}

// NOTA: Coloque esta função dentro da sua classe de serviço ou onde as outras funções estão.
// Lembre-se que 'datahorario' é a instância da sua classe de serviço.


/**
 * Orquestra a busca de dados para cada mês de um ano específico e retorna uma lista de resumos mensais.
 * @param year - O ano para o qual os dados serão buscados.
 * @returns Uma Promise que resolve com um array de objetos, cada um sendo o resumo de um mês.
 */
async buscarResumosMensaisDoAno(year: number) {
    const resumosMensais = [];

    for (let month = 1; month <= 12; month++) {
        // ... (código para obter dateInicial e dateFinal) ...
        const dateInicial = `${year}-${String(month).padStart(2, '0')}-01`;
        const ultimoDia = new Date(year, month, 0).getDate();
        const dateFinal = `${year}-${String(month).padStart(2, '0')}-${ultimoDia}`;

        console.log(`Buscando dados para ${dateInicial} a ${dateFinal}...`);

        const dadosDiariosDoMes = await this.filtrarDadosDiarios(dateInicial, dateFinal);

        
        // CORREÇÃO AQUI: adicione 'await' se a função for async
        const resumoDoMes = await this.calcularResumoMensal(dadosDiariosDoMes.dadosDiarios);

        // Agora 'resumoDoMes' é o objeto real, não a promessa.
        if (resumoDoMes) {
            // Esta linha agora funciona corretamente.
            (resumoDoMes as any).mes = month; 
            resumosMensais.push(resumoDoMes);
        }
    }

    return resumosMensais;
}

/**
 * Analisa uma lista de resumos mensais e calcula um resumo estatístico para o ano inteiro.
 * @param resumosMensais - Array de objetos, onde cada objeto contém o resumo de um mês.
 * @returns Um objeto com as estatísticas consolidadas do ano.
 */
async agregarParaResumoAnual(resumosMensais: any[]) {
    if (!resumosMensais || resumosMensais.length === 0) {
        return null;
    }

    const resumoInicial = {
        tempMaxAbsoluta: Number.NEGATIVE_INFINITY,
        tempMinAbsoluta: Number.POSITIVE_INFINITY,
        precipitacaoTotal: 0,
        radiacaoTotal: 0,
        maiorRajadaObj: { valor: Number.NEGATIVE_INFINITY, direcao: null },
        
        // Acumuladores para as médias anuais
        somaMediaTempMax: 0,
        somaMediaTemp: 0,
        somaMediaVento: 0,
        
        countMeses: 0,
    };

    const estatisticasAnuais = resumosMensais.reduce((acc, mes) => {
        // Encontrar os valores MÁXIMOS e MÍNIMOS absolutos do ano
        acc.tempMaxAbsoluta = Math.max(acc.tempMaxAbsoluta, mes.temperaturaMaximaMes);
        acc.tempMinAbsoluta = Math.min(acc.tempMinAbsoluta, mes.temperaturaMinimaMes);

        // Encontrar a maior rajada de vento do ano
        if (mes.maiorRajadaVentoMes > acc.maiorRajadaObj.valor) {
            acc.maiorRajadaObj.valor = mes.maiorRajadaVentoMes;
            acc.maiorRajadaObj.direcao = mes.direcaoMaiorRajada;
        }

        // SOMAR os totais mensais para obter o total anual
        acc.precipitacaoTotal += mes.precipitacaoTotalMes;
        acc.radiacaoTotal += mes.radiacaoSolarTotalMes;

        // SOMAR as médias mensais para calcular a média anual
        acc.somaMediaTempMax += mes.mediaTemperaturasMaximas;
        acc.somaMediaTemp += mes.temperaturaMediaMes;
        acc.somaMediaVento += mes.ventoMediaMes;
        
        acc.countMeses++;
        
        return acc;
    }, resumoInicial);

    // Montar o objeto final com os cálculos de média anual
    const numMeses = estatisticasAnuais.countMeses || 1;
    return {
        ano: new Date().getFullYear(), // Ou o ano que foi passado como parâmetro
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

