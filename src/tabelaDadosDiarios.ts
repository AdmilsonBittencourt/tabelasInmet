
import axios from "axios";
import ExcelJS from "exceljs";

async function tabelaDadosDiarios() {
  // 🔹 Chamada da API de dados diários
  const { data: diarios } = await axios.get("http://localhost:3000/diario/2024-01-01/2024-01-30");

  // Cria um workbook (arquivo excel)
  const workbook = new ExcelJS.Workbook();

  // Aba de diários
  const sheetDiarios = workbook.addWorksheet("Diários");
  sheetDiarios.columns = Object.keys(diarios[0]).map(key => ({ header: key, key }));
  diarios.forEach((d: any) => sheetDiarios.addRow(d));

  // Salva o arquivo
  await workbook.xlsx.writeFile("dados_diarios.xlsx");
  console.log("✅ Excel gerado: dados_diarios.xlsx");
}

tabelaDadosDiarios();
