import { memo, useCallback } from "react";
import { Box, Switch, TextField, Typography } from "@mui/material";

const SupportAssistant = memo((props) => {
  const { values, onChange } = props;

  const raw = values?.vite_elitea_assistant;
  const enabled = raw === "1" || raw === 1 || raw === true;

  const agentProjectId = values?.support_agent_project_id ?? "";
  const agentId = values?.support_agent_id ?? "";
  const supportProjectId = values?.support_project_id ?? "";
  const welcomeMessage = values?.support_welcome_message ?? "";
  const assistantName = values?.support_assistant_name ?? "";

  const handleToggleEnabled = useCallback(() => {
    onChange("vite_elitea_assistant", enabled ? "0" : "1");
  }, [onChange, enabled]);

  const handleAgentProjectIdChange = useCallback(
    (e) => {
      const val = e.target.value;
      onChange("support_agent_project_id", val === "" ? null : Number(val));
    },
    [onChange],
  );

  const handleSupportProjectIdChange = useCallback(
    (e) => {
      const val = e.target.value;
      onChange("support_project_id", val === "" ? null : Number(val));
    },
    [onChange],
  );

  const handleAgentIdChange = useCallback(
    (e) => {
      const val = e.target.value;
      onChange("support_agent_id", val === "" ? null : Number(val));
    },
    [onChange],
  );

  const handleWelcomeMessageChange = useCallback(
    (e) => onChange("support_welcome_message", e.target.value),
    [onChange],
  );

  const handleAssistantNameChange = useCallback(
    (e) => onChange("support_assistant_name", e.target.value),
    [onChange],
  );

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

      <Box sx={styles.card}>
        <Box sx={styles.cardRow}>
          <Box sx={[styles.cardLabel, { width: "100%" }]}>
            <Typography variant="body2" sx={styles.cardTitle}>
              Support Project ID
            </Typography>
            <Typography variant="caption" sx={styles.cardHint}>
              Project ID used for support conversations. Auto-created if left
              empty.
            </Typography>
            <TextField
              size="small"
              type="number"
              value={supportProjectId}
              onChange={handleSupportProjectIdChange}
              placeholder="Auto-created if empty"
              sx={styles.textField}
              fullWidth
            />
          </Box>
        </Box>
      </Box>

      <Box sx={styles.card}>
        <Box sx={styles.cardRow}>
          <Box sx={[styles.cardLabel, { width: "100%" }]}>
            <Typography variant="body2" sx={styles.cardTitle}>
              Agent Project ID
            </Typography>
            <Typography variant="caption" sx={styles.cardHint}>
              Project ID where the support agent is located
            </Typography>
            <TextField
              size="small"
              type="number"
              value={agentProjectId}
              onChange={handleAgentProjectIdChange}
              placeholder="Enter project ID"
              sx={styles.textField}
              fullWidth
            />
          </Box>
        </Box>
      </Box>

      <Box sx={styles.card}>
        <Box sx={styles.cardRow}>
          <Box sx={[styles.cardLabel, { width: "100%" }]}>
            <Typography variant="body2" sx={styles.cardTitle}>
              Agent ID
            </Typography>
            <Typography variant="caption" sx={styles.cardHint}>
              Application ID of the support agent
            </Typography>
            <TextField
              size="small"
              type="number"
              value={agentId}
              onChange={handleAgentIdChange}
              placeholder="Enter agent ID"
              sx={styles.textField}
              fullWidth
            />
          </Box>
        </Box>
      </Box>

      <Box sx={styles.card}>
        <Box sx={styles.cardRow}>
          <Box sx={[styles.cardLabel, { width: "100%" }]}>
            <Typography variant="body2" sx={styles.cardTitle}>
              Assistant Name
            </Typography>
            <Typography variant="caption" sx={styles.cardHint}>
              Display name shown in the support widget header
            </Typography>
            <TextField
              size="small"
              value={assistantName}
              onChange={handleAssistantNameChange}
              placeholder="ELITEA Support"
              sx={styles.textField}
              fullWidth
            />
          </Box>
        </Box>
      </Box>

      <Box sx={styles.card}>
        <Box sx={styles.cardRow}>
          <Box sx={[styles.cardLabel, { width: "100%" }]}>
            <Typography variant="body2" sx={styles.cardTitle}>
              Welcome Message
            </Typography>
            <Typography variant="caption" sx={styles.cardHint}>
              Initial greeting message shown when users open the support widget
            </Typography>
            <TextField
              size="small"
              value={welcomeMessage}
              onChange={handleWelcomeMessageChange}
              placeholder="Hello! How can I help you today?"
              sx={styles.textField}
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
            />
          </Box>
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
  textField: {
    marginTop: "0.75rem",
    "& .MuiInputBase-input": {
      fontSize: "0.875rem",
    },
  },
};

export default SupportAssistant;
