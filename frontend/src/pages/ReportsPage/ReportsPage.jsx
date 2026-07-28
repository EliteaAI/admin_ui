import { memo, useCallback, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import DrawerPage from "@/components/DrawerPage";
import DrawerPageHeader from "@/components/DrawerPageHeader";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  useSurveysListQuery,
  useLazySurveyAnswersQuery,
} from "@/api/surveysApi";
import { exportSurveyXlsx } from "@/utils/exportSurveyXlsx";

const DATE_PRESETS = [
  {
    label: "Today",
    getRange: () => {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      return { from, to };
    },
  },
  {
    label: "Yesterday",
    getRange: () => {
      const from = new Date();
      from.setDate(from.getDate() - 1);
      from.setHours(0, 0, 0, 0);
      const to = new Date();
      to.setDate(to.getDate() - 1);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    },
  },
  {
    label: "7d",
    getRange: () => {
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      const from = new Date();
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    },
  },
  {
    label: "30d",
    getRange: () => {
      const to = new Date();
      to.setHours(23, 59, 59, 999);
      const from = new Date();
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
      return { from, to };
    },
  },
];

const ReportsPage = memo(() => {
  usePageTitle("Reports");

  const { data: surveys = [], isLoading: surveysLoading } =
    useSurveysListQuery();
  const [triggerAnswers, { isFetching }] = useLazySurveyAnswersQuery();

  const [selectedSurveyId, setSelectedSurveyId] = useState("");
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [error, setError] = useState("");
  const [tableData, setTableData] = useState(null);

  const selectedSurvey = surveys.find((s) => s.id === selectedSurveyId) ?? null;

  const canGenerate = !!selectedSurveyId && !!dateFrom && !!dateTo;

  const handlePresetClick = useCallback((presetLabel) => {
    const preset = DATE_PRESETS.find((p) => p.label === presetLabel);
    if (!preset) return;
    const { from, to } = preset.getRange();
    setDateFrom(from);
    setDateTo(to);
    setActivePreset(presetLabel);
  }, []);

  const handleDateFromChange = useCallback((value) => {
    setDateFrom(value);
    setActivePreset(null);
  }, []);

  const handleDateToChange = useCallback((value) => {
    setDateTo(value);
    setActivePreset(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedSurveyId) return;
    setError("");
    setTableData(null);

    try {
      const params = { surveyId: selectedSurveyId, limit: 10000, offset: 0 };
      if (dateFrom) params.dateFrom = dateFrom.toISOString();
      if (dateTo) params.dateTo = dateTo.toISOString();

      const result = await triggerAnswers(params).unwrap();

      if (!result?.rows?.length) {
        setError(
          `No responses for "${selectedSurvey?.name ?? "survey"}" in the selected period.`,
        );
        return;
      }

      setTableData(result.rows);
    } catch (err) {
      setError(
        err?.data?.message ?? err?.message ?? "Failed to generate report",
      );
    }
  }, [selectedSurveyId, dateFrom, dateTo, triggerAnswers, selectedSurvey]);

  const handleDownload = useCallback(async () => {
    if (!tableData || !selectedSurvey) return;
    await exportSurveyXlsx({
      surveyName: selectedSurvey.name ?? "survey",
      questions: selectedSurvey.questions ?? [],
      rows: tableData,
    });
  }, [tableData, selectedSurvey]);

  // Build table columns from survey questions
  const columns = useMemo(() => {
    if (!selectedSurvey?.questions?.length) return [];
    return selectedSurvey.questions
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [selectedSurvey]);

  const groupedRows = useMemo(() => {
    if (!tableData) return [];

    const map = new Map();

    for (const row of tableData) {
      const key = row.user_id ?? row.session_id ?? `anon-${Math.random()}`;
      if (!map.has(key)) {
        map.set(key, {
          userId: row.user_id,
          email: row.user_email ?? "",
          answers: {},
        });
      }
      const entry = map.get(key);
      const value = row.answer?.value ?? row.answer ?? "";
      entry.answers[row.question_id] = Array.isArray(value)
        ? value.join(", ")
        : String(value);
    }
    return Array.from(map.values());
  }, [tableData]);

  const generateButton = (
    <Button
      variant="contained"
      size="small"
      startIcon={
        isFetching ? (
          <CircularProgress size={14} color="inherit" />
        ) : (
          <SearchOutlined />
        )
      }
      onClick={handleGenerate}
      disabled={!canGenerate || isFetching}
      sx={styles.generateButton}
    >
      Generate
    </Button>
  );

  return (
    <DrawerPage>
      <DrawerPageHeader
        title="Reports"
        showBorder
        extraContent={generateButton}
      />

      <Box sx={styles.content}>
        <Typography variant="body2" sx={styles.sectionTitle}>
          Filters
        </Typography>
        <Box sx={styles.filtersCard}>
          <FormControl size="small" fullWidth>
            <InputLabel sx={styles.inputLabel}>Survey</InputLabel>
            <Select
              value={selectedSurveyId}
              label="Survey"
              onChange={(e) => {
                setSelectedSurveyId(e.target.value);
                setError("");
                setTableData(null);
              }}
              disabled={surveysLoading}
              sx={styles.selectInput}
            >
              {surveys.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={styles.dateRow}>
            <Box sx={styles.presetsRow}>
              {DATE_PRESETS.map((preset) => (
                <Chip
                  key={preset.label}
                  label={preset.label}
                  size="small"
                  variant={
                    activePreset === preset.label ? "filled" : "outlined"
                  }
                  color={activePreset === preset.label ? "primary" : "default"}
                  onClick={() => handlePresetClick(preset.label)}
                  sx={styles.presetChip}
                />
              ))}
            </Box>

            <DateTimePicker
              label="From"
              value={dateFrom}
              onChange={handleDateFromChange}
              slotProps={{
                textField: { size: "small", sx: styles.dateField },
                actionBar: { actions: ["clear", "accept"] },
              }}
              maxDateTime={dateTo || undefined}
              ampm={false}
            />
            <DateTimePicker
              label="To"
              value={dateTo}
              onChange={handleDateToChange}
              slotProps={{
                textField: { size: "small", sx: styles.dateField },
                actionBar: { actions: ["clear", "accept"] },
              }}
              minDateTime={dateFrom || undefined}
              ampm={false}
            />
          </Box>
        </Box>

        {error && (
          <Alert severity="info" onClose={() => setError("")} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!selectedSurveyId && !tableData && (
          <Typography variant="body2" color="text.secondary">
            Select a survey and date range, then click Generate to view
            responses.
          </Typography>
        )}

        {tableData && groupedRows.length > 0 && (
          <Box sx={styles.tableSection}>
            <Box sx={styles.tableToolbar}>
              <Typography variant="body2" sx={styles.resultCount}>
                {groupedRows.length} response
                {groupedRows.length !== 1 ? "s" : ""}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<DownloadOutlinedIcon />}
                onClick={handleDownload}
                sx={styles.downloadBtn}
              >
                Download XLSX
              </Button>
            </Box>
            <Box sx={styles.tableWrapper}>
              <Box component="table" sx={styles.table}>
                <Box component="thead">
                  <Box component="tr">
                    <Box component="th" sx={styles.th}>
                      User Email
                    </Box>
                    <Box component="th" sx={styles.th}>
                      User ID
                    </Box>
                    {columns.map((q) => (
                      <Box component="th" key={q.id} sx={styles.th}>
                        {q.title}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {groupedRows.map((row, idx) => (
                    <Box component="tr" key={idx}>
                      <Box component="td" sx={styles.td}>
                        {row.email || "-"}
                      </Box>
                      <Box component="td" sx={styles.td}>
                        {row.userId ?? "-"}
                      </Box>
                      {columns.map((q) => (
                        <Box component="td" key={q.id} sx={styles.td}>
                          {row.answers[q.id] || "-"}
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </DrawerPage>
  );
});

const styles = {
  generateButton: {
    fontSize: "0.75rem",
    textTransform: "none",
    minWidth: "auto",
    padding: "0.25rem 0.75rem",
  },
  content: {
    flex: 1,
    overflow: "auto",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  filtersCard: ({ palette }) => ({
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "1rem",
    border: `1px solid ${palette.border.table}`,
    borderRadius: "0.5rem",
    backgroundColor:
      palette.background.tabPanel || palette.background.userInputBackground,
  }),
  sectionTitle: ({ palette }) => ({
    fontWeight: 600,
    fontSize: "0.875rem",
    color: palette.text.secondary,
  }),
  dateRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.625rem",
    flexWrap: "wrap",
  },
  selectInput: {
    fontSize: "0.8125rem",
  },
  inputLabel: {
    fontSize: "0.8125rem",
  },
  presetsRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  presetChip: {
    fontSize: "0.6875rem",
    height: "1.5rem",
  },
  dateField: {
    width: "13rem",
    "& input": { fontSize: "0.8125rem" },
    "& label": { fontSize: "0.8125rem" },
  },
  tableSection: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  tableToolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultCount: ({ palette }) => ({
    fontSize: "0.8125rem",
    color: palette.text.secondary,
  }),
  downloadBtn: {
    fontSize: "0.75rem",
    textTransform: "none",
  },
  tableWrapper: {
    overflow: "auto",
    maxHeight: "calc(100vh - 16rem)",
  },
  table: ({ palette }) => ({
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.8125rem",
    "& th, & td": {
      border: `1px solid ${palette.border.table}`,
      padding: "0.5rem 0.75rem",
      textAlign: "left",
      whiteSpace: "nowrap",
    },
  }),
  th: ({ palette }) => ({
    fontWeight: 600,
    fontSize: "0.75rem",
    color: palette.text.secondary,
    backgroundColor: palette.background.tabPanel || palette.background.default,
    position: "sticky",
    top: 0,
    zIndex: 1,
  }),
  td: {
    fontSize: "0.8125rem",
    maxWidth: "20rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};

ReportsPage.displayName = "ReportsPage";

export default ReportsPage;
