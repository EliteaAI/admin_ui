import { memo, useCallback } from "react";
import { Box, Switch, Typography } from "@mui/material";

const SupportAssistant = memo((props) => {
  const { values, onChange } = props;

  const raw = values?.vite_elitea_assistant;
  const enabled = raw === "1" || raw === 1 || raw === true;

  const handleToggleEnabled = useCallback(() => {
    onChange("vite_elitea_assistant", enabled ? "0" : "1");
  }, [onChange, enabled]);

  return (
    <Box sx={styles.root}>
      <Typography variant="body2" sx={styles.description}>
        Enable the Support Assistant widget to provide users with an in-app
        AI-powered assistant for guidance and troubleshooting.
      </Typography>

      <Box sx={styles.card}>
        <Box sx={styles.cardRow}>
          <Box sx={styles.cardLabel}>
            <Typography variant="body2" sx={styles.cardTitle}>
              Assistant Enabled
            </Typography>
            <Typography variant="caption" sx={styles.cardHint}>
              When enabled, the support assistant widget is available to all
              users environment-wide
            </Typography>
          </Box>
          <Switch checked={enabled} onChange={handleToggleEnabled} />
        </Box>
      </Box>
    </Box>
  );
});

SupportAssistant.displayName = "SupportAssistant";

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
};

export default SupportAssistant;
