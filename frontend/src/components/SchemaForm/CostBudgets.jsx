import { memo, useCallback } from "react";
import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

const DEFAULT_LIMIT_FIELDS = [
  {
    key: "cost_budgets_project_monthly_limit",
    title: "Team project limit",
    hint: "Applies to team projects with no limit set explicitly.",
  },
  {
    key: "cost_budgets_personal_project_monthly_limit",
    title: "User limit",
    hint: "Each user's own budget. API and token calls made without a project are billed here.",
  },
  {
    key: "cost_budgets_user_monthly_limit",
    title: "Per-member limit inside a project",
    hint: "Caps one member's spend within a project, so a single member cannot consume the whole project budget.",
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
      const raw = e.target.value;
      onChange(key, raw.trim() === "" ? null : Number(raw));
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

      <Box sx={styles.toggleCard}>
        <Box sx={styles.toggleRow}>
          <Box sx={styles.toggleLabel}>
            <Typography variant="body2" sx={styles.toggleTitle}>
              Cost budgets enabled
            </Typography>
            <Typography variant="caption" sx={styles.toggleHint}>
              When disabled, no spend is tracked or blocked and calls behave
              exactly as before.
            </Typography>
          </Box>
          <Switch checked={enabled} onChange={handleToggleEnabled} />
        </Box>

        <Box sx={styles.toggleRow}>
          <Box sx={styles.toggleLabel}>
            <Typography
              variant="body2"
              sx={enabled ? styles.toggleTitle : styles.disabledTitle}
            >
              Apply default limits
            </Typography>
            <Typography variant="caption" sx={styles.toggleHint}>
              Without defaults, anything without an explicit limit stays
              unlimited.
            </Typography>
          </Box>
          <Switch
            checked={defaultsEnabled}
            disabled={!enabled}
            onChange={handleToggleDefaults}
          />
        </Box>
      </Box>

      {enabled && defaultsEnabled && (
        <Box sx={styles.limitsCard}>
          <Typography variant="caption" sx={styles.toggleHint}>
            Leave a field empty for unlimited.
          </Typography>

          {DEFAULT_LIMIT_FIELDS.map((field) => (
            <Box key={field.key} sx={styles.limitRow}>
              <Box sx={styles.toggleLabel}>
                <Typography variant="body2" sx={styles.toggleTitle}>
                  {field.title}
                </Typography>
                <Typography variant="caption" sx={styles.toggleHint}>
                  {field.hint}
                </Typography>
              </Box>
              <TextField
                value={values?.[field.key] ?? ""}
                onChange={handleLimitChange(field.key)}
                type="number"
                size="small"
                placeholder="Unlimited"
                sx={styles.limitInput}
                inputProps={{ min: 0, step: "1", inputMode: "decimal" }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
});

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "1rem",
  },
  description: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  toggleCard: ({ palette }) => ({
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "1rem",
    borderRadius: "0.5rem",
    border: `1px solid ${palette.divider}`,
  }),
  limitsCard: ({ palette }) => ({
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "1rem",
    borderRadius: "0.5rem",
    border: `1px solid ${palette.divider}`,
  }),
  toggleRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
  },
  limitRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
  },
  toggleLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    maxWidth: "32rem",
  },
  toggleTitle: {
    fontWeight: 500,
  },
  disabledTitle: ({ palette }) => ({
    fontWeight: 500,
    color: palette.text.disabled,
  }),
  toggleHint: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  limitInput: {
    width: "10rem",
    flexShrink: 0,
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

CostBudgets.displayName = "CostBudgets";

export default CostBudgets;
