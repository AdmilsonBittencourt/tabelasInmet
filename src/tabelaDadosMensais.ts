
import axios from "axios";
import ExcelJS from "exceljs";

async function tabelaDadosMensais() {
  // 🔹 Chamada da API de dados diários
  const { data: mensais } = await axios.get("http://localhost:3000/anual/lista/2024");

  // Cria um workbook (arquivo excel)
  const workbook = new ExcelJS.Workbook();

  // Aba de diários
  const sheetMensais = workbook.addWorksheet("mensal");
  sheetMensais.columns = Object.keys(mensais[0]).map(key => ({ header: key, key }));
  mensais.forEach((d: any) => sheetMensais.addRow(d));

  // Salva o arquivo
  await workbook.xlsx.writeFile("dados_mensais.xlsx");
  console.log("✅ Excel gerado: dados_mensais.xlsx");
}

tabelaDadosMensais();
