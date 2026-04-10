import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DrawerPage from "@/components/DrawerPage";
import DrawerPageHeader from "@/components/DrawerPageHeader";
import SchemaForm from "@/components/SchemaForm/SchemaForm";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  useConfigSchemasQuery,
  useConfigValuesQuery,
  useConfigValuesSaveMutation,
  useConfigRestartMutation,
} from "@/api/configurationApi";
import { useTaskStartMutation } from "@/api/tasksApi";

function LiteLLMPage() {
  usePageTitle("LiteLLM");

  const [localValues, setLocalValues] = useState({});
  const [pendingRestarts, setPendingRestarts] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const serverValuesRef = useRef({});

  const { data: schemasData, isLoading: schemasLoading } =
    useConfigSchemasQuery();
  const litellmSection = useMemo(
    () => schemasData?.sections?.find((s) => s.id === "litellm"),
    [schemasData],
  );

  const { data: valuesData, isFetching: valuesFetching } = useConfigValuesQuery(
    { sectionId: "litellm" },
    { skip: !litellmSection, refetchOnMountOrArgChange: true },
  );

  useEffect(() => {
    if (valuesData?.values) {
      serverValuesRef.current = valuesData.values;
      setLocalValues(valuesData.values);
    }
  }, [valuesData]);

  const [saveValues, { isLoading: saving }] = useConfigValuesSaveMutation();
  const [restartPylon, { isLoading: restarting }] = useConfigRestartMutation();
  const [startTask] = useTaskStartMutation();

  const isDirty = useMemo(() => {
    return (
      JSON.stringify(localValues) !== JSON.stringify(serverValuesRef.current)
    );
  }, [localValues]);

  const fields = litellmSection?.fields || [];
  const sectionDescription = litellmSection?.description || "";

  const handleFieldChange = useCallback((key, value) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleDiscard = useCallback(() => {
    setLocalValues(serverValuesRef.current);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const result = await saveValues({
        sectionId: "litellm",
        values: localValues,
      }).unwrap();

      // Update server baseline immediately so isDirty resets without
      // waiting for the async re-fetch (remote_runtimes cache may be stale).
      serverValuesRef.current = localValues;
      setLocalValues({ ...localValues });

      if (result.requires_restart?.length > 0) {
        const normalized = result.requires_restart.map((r) =>
          typeof r === "string" ? { pylon_id: r, plugins: [] } : r,
        );
        setPendingRestarts(normalized);
        const summary = normalized
          .map((r) =>
            r.plugins?.length
              ? `${r.plugins.join(", ")} on ${r.pylon_id}`
              : r.pylon_id,
          )
          .join("; ");
        setSnackbar({
          open: true,
          message: `Configuration saved. Reload required: ${summary}`,
          severity: "warning",
        });
      } else {
        setPendingRestarts([]);
        setSnackbar({
          open: true,
          message: "Configuration saved successfully",
          severity: "success",
        });
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to save: ${err?.data?.error || err?.message || "Unknown error"}`,
        severity: "error",
      });
    }
  }, [localValues, saveValues]);

  const handleReload = useCallback(
    async (pylonId, plugins) => {
      try {
        await restartPylon({ pylonId, plugins }).unwrap();
        setPendingRestarts((prev) =>
          prev.filter((r) => r.pylon_id !== pylonId),
        );
        const label = plugins?.length
          ? `Reload signal sent for ${plugins.join(", ")} on ${pylonId}`
          : `Restart signal sent to ${pylonId}`;
        setSnackbar({ open: true, message: label, severity: "info" });
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

  const handleAction = useCallback(
    async (field) => {
      const taskName = field.action_task;
      if (!taskName) return;
      const result = await startTask({ name: taskName, param: "_" }).unwrap();
      if (result.ok === false) {
        throw new Error(result.error || "Task failed to start");
      }
      setSnackbar({
        open: true,
        message: `Task "${taskName}" started`,
        severity: "info",
      });
    },
    [startTask],
  );

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  if (schemasLoading) {
    return (
      <DrawerPage>
        <DrawerPageHeader title="LiteLLM" showBorder />
        <Box sx={styles.loadingContainer}>
          <CircularProgress size={32} />
        </Box>
      </DrawerPage>
    );
  }

  if (!litellmSection) {
    return (
      <DrawerPage>
        <DrawerPageHeader title="LiteLLM" showBorder />
        <Box sx={styles.emptyContainer}>
          <Typography variant="body2" color="text.metrics">
            LiteLLM configuration is not available. The runtime_engine_litellm
            plugin may not be running.
          </Typography>
        </Box>
      </DrawerPage>
    );
  }

  return (
    <DrawerPage sx={{ overflow: "hidden" }}>
      <DrawerPageHeader title="LiteLLM" showBorder />

      <Box sx={styles.content}>
        {valuesFetching ? (
          <Box sx={styles.loadingContainer}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box sx={styles.formScroll}>
            <SchemaForm
              fields={fields}
              values={localValues}
              sectionDescription={sectionDescription}
              onChange={handleFieldChange}
              onAction={handleAction}
            />
          </Box>
        )}

        <Box sx={styles.actionBar}>
          <Box sx={styles.actionButtons}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleDiscard}
              disabled={!isDirty || saving}
              sx={styles.discardButton}
            >
              Discard
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleSave}
              disabled={!isDirty || saving}
              sx={styles.saveButton}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </Box>

          {pendingRestarts.length > 0 && (
            <Box sx={styles.restartBar}>
              <Typography variant="caption" sx={styles.restartLabel}>
                Reload required:
              </Typography>
              {pendingRestarts.map((entry) => (
                <Button
                  key={entry.pylon_id}
                  size="small"
                  variant="outlined"
                  color="warning"
                  startIcon={<RestartAltIcon sx={{ fontSize: "0.875rem" }} />}
                  onClick={() => handleReload(entry.pylon_id, entry.plugins)}
                  disabled={restarting}
                  sx={styles.restartButton}
                >
                  {entry.plugins?.length
                    ? entry.plugins.join(", ")
                    : entry.pylon_id}
                </Button>
              ))}
            </Box>
          )}
        </Box>
      </Box>

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
    </DrawerPage>
  );
}

const styles = {
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  formScroll: {
    flex: 1,
    overflowY: "auto",
    padding: "1.5rem",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  emptyContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: "3rem",
  },
  actionBar: ({ palette }) => ({
    borderTop: `1px solid ${palette.border.table}`,
    padding: "0.75rem 1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap",
  }),
  actionButtons: {
    display: "flex",
    gap: "0.5rem",
  },
  discardButton: {
    textTransform: "none",
    fontSize: "0.8125rem",
  },
  saveButton: {
    textTransform: "none",
    fontSize: "0.8125rem",
  },
  restartBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  restartLabel: ({ palette }) => ({
    color: palette.warning?.main || palette.text.metrics,
    fontWeight: 500,
  }),
  restartButton: {
    textTransform: "none",
    fontSize: "0.75rem",
  },
};

export default LiteLLMPage;
