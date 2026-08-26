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

const HEADER_SCAN_BYTES = 65536;
const PG_DUMP_MARKERS = [
  "-- PostgreSQL database dump",
  "SET statement_timeout",
  "pg_dump version",
];
const HEADER_MARKER = "-- ELITEA project backup";
const HEADER_LINE_RE = /^--\s*(project_id|project_name|schema|mode|generated_at):\s*(.*?)\s*$/;

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

const inspectArtifact = (head) => {
  const info = { kind: null };

  if (PG_DUMP_MARKERS.some((marker) => head.includes(marker))) {
    info.kind = "pg_dump";
  } else if (head.includes(HEADER_MARKER) || head.toUpperCase().includes("INSERT INTO")) {
    info.kind = "safe";
  }

  head.split("\n").forEach((line) => {
    const match = HEADER_LINE_RE.exec(line.trim());
    if (match && info[match[1]] === undefined) {
      info[match[1]] = match[2];
    }
  });

  if (info.project_id !== undefined) {
    const parsed = Number.parseInt(info.project_id, 10);
    if (!Number.isNaN(parsed)) info.project_id = parsed;
  }

  return info;
};

function RestoreProjectDialog({ open, onClose, project }) {
  const { hasPermission } = useCheckPermission();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [artifact, setArtifact] = useState(null);
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

  const isPgDump = artifact?.kind === "pg_dump";
  const isMismatch =
    typeof artifact?.project_id === "number" &&
    project?.id != null &&
    artifact.project_id !== project.id;

  const reset = useCallback(() => {
    setFile(null);
    setArtifact(null);
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

  const handleFileChange = useCallback(async (event) => {
    const selected = event.target.files?.[0] ?? null;
    setError("");
    setResult(null);
    setFile(selected);
    setArtifact(null);
    if (!selected) return;
    try {
      const head = await selected.slice(0, HEADER_SCAN_BYTES).text();
      const info = inspectArtifact(head);
      setArtifact(info);
      if (!info.kind) {
        setError("This file does not look like an ELITEA project backup.");
      }
    } catch {
      setError("Could not read the selected file.");
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    setError("");
    setResult(null);
    try {
      const response = await restoreProject({
        projectId: project?.id,
        file,
        tables: isPgDump ? "" : tables,
        includeParents: !isPgDump && !!tables.trim() && includeParents,
        truncate,
        dryRun,
        allowProjectMismatch: allowMismatch,
      }).unwrap();
      setResult(response);
    } catch (err) {
      const message = err?.data?.error ?? err?.error ?? "Restore failed.";
      const detail = err?.data?.detail;
      setError(detail ? `${message}: ${detail}` : message);
      if (err?.data?.result) setResult(err.data);
    }
  }, [
    restoreProject,
    project,
    file,
    isPgDump,
    tables,
    includeParents,
    truncate,
    dryRun,
    allowMismatch,
  ]);

  const summary = result?.result;
  const blockedByPermission = isPgDump && !canFull;
  const blockedByMismatch = isMismatch && !allowMismatch;

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
            accept=".sql,text/plain,application/sql"
            hidden
            onChange={handleFileChange}
          />
        </Box>

        {artifact?.kind && (
          <Alert
            severity={isPgDump ? "warning" : "info"}
            sx={{ mt: 2, mb: 1 }}
          >
            {isPgDump ? (
              <>
                Raw <code>pg_dump</code> artifact. It is piped to{" "}
                <code>psql</code> as-is (DDL included) and cannot be restored
                partially.
              </>
            ) : (
              <>Safe backup (INSERT statements only, applied in one transaction).</>
            )}
            {artifact.project_name || artifact.project_id !== undefined ? (
              <Box component="div" sx={styles.artifactMeta}>
                source: {artifact.project_name ?? "-"}
                {artifact.project_id !== undefined
                  ? ` (project ${artifact.project_id})`
                  : ""}
                {artifact.generated_at ? ` · ${artifact.generated_at}` : ""}
              </Box>
            ) : null}
          </Alert>
        )}

        {blockedByPermission && (
          <Alert severity="error" sx={{ mb: 1 }}>
            Restoring a raw <code>pg_dump</code> requires the{" "}
            <code>projects.projects.restore.full</code> permission.
          </Alert>
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

        {!isPgDump && (
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

        {!isPgDump && !!tables.trim() && (
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
                disabled={isLoading || isPgDump}
              />
            }
            label="Empty target tables first (TRUNCATE ... CASCADE)"
          />
        </Box>

        {truncate && !isPgDump && (
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
            ) : (
              <Box component="pre" sx={styles.output}>
                {`exit code ${summary.return_code}, ${formatSize(summary.bytes_sent)} sent\n${summary.stderr || summary.stdout || ""}`.trim()}
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
          disabled={
            isLoading ||
            !file ||
            !artifact?.kind ||
            blockedByPermission ||
            blockedByMismatch
          }
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
