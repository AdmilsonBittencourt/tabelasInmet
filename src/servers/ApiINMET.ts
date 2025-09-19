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
            }
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


}

