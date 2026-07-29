import { memo, useCallback, useEffect, useMemo } from "react";
import {
  Box,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

const MODE_OPTIONS = [
  {
    value: "off",
    label: "Off",
    hint: "Requests are left untouched and nothing is tracked or blocked. This is a true rollback to pre-feature behaviour.",
  },
  {
    value: "observe",
    label: "Observe (track only)",
    hint: "Spend is tracked per project and per user, but no call is ever blocked. Use this to measure real usage before choosing limits.",
  },
  {
    value: "enforce",
    label: "Enforce (track and block)",
    hint: "Spend is tracked and calls are rejected once a limit is exceeded.",
  },
];

const DEFAULT_LIMIT_FIELDS = [
  {
    key: "cost_budgets_project_monthly_limit",
    title: "Default Team Project Limit",
    hint: "Monthly limit in USD for team projects with no limit set explicitly. Leave empty for unlimited.",
  },
  {
    key: "cost_budgets_personal_project_monthly_limit",
    title: "Default User Limit",
    hint: "Monthly limit in USD for each user's own budget. API and token calls made without a project are billed here. Leave empty for unlimited.",
  },
  {
    key: "cost_budgets_user_monthly_limit",
    title: "Default Per-Member Limit Inside A Project",
    hint: "Monthly limit in USD for a single member's spend within a project, so one member cannot consume the whole project budget. Leave empty for unlimited.",
  },
];

const WARNING_THRESHOLD_FIELDS = [
  {
    key: "cost_budgets_project_warning_pct",
    title: "Team Project Budget Warning Threshold",
    hint: "Show a usage alert when a team project's spend reaches this percentage of its budget limit.",
  },
  {
    key: "cost_budgets_personal_project_warning_pct",
    title: "Personal Project Budget Warning Threshold",
    hint: "Show a usage alert when a user's own project spend reaches this percentage of its budget limit.",
  },
  {
    key: "cost_budgets_user_warning_pct",
    title: "Default Per-Member Budget Warning Threshold",
    hint: "Show a usage alert when a member's spend inside a team project reaches this percentage of their own budget limit.",
  },
];

const DEFAULT_WARNING_PCT = 80;

/** Empty, non-numeric or out-of-range values must block Save rather than persist. */
const warningPctError = (value) => {
  if (value === "" || value === null || value === undefined)
    return "Required (1-100)";

  if (!Number.isInteger(Number(value))) return "Must be a whole number";
  if (Number(value) < 1 || Number(value) > 100) return "Must be between 1 and 100";

  return "";
};

const CostBudgets = memo((props) => {
  const { values, onChange, onValidityChange } = props;

  const mode = values?.cost_budgets_mode || "off";
  const enforcing = mode === "enforce";
  const budgetsOn = mode !== "off";
  const defaultsEnabled = !!values?.cost_budgets_defaults_enabled;

  const activeMode =
    MODE_OPTIONS.find((o) => o.value === mode) || MODE_OPTIONS[0];

  const handleModeChange = useCallback(
    (e) => onChange("cost_budgets_mode", e.target.value),
    [onChange],
  );

  const handleToggleDefaults = useCallback(
    (e) => onChange("cost_budgets_defaults_enabled", e.target.checked),
    [onChange],
  );

  // An empty field means "no default for this scope", which is unlimited
  const handleLimitChange = useCallback(
    (key) => (e) => {
      const val = e.target.value;
      onChange(key, val === "" ? null : Number(val));
    },
    [onChange],
  );

  const handleWarningPctChange = useCallback(
    (key) => (e) => {
      const val = e.target.value;
      onChange(key, val === "" ? "" : Number(val));
    },
    [onChange],
  );

  const thresholdErrors = useMemo(
    () =>
      Object.fromEntries(
        WARNING_THRESHOLD_FIELDS.map((field) => [
          field.key,
          warningPctError(values?.[field.key] ?? DEFAULT_WARNING_PCT),
        ]),
      ),
    [values],
  );

  // Save lives in the parent, so invalid input has to be reported upwards
  useEffect(() => {
    if (!onValidityChange) return;

    const invalid = budgetsOn && Object.values(thresholdErrors).some(Boolean);
    onValidityChange(!invalid);
  }, [budgetsOn, thresholdErrors, onValidityChange]);

  return (
    <Box sx={styles.root}>
      <Typography variant="body2" sx={styles.description}>
        Limit monthly spend on shared models per project and per user. Limits
        are enforced before each call, so an over-budget project is blocked
        rather than billed. Individual limits are set on the Budgets page; the
        values here apply only where nothing has been set explicitly.
      </Typography>

      <Box sx={styles.card}>
        <Box sx={styles.cardRow}>
          <Box sx={[styles.cardLabel, { width: "100%" }]}>
            <Typography variant="body2" sx={styles.cardTitle}>
              Cost Budgets Mode
            </Typography>
            <Typography variant="caption" sx={styles.cardHint}>
              {activeMode.hint}
            </Typography>
            <Select
              size="small"
              value={mode}
              onChange={handleModeChange}
              sx={styles.select}
              fullWidth
            >
              {MODE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
      </Box>

      {enforcing && (
        <Box sx={styles.card}>
          <Box sx={styles.cardRow}>
            <Box sx={styles.cardLabel}>
              <Typography variant="body2" sx={styles.cardTitle}>
                Apply Default Limits
              </Typography>
              <Typography variant="caption" sx={styles.cardHint}>
                Apply the limits below to projects and users with no limit set
                explicitly. When disabled, anything without an explicit limit
                stays unlimited.
              </Typography>
            </Box>
            <Switch checked={defaultsEnabled} onChange={handleToggleDefaults} />
          </Box>
        </Box>
      )}

      {enforcing &&
        defaultsEnabled &&
        DEFAULT_LIMIT_FIELDS.map((field) => (
          <Box key={field.key} sx={styles.card}>
            <Box sx={styles.cardRow}>
              <Box sx={[styles.cardLabel, { width: "100%" }]}>
                <Typography variant="body2" sx={styles.cardTitle}>
                  {field.title}
                </Typography>
                <Typography variant="caption" sx={styles.cardHint}>
                  {field.hint}
                </Typography>
                <TextField
                  size="small"
                  type="number"
                  value={values?.[field.key] ?? ""}
                  onChange={handleLimitChange(field.key)}
                  placeholder="Unlimited"
                  sx={styles.textField}
                  inputProps={{ min: 0, step: "1", inputMode: "decimal" }}
                  fullWidth
                />
              </Box>
            </Box>
          </Box>
        ))}

      {budgetsOn &&
        WARNING_THRESHOLD_FIELDS.map((field) => (
          <Box key={field.key} sx={styles.card}>
            <Box sx={styles.cardRow}>
              <Box sx={[styles.cardLabel, { width: "100%" }]}>
                <Typography variant="body2" sx={styles.cardTitle}>
                  {field.title}
                </Typography>
                <Typography variant="caption" sx={styles.cardHint}>
                  {field.hint}
                </Typography>
                <TextField
                  size="small"
                  type="number"
                  value={values?.[field.key] ?? DEFAULT_WARNING_PCT}
                  onChange={handleWarningPctChange(field.key)}
                  error={!!thresholdErrors[field.key]}
                  helperText={thresholdErrors[field.key] || " "}
                  sx={styles.textField}
                  inputProps={{ min: 1, max: 100, step: "1" }}
                  fullWidth
                />
              </Box>
            </Box>
          </Box>
        ))}
    </Box>
  );
});

CostBudgets.displayName = "CostBudgets";

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    padding: "1.5rem",
  },
  description: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.8125rem",
    lineHeight: 1.6,
  }),
  card: ({ palette }) => ({
    border: `1px solid ${palette.border.table}`,
    borderRadius: "0.5rem",
    overflow: "hidden",
  }),
  cardRow: ({ palette }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.25rem",
    backgroundColor:
      palette.background.tabPanel || palette.background.userInputBackground,
  }),
  cardLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  cardHint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.75rem",
  }),
  select: {
    marginTop: "0.75rem",
    "& .MuiSelect-select": {
      fontSize: "0.875rem",
    },
  },
  textField: {
    marginTop: "0.75rem",
    "& .MuiInputBase-input": {
      fontSize: "0.875rem",
    },
    // The native spinner renders unstyled against the dark theme
    "& input[type=number]": {
      MozAppearance: "textfield",
    },
    "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
      {
        WebkitAppearance: "none",
        margin: 0,
      },
  },
};

export default CostBudgets;
