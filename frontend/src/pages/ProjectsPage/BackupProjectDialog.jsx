import { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { downloadProjectBackup } from "@/api/projectBackupApi";
import { useCheckPermission } from "@/hooks/useCheckPermission";
import { PERMISSIONS } from "@/constants/permissions";

const formatSize = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

function BackupProjectDialog({ open, onClose, project }) {
  const { hasPermission } = useCheckPermission();

  const [fullMode, setFullMode] = useState(false);
  const [excludeTables, setExcludeTables] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canFull = useMemo(
    () => hasPermission(PERMISSIONS.projects.backup.full),
    [hasPermission],
  );

  const reset = useCallback(() => {
    setFullMode(false);
    setExcludeTables("");
    setIsLoading(false);
    setError("");
    setSuccess("");
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    reset();
    onClose();
  }, [isLoading, reset, onClose]);

  const handleDownload = useCallback(async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      const result = await downloadProjectBackup({
        projectId: project?.id,
        mode: fullMode && canFull ? "full" : "safe",
        excludeTables: fullMode ? "" : excludeTables,
      });
      setSuccess(
        `Downloaded ${result.filename} (${formatSize(result.size)}).`,
      );
    } catch (err) {
      setError(err?.message ?? "Failed to download backup.");
    } finally {
      setIsLoading(false);
    }
  }, [project, fullMode, canFull, excludeTables]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Backup Project</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Download a copy of project <strong>{project?.name}</strong> (schema{" "}
          <code>p_{project?.id}</code>) as a backup file or restore it from a
          previously downloaded backup. The backup includes agents, pipelines,
          toolkits, MCP servers and skills. Credentials, tokens and other
          secrets will be excluded from this backup file and cannot be
          restored.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {!fullMode && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Safe mode: data only (INSERT statements), no DDL. Tokens, traces and
            conversation context are skipped, and credential-bearing columns and
            JSON keys are redacted. Vault references{" "}
            <code>{"{{secret.NAME}}"}</code> are kept, but the secret values are
            excluded from the backup.
          </Alert>
        )}

        <FormControlLabel
          control={
            <Checkbox
              checked={fullMode}
              onChange={(e) => setFullMode(e.target.checked)}
              disabled={isLoading || !canFull}
            />
          }
          label="Full backup (raw pg_dump of the whole schema)"
        />

        {!canFull && (
          <Typography variant="caption" color="text.metrics" sx={styles.hint}>
            Full backup requires the{" "}
            <code>projects.projects.backup.full</code> permission.
          </Typography>
        )}

        {fullMode && (
          <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
            The full backup is a plain <code>pg_dump</code> of the schema as-is:
            It includes DDL and all stored values, with all plaintext
            credentials, no redaction. Handle and store the file as a secret.
          </Alert>
        )}

        {!fullMode && (
          <TextField
            margin="dense"
            label="Exclude tables (optional)"
            fullWidth
            value={excludeTables}
            onChange={(e) => setExcludeTables(e.target.value)}
            disabled={isLoading}
            placeholder="table_one, table_two"
            helperText="Enter tables to exclude from the backup, separate them with commas."
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="text" disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleDownload}
          variant="contained"
          color={fullMode ? "warning" : "primary"}
          disabled={isLoading || !project?.id}
        >
          {isLoading ? "Preparing..." : "Download"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

BackupProjectDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }),
};

const styles = {
  hint: {
    display: "block",
    marginBottom: "0.5rem",
  },
};

export default BackupProjectDialog;
