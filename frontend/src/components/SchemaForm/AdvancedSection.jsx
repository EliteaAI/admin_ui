import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ClearAllOutlinedIcon from "@mui/icons-material/ClearAllOutlined";
import PluginConfigDrawer from "./PluginConfigDrawer";
import PylonLogsDrawer from "./PylonLogsDrawer";
import {
  useRuntimeRemoteQuery,
  useConfigRestartMutation,
  useRuntimePluginCheckMutation,
  useRuntimePluginUpdateMutation,
} from "@/api/configurationApi";
import { ALWAYS_SHOW_PLUGIN_UPDATE } from "@/utils/env";

const COLUMNS = [
  { field: "name", label: "Name", width: "1fr" },
  { field: "local_version", label: "Version", width: "7rem" },
  { field: "repo_version", label: "Repo Version", width: "7rem" },
  { field: "activated", label: "Active", width: "5rem" },
  { field: "actions", label: "Actions", width: "18rem" },
];

const gridTemplate = COLUMNS.map((c) => c.width).join(" ");

const STORAGE_KEY = "admin_plugin_repo_versions";

function loadPluginStates() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function pluginKey(pylonId, name) {
  return `${pylonId}::${name}`;
}

function AdvancedSection() {
  const { data, isLoading, refetch: refetchPylons } = useRuntimeRemoteQuery();
  const [restartPylon] = useConfigRestartMutation();
  const [checkPlugin] = useRuntimePluginCheckMutation();
  const [updatePlugin] = useRuntimePluginUpdateMutation();
  const [collapsedPylons, setCollapsedPylons] = useState({});
  const [drawerPlugin, setDrawerPlugin] = useState(null);
  const [logsPylonId, setLogsPylonId] = useState(null);
  const [pluginStates, setPluginStates] = useState(loadPluginStates);
  const [updatingAllPylons, setUpdatingAllPylons] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pluginStates));
    } catch {
      /* ignore quota errors */
    }
  }, [pluginStates]);

  const pylonGroups = useMemo(() => {
    if (!data?.rows) return [];
    const groups = {};
    for (const row of data.rows) {
      const pid = row.pylon_id;
      if (!groups[pid]) groups[pid] = [];
      groups[pid].push(row);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  const togglePylon = useCallback((pylonId) => {
    setCollapsedPylons((prev) => ({ ...prev, [pylonId]: !prev[pylonId] }));
  }, []);

  const handleOpenDrawer = useCallback((plugin) => {
    setDrawerPlugin(plugin);
  }, []);

  const handleOpenPylonConfig = useCallback((pylonId) => {
    setDrawerPlugin({ pylon_id: pylonId, name: null });
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerPlugin(null);
  }, []);

  const handleOpenLogsDrawer = useCallback((pylonId) => {
    setLogsPylonId(pylonId);
  }, []);

  const handleCloseLogsDrawer = useCallback(() => {
    setLogsPylonId(null);
  }, []);

  const handleResetLocalState = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setPluginStates({});
    setCollapsedPylons({});
    refetchPylons();
    setSnackbar({
      open: true,
      message: "Local plugin state cleared, refreshing pylons…",
      severity: "info",
    });
  }, [refetchPylons]);

  const handleReloadPlugin = useCallback(
    async (pylonId, pluginName) => {
      try {
        await restartPylon({ pylonId, plugins: [pluginName] }).unwrap();
        const key = pluginKey(pylonId, pluginName);
        setPluginStates((prev) => ({
          ...prev,
          [key]: { ...prev[key], updated: false },
        }));
        setSnackbar({
          open: true,
          message: `Reload signal sent for ${pluginName} on ${pylonId}`,
          severity: "info",
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Reload failed: ${err?.message || "Unknown error"}`,
          severity: "error",
        });
      }
    },
    [restartPylon],
  );

  const handleRestartPylon = useCallback(
    async (pylonId, plugins) => {
      try {
        await restartPylon({ pylonId }).unwrap();
        if (plugins?.length) {
          setPluginStates((prev) => {
            const next = { ...prev };
            for (const p of plugins) {
              const key = pluginKey(pylonId, p.name);
              if (next[key]) next[key] = { ...next[key], updated: false };
            }
            return next;
          });
        }
        setSnackbar({
          open: true,
          message: `Restart signal sent to ${pylonId}`,
          severity: "info",
        });
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Restart failed: ${err?.message || "Unknown error"}`,
          severity: "error",
        });
      }
    },
    [restartPylon],
  );

  const handleCheckPylonUpdates = useCallback(
    async (plugins) => {
      setPluginStates((prev) => {
        const next = { ...prev };
        for (const p of plugins) {
          const key = pluginKey(p.pylon_id, p.name);
          next[key] = { ...next[key], checking: true, checkError: false };
        }
        return next;
      });
      const results = await Promise.allSettled(
        plugins.map(async (plugin) => {
          const key = pluginKey(plugin.pylon_id, plugin.name);
          try {
            const result = await checkPlugin({
              pluginName: plugin.name,
            }).unwrap();
            if (result.ok) {
              setPluginStates((prev) => ({
                ...prev,
                [key]: {
                  ...prev[key],
                  checking: false,
                  repoVersion: result.repo_version,
                },
              }));
            } else {
              setPluginStates((prev) => ({
                ...prev,
                [key]: { ...prev[key], checking: false, checkError: true },
              }));
            }
            return { pluginName: plugin.name, ...result };
          } catch (err) {
            setPluginStates((prev) => ({
              ...prev,
              [key]: { ...prev[key], checking: false, checkError: true },
            }));
            return { pluginName: plugin.name, ok: false };
          }
        }),
      );
      const failed =
        results.filter((r) => r.status === "fulfilled" && !r.value.ok).length +
        results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        setSnackbar({
          open: true,
          message: `${failed} plugin(s) could not be checked`,
          severity: "warning",
        });
      } else {
        const updatable = results.filter((r) => {
          if (r.status !== "fulfilled" || !r.value.ok) return false;
          const plugin = plugins.find((p) => p.name === r.value.pluginName);
          return plugin && r.value.repo_version !== plugin.local_version;
        }).length;
        setSnackbar({
          open: true,
          message:
            updatable > 0
              ? `${updatable} update(s) available`
              : "All plugins are up to date",
          severity: updatable > 0 ? "info" : "success",
        });
      }
    },
    [checkPlugin],
  );

  const handleUpdatePlugin = useCallback(
    async (pluginName, pylonId) => {
      const key = pluginKey(pylonId, pluginName);
      setPluginStates((prev) => ({
        ...prev,
        [key]: { ...prev[key], updating: true },
      }));
      try {
        const result = await updatePlugin({
          pluginName,
          pylonIds: [pylonId],
        }).unwrap();
        if (result.ok) {
          setSnackbar({
            open: true,
            message: result.message,
            severity: "success",
          });
          setPluginStates((prev) => ({
            ...prev,
            [key]: { ...prev[key], updating: false, updated: true },
          }));
        } else {
          setSnackbar({
            open: true,
            message: result.error || "Update failed",
            severity: "error",
          });
          setPluginStates((prev) => ({
            ...prev,
            [key]: { ...prev[key], updating: false },
          }));
        }
      } catch (err) {
        setSnackbar({
          open: true,
          message: `Update failed: ${err?.data?.error || err?.message || "Unknown error"}`,
          severity: "error",
        });
        setPluginStates((prev) => ({
          ...prev,
          [key]: { ...prev[key], updating: false },
        }));
      }
    },
    [updatePlugin],
  );

  const handleUpdateAllPlugins = useCallback(
    async (pylonId, plugins) => {
      setUpdatingAllPylons((prev) => ({ ...prev, [pylonId]: true }));
      const names = plugins.map((p) => p.name);
      const results = await Promise.allSettled(
        names.map(async (name) => {
          const key = pluginKey(pylonId, name);
          setPluginStates((prev) => ({
            ...prev,
            [key]: { ...prev[key], updating: true },
          }));
          try {
            const result = await updatePlugin({
              pluginName: name,
              pylonIds: [pylonId],
            }).unwrap();
            if (result.ok) {
              setPluginStates((prev) => ({
                ...prev,
                [key]: { ...prev[key], updating: false, updated: true },
              }));
            } else {
              setPluginStates((prev) => ({
                ...prev,
                [key]: { ...prev[key], updating: false },
              }));
            }
            return { name, ok: result.ok };
          } catch (err) {
            setPluginStates((prev) => ({
              ...prev,
              [key]: { ...prev[key], updating: false },
            }));
            return { name, ok: false };
          }
        }),
      );
      const succeeded = results.filter(
        (r) => r.status === "fulfilled" && r.value.ok,
      ).length;
      const failed = names.length - succeeded;
      // Restart the pylon after updating all plugins
      try {
        await restartPylon({ pylonId }).unwrap();
        setPluginStates((prev) => {
          const next = { ...prev };
          for (const name of names) {
            const key = pluginKey(pylonId, name);
            if (next[key]) next[key] = { ...next[key], updated: false };
          }
          return next;
        });
      } catch {
        /* restart best-effort */
      }
      setUpdatingAllPylons((prev) => ({ ...prev, [pylonId]: false }));
      if (failed > 0) {
        setSnackbar({
          open: true,
          message: `Updated ${succeeded}/${names.length} plugins on ${pylonId} (${failed} failed), restart signal sent`,
          severity: "warning",
        });
      } else {
        setSnackbar({
          open: true,
          message: `All ${succeeded} plugins updated on ${pylonId}, restart signal sent`,
          severity: "success",
        });
      }
    },
    [updatePlugin, restartPylon],
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  if (isLoading) {
    return (
      <Box sx={styles.loading}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (pylonGroups.length === 0) {
    return (
      <Box sx={styles.loading}>
        <Typography variant="body2" color="text.metrics">
          No connected pylons found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={styles.root}>
      <Box sx={styles.topHeader}>
        <Typography variant="body2" sx={styles.description}>
          View and edit raw plugin configurations for all connected pylons.
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ClearAllOutlinedIcon sx={{ fontSize: "0.875rem" }} />}
          onClick={handleResetLocalState}
          sx={styles.resetButton}
        >
          Reset local state
        </Button>
      </Box>
      {pylonGroups.map(([pylonId, plugins]) => {
        const isCollapsed = !!collapsedPylons[pylonId];
        return (
          <Box key={pylonId} sx={styles.pylonGroup}>
            <Box sx={styles.pylonHeader}>
              <Box
                sx={styles.pylonHeaderLeft}
                onClick={() => togglePylon(pylonId)}
              >
                {isCollapsed ? (
                  <ExpandMoreIcon sx={styles.chevron} />
                ) : (
                  <ExpandLessIcon sx={styles.chevron} />
                )}
                <Typography variant="body2" sx={styles.pylonTitle}>
                  {pylonId}
                </Typography>
                <Chip
                  label={`${plugins.length} plugins`}
                  size="small"
                  variant="outlined"
                  sx={styles.countChip}
                />
              </Box>
              <Box sx={styles.pylonHeaderRight}>
                <Button
                  size="small"
                  startIcon={
                    <SettingsOutlinedIcon sx={{ fontSize: "0.875rem" }} />
                  }
                  onClick={() => handleOpenPylonConfig(pylonId)}
                  sx={styles.pylonConfigButton}
                >
                  Pylon Config
                </Button>
                <Button
                  size="small"
                  startIcon={
                    <ArticleOutlinedIcon sx={{ fontSize: "0.875rem" }} />
                  }
                  onClick={() => handleOpenLogsDrawer(pylonId)}
                  sx={styles.pylonConfigButton}
                >
                  Pylon Logs
                </Button>
                <Button
                  size="small"
                  startIcon={
                    plugins.some(
                      (p) =>
                        pluginStates[pluginKey(p.pylon_id, p.name)]?.checking,
                    ) ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <SearchOutlinedIcon sx={{ fontSize: "0.875rem" }} />
                    )
                  }
                  disabled={plugins.some(
                    (p) =>
                      pluginStates[pluginKey(p.pylon_id, p.name)]?.checking,
                  )}
                  onClick={() => handleCheckPylonUpdates(plugins)}
                  sx={styles.pylonConfigButton}
                >
                  Check Updates
                </Button>
                {ALWAYS_SHOW_PLUGIN_UPDATE && (
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    startIcon={
                      updatingAllPylons[pylonId] ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <CloudDownloadOutlinedIcon
                          sx={{ fontSize: "0.875rem" }}
                        />
                      )
                    }
                    disabled={!!updatingAllPylons[pylonId]}
                    onClick={() => handleUpdateAllPlugins(pylonId, plugins)}
                    sx={styles.pylonConfigButton}
                  >
                    Update all
                  </Button>
                )}
                <Button
                  size="small"
                  color="warning"
                  startIcon={<RestartAltIcon sx={{ fontSize: "0.875rem" }} />}
                  onClick={() => handleRestartPylon(pylonId, plugins)}
                  sx={styles.pylonConfigButton}
                >
                  Restart
                </Button>
              </Box>
            </Box>
            <Collapse in={!isCollapsed}>
              <Box sx={styles.tableHeader}>
                {COLUMNS.map((col) => (
                  <Typography
                    key={col.field}
                    variant="caption"
                    sx={styles.headerCell}
                  >
                    {col.label}
                  </Typography>
                ))}
              </Box>
              {plugins.map((plugin) => {
                const ps =
                  pluginStates[pluginKey(plugin.pylon_id, plugin.name)] || {};
                const hasUpdate =
                  ps.repoVersion &&
                  ps.repoVersion !== plugin.local_version &&
                  !ps.updated;
                const shouldShowUpdateButton =
                  hasUpdate || ALWAYS_SHOW_PLUGIN_UPDATE;
                return (
                  <Box key={plugin.name} sx={styles.tableRow}>
                    <Typography variant="body2" sx={styles.cell}>
                      {plugin.name}
                    </Typography>
                    <Typography variant="body2" sx={styles.cell}>
                      {plugin.local_version || "-"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        ...styles.cell,
                        ...(hasUpdate ? styles.versionHighlight : {}),
                      }}
                    >
                      {ps.repoVersion || "-"}
                    </Typography>
                    <Box sx={styles.cell}>
                      <Box sx={styles.statusDot(plugin.activated)} />
                    </Box>
                    <Box sx={styles.actionsCell}>
                      <Button
                        size="small"
                        startIcon={
                          <VisibilityOutlinedIcon
                            sx={{ fontSize: "0.875rem" }}
                          />
                        }
                        onClick={() => handleOpenDrawer(plugin)}
                        sx={styles.actionButton}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        startIcon={
                          <RefreshOutlinedIcon sx={{ fontSize: "0.875rem" }} />
                        }
                        onClick={() =>
                          handleReloadPlugin(plugin.pylon_id, plugin.name)
                        }
                        sx={styles.actionButton}
                      >
                        Reload
                      </Button>
                      {ps.checking || ps.updating ? (
                        <CircularProgress size={16} sx={{ mx: "0.5rem" }} />
                      ) : ps.updated ? (
                        <Chip
                          icon={
                            <CheckCircleOutlineIcon
                              sx={{ fontSize: "0.875rem" }}
                            />
                          }
                          label="Restart needed"
                          size="small"
                          color="warning"
                          sx={styles.updateChip}
                        />
                      ) : shouldShowUpdateButton ? (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={
                            <CloudDownloadOutlinedIcon
                              sx={{ fontSize: "0.875rem" }}
                            />
                          }
                          onClick={() =>
                            handleUpdatePlugin(plugin.name, plugin.pylon_id)
                          }
                          sx={styles.updateButton}
                        >
                          Update
                        </Button>
                      ) : ps.repoVersion && !ps.checkError ? (
                        <Chip
                          icon={
                            <CheckCircleOutlineIcon
                              sx={{ fontSize: "0.875rem" }}
                            />
                          }
                          label="Latest"
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={styles.updateChip}
                        />
                      ) : null}
                    </Box>
                  </Box>
                );
              })}
            </Collapse>
          </Box>
        );
      })}

      <PluginConfigDrawer
        open={!!drawerPlugin}
        plugin={drawerPlugin}
        onClose={handleCloseDrawer}
      />

      <PylonLogsDrawer
        open={!!logsPylonId}
        pylonId={logsPylonId}
        onClose={handleCloseLogsDrawer}
      />

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
    </Box>
  );
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    padding: "1.5rem",
  },
  topHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    marginBottom: "0.25rem",
  },
  description: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: "0.8125rem",
    lineHeight: 1.6,
  }),
  resetButton: {
    textTransform: "none",
    fontSize: "0.75rem",
    minWidth: 0,
    padding: "0.25rem 0.75rem",
    flexShrink: 0,
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  pylonGroup: ({ palette }) => ({
    border: `1px solid ${palette.border.table}`,
    borderRadius: "0.5rem",
    overflow: "hidden",
  }),
  pylonHeader: ({ palette }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.625rem 1rem",
    backgroundColor:
      palette.background.tabPanel || palette.background.userInputBackground,
  }),
  pylonHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    userSelect: "none",
    flex: 1,
    minWidth: 0,
  },
  chevron: {
    fontSize: "1.25rem",
    flexShrink: 0,
  },
  pylonTitle: {
    fontWeight: 600,
    fontSize: "0.8125rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  countChip: {
    fontSize: "0.625rem",
    height: "1.125rem",
    flexShrink: 0,
    "& .MuiChip-label": {
      padding: "0 0.375rem",
    },
  },
  pylonHeaderRight: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    flexShrink: 0,
    marginLeft: "0.5rem",
  },
  pylonConfigButton: {
    textTransform: "none",
    fontSize: "0.75rem",
    minWidth: 0,
    padding: "0.125rem 0.5rem",
    flexShrink: 0,
  },
  tableHeader: ({ palette }) => ({
    display: "grid",
    gridTemplateColumns: gridTemplate,
    padding: "0.375rem 1rem",
    borderBottom: `1px solid ${palette.border.table}`,
    backgroundColor: palette.background.userInputBackground,
  }),
  headerCell: ({ palette }) => ({
    fontSize: "0.6875rem",
    fontWeight: 600,
    color: palette.text.metrics,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    "&:last-child": {
      textAlign: "right",
    },
  }),
  tableRow: ({ palette }) => ({
    display: "grid",
    gridTemplateColumns: gridTemplate,
    padding: "0.5rem 1rem",
    alignItems: "center",
    borderBottom: `1px solid ${palette.border.table}`,
    "&:last-of-type": {
      borderBottom: "none",
    },
    "&:hover": {
      backgroundColor: palette.background.userInputBackground,
    },
  }),
  cell: {
    fontSize: "0.8125rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
  statusDot: (active) => ({
    width: "0.5rem",
    height: "0.5rem",
    borderRadius: "50%",
    backgroundColor: active ? "#4caf50" : "#9e9e9e",
  }),
  actionsCell: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    justifyContent: "flex-end",
  },
  actionButton: {
    textTransform: "none",
    fontSize: "0.75rem",
    minWidth: 0,
    padding: "0.125rem 0.5rem",
  },
  updateButton: {
    textTransform: "none",
    fontSize: "0.75rem",
    minWidth: 0,
    padding: "0.125rem 0.5rem",
    fontWeight: 600,
  },
  updateChip: {
    fontSize: "0.625rem",
    height: "1.25rem",
    "& .MuiChip-label": {
      padding: "0 0.375rem",
    },
    "& .MuiChip-icon": {
      fontSize: "0.75rem",
      marginLeft: "0.25rem",
    },
  },
  versionHighlight: {
    fontWeight: 600,
    color: "#ed6c02",
  },
};

export default memo(AdvancedSection);
