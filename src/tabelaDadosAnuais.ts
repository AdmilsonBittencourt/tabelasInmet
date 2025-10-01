import axios from "axios";
import ExcelJS from "exceljs";

async function tabelaDadosAnuais() {
  const { data: resumoAnual } = await axios.get("http://localhost:3000/anual/2024");
  console.log("🔎 Retorno da API:", resumoAnual);

  if (!resumoAnual || typeof resumoAnual !== "object") {
    console.error("⚠️ Nenhum dado válido retornado pela API");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const sheetAnuais = workbook.addWorksheet("Resumo Anual");

  // colunas: chaves do objeto
  sheetAnuais.columns = Object.keys(resumoAnual).map(key => ({
    header: key,
    key,
  }));

  // linha: o próprio objeto
  sheetAnuais.addRow(resumoAnual);

  await workbook.xlsx.writeFile("dados_anuais.xlsx");
  console.log("✅ Excel gerado: dados_anuais.xlsx");
}

tabelaDadosAnuais();
