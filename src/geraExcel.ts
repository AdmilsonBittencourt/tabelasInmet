// geraExcel.ts
import axios from "axios";
import ExcelJS from "exceljs";

async function gerarExcel() {
  // 🔹 Chamada da API de dados horários
  const { data: horarios } = await axios.get("http://localhost:3000/horario/2024-01-01/2024-01-01");

  // 🔹 Chamada da API de dados diários
  const { data: diarios } = await axios.get("http://localhost:3000/diario/2024-01-01/2024-01-30");

  // Cria um workbook (arquivo excel)
  const workbook = new ExcelJS.Workbook();

  // Aba de horários
  const sheetHorarios = workbook.addWorksheet("Horários");
  sheetHorarios.columns = Object.keys(horarios[0]).map(key => ({ header: key, key }));
  horarios.forEach((h: any) => sheetHorarios.addRow(h));

  // Aba de diários
  const sheetDiarios = workbook.addWorksheet("Diários");
  sheetDiarios.columns = Object.keys(diarios[0]).map(key => ({ header: key, key }));
  diarios.forEach((d: any) => sheetDiarios.addRow(d));

  // Salva o arquivo
  await workbook.xlsx.writeFile("dados_meteorologicos.xlsx");
  console.log("✅ Excel gerado: dados_meteorologicos.xlsx");
}

gerarExcel();
