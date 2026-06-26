import ExcelJS from "exceljs";

export const exportToExcel = async (fileName, sheets) => {
  const workbook = new ExcelJS.Workbook();

  for (const { sheetName, columns, rows } of sheets) {
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns.map((col) => {
      const values = rows.map((row) => {
        const value = row[col.key];
        return col.transform ? col.transform(value, row) : (value ?? "");
      });
      const maxLen = Math.max(
        col.header.length,
        ...values.map((v) => String(v).length),
      );
      return {
        header: col.header,
        width: Math.min(maxLen + 2, 50),
      };
    });

    for (const row of rows) {
      worksheet.addRow(
        columns.map((col) => {
          const value = row[col.key];
          return col.transform ? col.transform(value, row) : (value ?? "");
        }),
      );
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
