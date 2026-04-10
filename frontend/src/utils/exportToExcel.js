import * as XLSX from "xlsx";

export const exportToExcel = (fileName, sheets) => {
  const workbook = XLSX.utils.book_new();

  for (const { sheetName, columns, rows } of sheets) {
    const header = columns.map((c) => c.header);
    const data = rows.map((row) =>
      columns.map((col) => {
        const value = row[col.key];
        return col.transform ? col.transform(value, row) : (value ?? "");
      }),
    );

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...data]);

    // Auto-size columns based on content
    worksheet["!cols"] = columns.map((col, i) => {
      const maxLen = Math.max(
        col.header.length,
        ...data.map((r) => String(r[i] ?? "").length),
      );
      return { wch: Math.min(maxLen + 2, 50) };
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  XLSX.writeFile(workbook, fileName);
};
