import ExcelJS from "exceljs";

export async function exportSurveyXlsx({ surveyName, questions, rows }) {
  // Group answers by user
  const userMap = new Map();
  for (const row of rows) {
    const key = row.user_id;
    if (!userMap.has(key)) {
      userMap.set(key, {
        user_id: key,
        user_email: row.user_email ?? "",
        answers: {},
      });
    }
    const value = row.answer?.value ?? row.answer ?? "";
    userMap.get(key).answers[row.question_id] = Array.isArray(value)
      ? value.join(", ")
      : String(value);
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Responses");

  // Build columns: User Email, User ID + one column per question
  const columns = [
    { header: "User Email", key: "user_email", width: 30 },
    { header: "User ID", key: "user_id", width: 12 },
    ...questions.map((q) => ({
      header: q.title || `Question ${q.id}`,
      key: `q_${q.id}`,
      width: 25,
    })),
  ];
  sheet.columns = columns;

  // Style header row
  sheet.getRow(1).font = { bold: true };

  // Add data rows
  for (const user of userMap.values()) {
    const rowData = { user_email: user.user_email, user_id: user.user_id };
    for (const q of questions) {
      rowData[`q_${q.id}`] = user.answers[q.id] ?? "";
    }
    sheet.addRow(rowData);
  }

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${surveyName.replace(/[^a-zA-Z0-9_-]/g, "_")}_responses.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
