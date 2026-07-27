import { memo, useCallback } from "react";
import { Box, Switch, TextField, Typography } from "@mui/material";

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

const CostBudgets = memo((props) => {
  const { values, onChange } = props;

  const enabled = !!values?.cost_budgets_enabled;
  const defaultsEnabled = !!values?.cost_budgets_defaults_enabled;

  const handleToggleEnabled = useCallback(
    (e) => onChange("cost_budgets_enabled", e.target.checked),
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

  return (
    <Box sx={styles.root}>
      <Typography variant="body2" sx={styles.description}>
        Limit monthly spend on shared models per project and per user. Limits are
        enforced before each call, so an over-budget project is blocked rather
        than billed. Individual limits are set on the Budgets page; the values
        here apply only where nothing has been set explicitly.
      </Typography>

      <Box sx={styles.card}>
        <Box sx={styles.cardRow}>
          <Box sx={styles.cardLabel}>
            <Typography variant="body2" sx={styles.cardTitle}>
              Cost Budgets Enabled
            </Typography>
            <Typography variant="caption" sx={styles.cardHint}>
              Master switch for per-project and per-user spend limits. When
              disabled, no spend is tracked or blocked and calls behave exactly
              as before.
            </Typography>
          </Box>
          <Switch checked={enabled} onChange={handleToggleEnabled} />
        </Box>
      </Box>

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
          <Switch
            checked={defaultsEnabled}
            disabled={!enabled}
            onChange={handleToggleDefaults}
          />
        </Box>
      </Box>

      {enabled &&
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
