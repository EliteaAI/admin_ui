import { useCallback, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";

import { useProjectRestoreMutation } from "@/api/projectBackupApi";
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

function RestoreProjectDialog({ open, onClose, project }) {
  const { hasPermission } = useCheckPermission();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [artifact, setArtifact] = useState(null);
  const [fullMode, setFullMode] = useState(false);
  const [tables, setTables] = useState("");
  const [includeParents, setIncludeParents] = useState(true);
  const [truncate, setTruncate] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [allowMismatch, setAllowMismatch] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [restoreProject, { isLoading }] = useProjectRestoreMutation();

  const canFull = useMemo(
    () => hasPermission(PERMISSIONS.projects.restore.full),
    [hasPermission],
  );

  // The backend recognizes the uploaded file and reports what it found in
  // "artifact"; the dialog only picks the mode and reacts to that answer.
  const isMismatch =
    typeof artifact?.project_id === "number" &&
    project?.id != null &&
    artifact.project_id !== project.id;

  const reset = useCallback(() => {
    setFile(null);
    setArtifact(null);
    setFullMode(false);
    setTables("");
    setIncludeParents(true);
    setTruncate(false);
    setDryRun(true);
    setAllowMismatch(false);
    setError("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    reset();
    onClose();
  }, [isLoading, reset, onClose]);

  const handleFileChange = useCallback((event) => {
    setError("");
    setResult(null);
    setArtifact(null);
    setAllowMismatch(false);
    setFile(event.target.files?.[0] ?? null);
  }, []);

  const handleSubmit = useCallback(async () => {
    setError("");
    setResult(null);
    try {
      const response = await restoreProject({
        projectId: project?.id,
        file,
        mode: fullMode && canFull ? "full" : "safe",
        tables: fullMode ? "" : tables,
        includeParents: !fullMode && !!tables.trim() && includeParents,
        truncate,
        dryRun,
        allowProjectMismatch: allowMismatch,
      }).unwrap();
      setResult(response);
      if (response?.artifact) setArtifact(response.artifact);
    } catch (err) {
      const message = err?.data?.error ?? err?.error ?? "Restore failed.";
      const detail = err?.data?.detail;
      setError(detail ? `${message}: ${detail}` : message);
      // A project mismatch comes back as 409 with the artifact the backend read,
      // so the confirmation checkbox below can be offered
      if (err?.data?.artifact) setArtifact(err.data.artifact);
      if (err?.data?.result) setResult(err.data);
    }
  }, [
    restoreProject,
    project,
    file,
    fullMode,
    canFull,
    tables,
    includeParents,
    truncate,
    dryRun,
    allowMismatch,
  ]);

  const summary = result?.result;
  const blockedByMismatch = isMismatch && !allowMismatch;

  // A backup taken before a migration carries columns this project no longer
  // has; the backend drops them and lists them per table
  const droppedColumns = useMemo(
    () =>
      Object.entries(summary?.dropped_columns ?? {}).flatMap(([table, columns]) =>
        columns.map((column) => `${table}.${column}`),
      ),
    [summary],
  );

  // The reverse drift: this project requires a column the backup has no value
  // for, so the backend restored it empty
  const filledColumns = useMemo(
    () =>
      Object.entries(summary?.filled_columns ?? {}).flatMap(([table, columns]) =>
        columns.map((column) => `${table}.${column}`),
      ),
    [summary],
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Restore Project</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Restore a backup into project <strong>{project?.name}</strong> (schema{" "}
          <code>p_{project?.id}</code>).
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={styles.filePicker}>
          <Button
            variant="outlined"
            startIcon={<UploadFileOutlined />}
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
          >
            Choose backup file
          </Button>
          <Typography variant="body2" color="text.secondary" sx={styles.fileName}>
            {file ? `${file.name} (${formatSize(file.size)})` : "No file selected"}
          </Typography>
          <input
            ref={inputRef}
            type="file"
            accept=".enc,.sql,text/plain,application/sql,application/octet-stream"
            hidden
            onChange={handleFileChange}
          />
        </Box>

        <Box sx={styles.options}>
          <FormControlLabel
            control={
              <Checkbox
                checked={fullMode}
                onChange={(e) => setFullMode(e.target.checked)}
                disabled={isLoading || !canFull}
              />
            }
            label="Full restore (raw pg_dump piped to psql)"
          />
          {!canFull && (
            <Typography variant="caption" color="text.secondary">
              Requires the <code>projects.projects.restore.full</code>{" "}
              permission. Without it only safe (redacted) backups can be
              restored.
            </Typography>
          )}
        </Box>

        {fullMode && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            The uploaded file is piped to <code>psql</code> as-is (DDL
            included), cannot be restored partially, and is rejected if it is
            not a raw <code>pg_dump</code>.
          </Alert>
        )}

        {artifact?.kind && (
          <Box component="div" sx={styles.artifactMeta}>
            {artifact.kind === "pg_dump" ? "raw pg_dump" : "redacted backup"}
            {" · source: "}
            {artifact.project_name ?? "-"}
            {artifact.project_id !== undefined
              ? ` (project ${artifact.project_id})`
              : ""}
            {artifact.generated_at ? ` · ${artifact.generated_at}` : ""}
          </Box>
        )}

        {isMismatch && (
          <>
            <Alert severity="warning" sx={{ mb: 1 }}>
              This backup was taken from project {artifact.project_id}, not{" "}
              {project?.id}. Restoring it here mixes data between projects.
            </Alert>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allowMismatch}
                  onChange={(e) => setAllowMismatch(e.target.checked)}
                  disabled={isLoading}
                />
              }
              label={`Restore it into project ${project?.id} anyway`}
            />
          </>
        )}

        {!fullMode && (
          <TextField
            margin="dense"
            label="Tables (optional)"
            fullWidth
            value={tables}
            onChange={(e) => setTables(e.target.value)}
            disabled={isLoading}
            placeholder="table_one, table_two"
            helperText="Comma-separated. Empty restores the whole backup."
          />
        )}

        {!fullMode && !!tables.trim() && (
          <FormControlLabel
            control={
              <Checkbox
                checked={includeParents}
                onChange={(e) => setIncludeParents(e.target.checked)}
                disabled={isLoading}
              />
            }
            label="Also restore referenced parent tables"
          />
        )}

        <Box sx={styles.options}>
          <FormControlLabel
            control={
              <Checkbox
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                disabled={isLoading}
              />
            }
            label="Dry run (apply in a transaction, then roll back)"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={truncate}
                onChange={(e) => setTruncate(e.target.checked)}
                disabled={isLoading || fullMode}
              />
            }
            label="Empty target tables first (TRUNCATE ... CASCADE)"
          />
        </Box>

        {truncate && !fullMode && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            Existing rows in the affected tables are deleted before the backup is
            applied, and <code>CASCADE</code> removes rows referencing them.
            Without this option rows are merged (<code>ON CONFLICT DO NOTHING</code>).
          </Alert>
        )}

        {summary && (
          <Alert
            severity={result?.ok ? "success" : "warning"}
            sx={{ mt: 1 }}
          >
            <Box component="div" sx={styles.summaryTitle}>
              {summary.dry_run ? "Dry run finished" : "Restore applied"}
              {summary.mode ? ` (${summary.mode})` : ""}
            </Box>
            {summary.statements !== undefined ? (
              <>
                <Box component="div" sx={styles.summaryBody}>
                  {summary.statements} statements, {summary.total_rows} rows into{" "}
                  {summary.applied_tables?.length ?? 0} tables
                  {summary.truncated_tables?.length
                    ? ` · truncated ${summary.truncated_tables.length}`
                    : ""}
                  {summary.skipped_tables?.length
                    ? ` · skipped ${summary.skipped_tables.join(", ")}`
                    : ""}
                </Box>
                {droppedColumns.length > 0 && (
                  <Box component="div" sx={styles.summaryBody}>
                    Columns missing in this project were dropped:{" "}
                    {droppedColumns.join(", ")}
                    {summary.dropped_values
                      ? ` (${summary.dropped_values} values not restored)`
                      : ""}
                  </Box>
                )}
                {filledColumns.length > 0 && (
                  <Box component="div" sx={styles.summaryBody}>
                    Columns this project requires were restored empty:{" "}
                    {filledColumns.join(", ")}
                  </Box>
                )}
              </>
            ) : (
              <Box component="pre" sx={styles.output}>
                {`exit code ${summary.return_code}, ${formatSize(summary.bytes_sent)} sent${
                  summary.dropped_settings?.length
                    ? `\ndropped settings unsupported by the server: ${summary.dropped_settings.join(", ")}`
                    : ""
                }\n${summary.stderr || summary.stdout || ""}`.trim()}
              </Box>
            )}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} variant="text" disabled={isLoading}>
          Close
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={dryRun ? "primary" : "warning"}
          disabled={isLoading || !file || blockedByMismatch}
        >
          {isLoading ? "Restoring..." : dryRun ? "Run dry run" : "Restore"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

RestoreProjectDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  project: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }),
};

const styles = {
  filePicker: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  fileName: {
    fontSize: "0.75rem",
    fontFamily: "monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  artifactMeta: {
    fontSize: "0.6875rem",
    fontFamily: "monospace",
    marginTop: "0.25rem",
  },
  options: {
    display: "flex",
    flexDirection: "column",
    marginTop: "0.25rem",
  },
  summaryTitle: {
    fontWeight: 600,
  },
  summaryBody: {
    fontSize: "0.75rem",
    marginTop: "0.25rem",
  },
  output: {
    fontSize: "0.6875rem",
    fontFamily: "monospace",
    whiteSpace: "pre-wrap",
    margin: "0.25rem 0 0",
    maxHeight: "10rem",
    overflow: "auto",
  },
};

export default RestoreProjectDialog;
