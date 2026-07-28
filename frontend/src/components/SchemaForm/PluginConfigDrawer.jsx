import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CodeMirror from "@uiw/react-codemirror";
import { yaml } from "@codemirror/lang-yaml";
import { EditorView } from "@codemirror/view";
import { lintGutter } from "@codemirror/lint";
import jsYaml from "js-yaml";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import {
  useLazyRuntimeRemoteConfigQuery,
  useRuntimeRemoteConfigSaveMutation,
  useConfigRestartMutation,
} from "@/api/configurationApi";
import { yamlLinter } from "@/utils/yamlLinter";

const PluginConfigDrawer = memo(function PluginConfigDrawer({
  open,
  plugin,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [rawContent, setRawContent] = useState("");
  const [mergedContent, setMergedContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [hasYamlError, setHasYamlError] = useState(false);

  const [fetchConfig, { isFetching }] = useLazyRuntimeRemoteConfigQuery();
  const [saveConfig, { isLoading: saving }] =
    useRuntimeRemoteConfigSaveMutation();
  const [restartPylon, { isLoading: restarting }] = useConfigRestartMutation();

  const isPylon = plugin && !plugin.name;
  const pluginId = plugin
    ? plugin.name
      ? `${plugin.pylon_id}:${plugin.name}`
      : plugin.pylon_id
    : "";

  // Load both raw and merged configs when drawer opens
  useEffect(() => {
    if (!open || !pluginId) return;

    setActiveTab(0);
    setIsDirty(false);
    setNeedsReload(false);
    setHasYamlError(false);

    fetchConfig({ pluginId, raw: true })
      .unwrap()
      .then((res) => setRawContent(res.config || ""))
      .catch(() => setRawContent("# Failed to load raw config"));

    fetchConfig({ pluginId, raw: false })
      .unwrap()
      .then((res) => setMergedContent(res.config || ""))
      .catch(() => setMergedContent("# Failed to load merged config"));
  }, [open, pluginId, fetchConfig]);

  const validateYaml = useCallback((content) => {
    try {
      jsYaml.load(content);
      setHasYamlError(false);
      return true;
    } catch {
      setHasYamlError(true);
      return false;
    }
  }, []);

  const handleRawChange = useCallback(
    (val) => {
      setRawContent(val);
      setIsDirty(true);
      validateYaml(val);
    },
    [validateYaml],
  );

  const rawExtensions = useMemo(
    () => [yaml(), EditorView.lineWrapping, yamlLinter, lintGutter()],
    [],
  );
  const readOnlyExtensions = useMemo(
    () => [yaml(), EditorView.lineWrapping],
    [],
  );

  const handleSave = useCallback(async () => {
    if (!validateYaml(rawContent)) return;

    try {
      await saveConfig({ pluginId, data: rawContent }).unwrap();
      setIsDirty(false);
      setNeedsReload(true);
      const label = isPylon ? "Restart pylon" : `Reload ${plugin?.name}`;
      setSnackbar({
        open: true,
        message: `Configuration saved. ${label} to apply changes.`,
        severity: "warning",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Save failed: ${err?.data?.error || err?.message || "Unknown error"}`,
        severity: "error",
      });
    }
  }, [validateYaml, pluginId, rawContent, saveConfig, isPylon, plugin?.name]);

  const handleReload = useCallback(async () => {
    try {
      const pylonId = plugin?.pylon_id;
      if (isPylon) {
        await restartPylon({ pylonId }).unwrap();
        setSnackbar({
          open: true,
          message: `Restart signal sent to ${pylonId}`,
          severity: "info",
        });
      } else {
        await restartPylon({ pylonId, plugins: [plugin.name] }).unwrap();
        setSnackbar({
          open: true,
          message: `Reload signal sent for ${plugin.name}`,
          severity: "info",
        });
      }
      setNeedsReload(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed: ${err?.message || "Unknown error"}`,
        severity: "error",
      });
    }
  }, [plugin, isPylon, restartPylon]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm(
        "You have unsaved changes. Discard them?",
      );
      if (!confirmed) return;
    }
    onClose();
  }, [isDirty, onClose]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        sx={styles.drawer}
      >
        <Box sx={styles.root}>
          {/* Header */}
          <Box sx={styles.header}>
            <Box sx={styles.headerLeft}>
              <Typography variant="h6" sx={styles.title}>
                {isPylon ? "Pylon Config" : plugin?.name || "Plugin Config"}
              </Typography>
              <Typography
                variant="body2"
                color="text.metrics"
                sx={styles.subtitle}
              >
                {plugin?.pylon_id}
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleClose}>
              <CloseOutlined fontSize="small" />
            </IconButton>
          </Box>

          {/* Tabs */}
          <Box sx={styles.tabBar}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={styles.tabs}
            >
              <Tab label="Raw Config" sx={styles.tab} />
              <Tab label="Merged Config" sx={styles.tab} />
            </Tabs>
          </Box>

          {/* Editor */}
          <Box sx={styles.editorArea}>
            {isFetching ? (
              <Box sx={styles.loading}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box sx={styles.editorWrapper}>
                <CodeMirror
                  value={activeTab === 0 ? rawContent : mergedContent}
                  height="100%"
                  extensions={
                    activeTab === 0 ? rawExtensions : readOnlyExtensions
                  }
                  onChange={activeTab === 0 ? handleRawChange : undefined}
                  readOnly={activeTab === 1}
                  theme="dark"
                />
              </Box>
            )}
          </Box>

          {/* Footer */}
          {activeTab === 0 && (
            <Box sx={styles.footer}>
              {hasYamlError && (
                <Typography variant="caption" color="error" sx={{ mr: 1 }}>
                  Fix YAML errors before saving
                </Typography>
              )}

              {needsReload && (
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={
                    isPylon ? (
                      <RestartAltIcon sx={{ fontSize: "0.875rem" }} />
                    ) : (
                      <RefreshOutlinedIcon sx={{ fontSize: "0.875rem" }} />
                    )
                  }
                  onClick={handleReload}
                  disabled={restarting}
                  sx={styles.reloadButton}
                >
                  {restarting
                    ? isPylon
                      ? "Restarting..."
                      : "Reloading..."
                    : isPylon
                      ? "Restart Pylon"
                      : "Reload Plugin"}
                </Button>
              )}
              <Button
                size="small"
                variant="contained"
                onClick={handleSave}
                disabled={!isDirty || saving || hasYamlError}
                sx={styles.saveButton}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
});

const styles = {
  drawer: {
    "& .MuiDrawer-paper": {
      width: "50vw",
      maxWidth: "50vw",
    },
  },
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  header: ({ palette }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 1.5rem",
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "0.125rem",
    overflow: "hidden",
  },
  title: {
    fontSize: "1rem",
    fontWeight: 600,
  },
  subtitle: {
    fontSize: "0.75rem",
    fontFamily: "monospace",
  },
  tabBar: ({ palette }) => ({
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    padding: "0 1.5rem",
  }),
  tabs: {
    minHeight: "2.25rem",
    "& .MuiTabs-indicator": {
      height: "0.125rem",
    },
  },
  tab: {
    textTransform: "none",
    fontSize: "0.8125rem",
    minHeight: "2.25rem",
    padding: "0.375rem 1rem",
  },
  editorArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  editorWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    "& .cm-theme-dark": {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
    },
    "& .cm-editor": {
      flex: 1,
      fontSize: "0.75rem",
    },
    "& .cm-scroller": {
      overflow: "auto",
    },
    "& .cm-gutters": {
      fontSize: "0.75rem",
    },
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  footer: ({ palette }) => ({
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    borderTop: `0.0625rem solid ${palette.border.table}`,
  }),
  reloadButton: {
    textTransform: "none",
    fontSize: "0.8125rem",
  },
  saveButton: {
    textTransform: "none",
    fontSize: "0.8125rem",
  },
};

export default PluginConfigDrawer;
