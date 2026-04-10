import { memo, useCallback } from "react";
import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { EditorView } from "@codemirror/view";
import { useTheme } from "@mui/material/styles";

const STYLE_OPTIONS = ["info", "warning"];
const ICON_OPTIONS = ["info", "warning"];

const DedicatedBanner = memo(({ values, onChange }) => {
  const theme = useTheme();

  const enabled = values?.banner_enabled ?? false;
  const dismissible = values?.banner_dismissible ?? false;
  const iconType = values?.banner_icon || "info";
  const bannerStyle = values?.banner_style || "info";
  const message = values?.banner_message || "";

  const handleToggleEnabled = useCallback(() => {
    onChange("banner_enabled", !enabled);
  }, [onChange, enabled]);

  const handleToggleDismissible = useCallback(() => {
    onChange("banner_dismissible", !dismissible);
  }, [onChange, dismissible]);

  const handleIconChange = useCallback(
    (e) => onChange("banner_icon", e.target.value),
    [onChange],
  );

  const handleStyleChange = useCallback(
    (e) => onChange("banner_style", e.target.value),
    [onChange],
  );

  const handleMessageChange = useCallback(
    (val) => onChange("banner_message", val),
    [onChange],
  );

  return (
    <Box sx={styles.root}>
      <Typography variant="body2" sx={styles.description}>
        Enable dedicated banner to communicate important notifications across
        the platform, including system warnings, maintenance alerts, policy
        updates, and general informational messages.
      </Typography>

      <Box sx={styles.card}>
        <Box sx={styles.cardRow}>
          <Box sx={styles.cardLabel}>
            <Typography variant="body2" sx={styles.cardTitle}>
              Banner Enabled
            </Typography>
            <Typography variant="caption" sx={styles.cardHint}>
              When enabled, banner is displayed to all users environment-wide
            </Typography>
          </Box>
          <Switch checked={enabled} onChange={handleToggleEnabled} />
        </Box>
      </Box>

      <Box sx={styles.card}>
        <Box sx={styles.cardRow}>
          <Box sx={styles.cardLabel}>
            <Typography variant="body2" sx={styles.cardTitle}>
              Dismissible
            </Typography>
            <Typography variant="caption" sx={styles.cardHint}>
              When enabled, users can close the banner. Dismissed state persists
              until new banner is configured or user logs out / clears session
              cache
            </Typography>
          </Box>
          <Switch checked={dismissible} onChange={handleToggleDismissible} />
        </Box>
      </Box>

      <Box sx={styles.card}>
        <Box sx={styles.cardRow}>
          <Box sx={[styles.cardLabel, { width: "100%" }]}>
            <Typography variant="body2" sx={styles.cardTitle}>
              Icon
            </Typography>
            <Select
              size="small"
              value={iconType}
              onChange={handleIconChange}
              sx={styles.select}
            >
              {ICON_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
      </Box>

      <Box sx={styles.card}>
        <Box sx={styles.cardRow}>
          <Box sx={[styles.cardLabel, { width: "100%" }]}>
            <Typography variant="body2" sx={styles.cardTitle}>
              Banner Style
            </Typography>
            <Select
              size="small"
              value={bannerStyle}
              onChange={handleStyleChange}
              sx={styles.select}
            >
              {STYLE_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Box>
      </Box>

      <Box sx={styles.editorCard}>
        <Box sx={styles.editorHeader}>
          <Typography variant="body2" sx={styles.editorTitle}>
            Banner Message
          </Typography>
          <Typography variant="caption" sx={styles.editorHint}>
            Fill in the message to be shown in the banner. Supports Markdown
            formatting.
          </Typography>
        </Box>
        <Box sx={styles.editorWrapper}>
          <CodeMirror
            value={message}
            height="300px"
            extensions={[html(), EditorView.lineWrapping]}
            onChange={handleMessageChange}
            theme={theme.palette.mode}
          />
        </Box>
      </Box>
    </Box>
  );
});

DedicatedBanner.displayName = "DedicatedBanner";

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
    fontSize: "0.8125rem",
    marginTop: "1rem",
  },
  editorCard: ({ palette }) => ({
    border: `1px solid ${palette.border.table}`,
    borderRadius: "0.5rem",
    overflow: "hidden",
  }),
  editorHeader: ({ palette }) => ({
    padding: "1rem 1.25rem",
    backgroundColor:
      palette.background.tabPanel || palette.background.userInputBackground,
    borderBottom: `1px solid ${palette.border.table}`,
  }),
  editorTitle: {
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  editorHint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.75rem",
  }),
  editorWrapper: {
    "& .cm-theme-dark": {
      display: "flex",
      flexDirection: "column",
    },
    "& .cm-editor": {
      fontSize: "0.75rem",
    },
    "& .cm-scroller": {
      overflow: "auto",
    },
    "& .cm-gutters": {
      fontSize: "0.75rem",
    },
  },
};

export default DedicatedBanner;
