import axios from "axios";
import ExcelJS from "exceljs";

async function tabelaDadosHorarios() {
  // 🔹 Chamada da API de dados horários
  const { data: horarios } = await axios.get("http://localhost:3000/horario/2024-01-01/2024-01-01");

  // Cria um workbook (arquivo excel)
  const workbook = new ExcelJS.Workbook();

  // Aba de horários
  const sheetHorarios = workbook.addWorksheet("Horários");
  sheetHorarios.columns = Object.keys(horarios[0]).map(key => ({ header: key, key }));
  horarios.forEach((h: any) => sheetHorarios.addRow(h));

  // Salva o arquivo
  await workbook.xlsx.writeFile("dados_horarios.xlsx");
  console.log("✅ Excel gerado: dados_horarios.xlsx");
}

tabelaDadosHorarios();
