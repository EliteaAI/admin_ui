import { memo, useCallback } from "react";
import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

const VoiceFeatures = memo((props) => {
  const { values, onChange } = props;

  const enabled = !!values?.vite_voice_features_enabled;
  const temporarilyDisabled = !!values?.vite_voice_features_temporarily_disabled;

  const handleToggleEnabled = useCallback(
    (e) => onChange("vite_voice_features_enabled", e.target.checked),
    [onChange],
  );

  const handleToggleTemporarilyDisabled = useCallback(
    (e) => onChange("vite_voice_features_temporarily_disabled", e.target.checked),
    [onChange],
  );

  return (
    <Box sx={styles.root}>
      <Typography variant="body2" sx={styles.description}>
        Control Voice-to-Voice, Text-to-Voice, and Voice-to-Text features
        environment-wide. These toggles apply to all three voice capabilities
        together.
      </Typography>

      <Box sx={styles.toggleCard}>
        <Box sx={styles.toggleRow}>
          <Box sx={styles.toggleLabel}>
            <Typography variant="body2" sx={styles.toggleTitle}>
              Voice Features Enabled
            </Typography>
            <Typography variant="caption" sx={styles.toggleHint}>
              When disabled, all voice buttons and icons are completely hidden
              for all users across the environment.
            </Typography>
          </Box>
          <Switch checked={enabled} onChange={handleToggleEnabled} />
        </Box>
      </Box>

      <Box sx={styles.toggleCard}>
        <Box sx={styles.toggleRow}>
          <Box sx={styles.toggleLabel}>
            <Typography variant="body2" sx={styles.toggleTitle}>
              Temporarily Disable Voice Features
            </Typography>
            <Typography variant="caption" sx={styles.toggleHint}>
              When enabled, voice buttons remain visible but are
              non-interactive. Users see a tooltip: "Temporarily disabled by
              admin".
            </Typography>
          </Box>
          <Switch
            checked={temporarilyDisabled}
            onChange={handleToggleTemporarilyDisabled}
            disabled={!enabled}
          />
        </Box>
      </Box>
    </Box>
  );
});

VoiceFeatures.displayName = "VoiceFeatures";

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
  toggleCard: ({ palette }) => ({
    border: `1px solid ${palette.border.table}`,
    borderRadius: "0.5rem",
    overflow: "hidden",
  }),
  toggleRow: ({ palette }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.25rem",
    backgroundColor:
      palette.background.tabPanel || palette.background.userInputBackground,
  }),
  toggleLabel: {
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
  },
  toggleTitle: {
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  toggleHint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.75rem",
  }),
};

export default VoiceFeatures;
