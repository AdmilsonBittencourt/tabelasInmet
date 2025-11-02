import 'reflect-metadata';
import { DatabaseService } from '../services/DatabaseService';
import { ApiINMET } from '../servers/ApiINMET';

/**
 * Script para popular o banco de dados via linha de comando
 * 
 * Uso:
 * ts-node src/scripts/populate.ts periodo 2024-01-01 2024-01-31
 * ts-node src/scripts/populate.ts mes 2024 1
 * ts-node src/scripts/populate.ts ano 2024
 */

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const apiINMET = new ApiINMET();
    const dbService = new DatabaseService(apiINMET);

    try {
        await dbService.initialize();

        switch (command) {
            case 'periodo':
                if (args.length < 3) {
                    console.error('Uso: ts-node src/scripts/populate.ts periodo <dataInicial> <dataFinal> [stationCode]');
                    process.exit(1);
                }
                const dataInicial = args[1];
                const dataFinal = args[2];
                const stationCodePeriodo = args[3] || 'A025';
                await dbService.popularPeriodo(dataInicial, dataFinal, stationCodePeriodo);
                break;

            case 'mes':
                if (args.length < 3) {
                    console.error('Uso: ts-node src/scripts/populate.ts mes <ano> <mes> [stationCode]');
                    process.exit(1);
                }
                const year = parseInt(args[1]);
                const month = parseInt(args[2]);
                const stationCodeMes = args[3] || 'A025';
                if (isNaN(year) || isNaN(month)) {
                    console.error('Ano e mês devem ser números válidos');
                    process.exit(1);
                }
                await dbService.popularMes(year, month, stationCodeMes);
                break;

            case 'ano':
                if (args.length < 2) {
                    console.error('Uso: ts-node src/scripts/populate.ts ano <ano> [stationCode]');
                    process.exit(1);
                }
                const ano = parseInt(args[1]);
                const stationCodeAno = args[2] || 'A025';
                if (isNaN(ano)) {
                    console.error('Ano deve ser um número válido');
                    process.exit(1);
                }
                await dbService.popularAno(ano, stationCodeAno);
                break;

            default:
                console.log(`
Uso:
  ts-node src/scripts/populate.ts periodo <dataInicial> <dataFinal> [stationCode]
  ts-node src/scripts/populate.ts mes <ano> <mes> [stationCode]
  ts-node src/scripts/populate.ts ano <ano> [stationCode]

Exemplos:
  ts-node src/scripts/populate.ts periodo 2024-01-01 2024-01-31
  ts-node src/scripts/populate.ts mes 2024 1
  ts-node src/scripts/populate.ts ano 2024
                `);
                process.exit(1);
        }

        console.log('✅ Operação concluída com sucesso!');
        await dbService.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao executar script:', error);
        await dbService.close();
        process.exit(1);
    }
}

main();

