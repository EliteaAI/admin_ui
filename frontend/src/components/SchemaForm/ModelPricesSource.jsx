import { memo, useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
  Snackbar,
  Typography,
} from "@mui/material";

import { useCheckPermission } from "@/hooks/useCheckPermission";
import { PERMISSIONS } from "@/constants/permissions";
import {
  useModelPriceSourcesQuery,
  useModelPriceReimportMutation,
} from "@/api/modelPricesApi";

const SOURCE_LABELS = {
  litellm: "LiteLLM",
  azure_foundry: "Azure AI Foundry",
  bedrock: "AWS Bedrock",
};

const sourceLabel = (id) => SOURCE_LABELS[id] || id;

const ModelPricesSource = memo(() => {
  const { hasPermission } = useCheckPermission();
  const canReimport = useMemo(
    () => hasPermission(PERMISSIONS.modelPrices.reimport),
    [hasPermission],
  );

  const [selected, setSelected] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { data: sourcesData } = useModelPriceSourcesQuery(undefined, {
    skip: !canReimport,
  });
  const [reimport, { isLoading }] = useModelPriceReimportMutation();

  const sources = sourcesData?.sources || [];
  const activeSource = sourcesData?.active || "";
  const selectedSource = selected || activeSource;
  const label = sourceLabel(selectedSource);

  const handleReimport = useCallback(async () => {
    setError("");
    try {
      const result = await reimport({ source_id: selectedSource }).unwrap();
      const counts = result?.counts || {};
      setConfirmOpen(false);
      setSnackbar({
        open: true,
        message:
          `Prices re-imported from ${label} ` +
          `(${counts.deleted ?? 0} removed, ${counts.inserted ?? 0} imported). ` +
          "Restart the pylons to apply the change to cost estimation.",
        severity: "warning",
      });
    } catch (err) {
      setError(
        err?.data?.error ??
          err?.data?.message ??
          err?.error ??
          "Failed to re-import prices.",
      );
    }
  }, [selectedSource, label, reimport]);

  const handleCloseSnackbar = useCallback(
    () => setSnackbar((prev) => ({ ...prev, open: false })),
    [],
  );

  if (!canReimport) {
    return (
      <Box sx={styles.root}>
        <Typography variant="body2" sx={styles.description}>
          You do not have permission to change the model prices source.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={styles.root}>
      <Typography variant="body2" sx={styles.description}>
        Choose the upstream catalog that model prices are imported from. The
        active source also feeds the scheduled price refresh. Importing is
        destructive: it deletes all current prices, including custom overrides,
        and replaces them with a fresh import from the chosen source.
      </Typography>

      <Box sx={styles.card}>
        <Box sx={styles.cardRow}>
          <Box sx={[styles.cardLabel, { width: "100%" }]}>
            <Typography variant="body2" sx={styles.cardTitle}>
              Import From
            </Typography>
            <Typography variant="caption" sx={styles.cardHint}>
              {activeSource
                ? `Currently active source: ${sourceLabel(activeSource)}.`
                : "No active source configured yet."}
            </Typography>
            <Select
              size="small"
              value={selectedSource}
              onChange={(event) => setSelected(event.target.value)}
              sx={styles.select}
              fullWidth
            >
              {sources.map((s) => (
                <MenuItem key={s} value={s}>
                  {sourceLabel(s)}
                </MenuItem>
              ))}
            </Select>
            <Box sx={styles.actionRow}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={!selectedSource}
                onClick={() => {
                  setError("");
                  setConfirmOpen(true);
                }}
              >
                Import
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Re-import model prices</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will <strong>delete all current model prices</strong>,
            including custom overrides, and replace them with a fresh import
            from <strong>{label}</strong>. This cannot be undone.
          </Alert>
          <DialogContentText>
            The import runs against the source first — if it returns nothing,
            the current prices are left unchanged.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            variant="text"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleReimport}
            variant="contained"
            color="error"
            disabled={isLoading}
          >
            {isLoading ? "Re-importing..." : "Delete & re-import"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={10000}
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
});

ModelPricesSource.displayName = "ModelPricesSource";

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
  actionRow: {
    marginTop: "0.75rem",
  },
};

export default ModelPricesSource;
