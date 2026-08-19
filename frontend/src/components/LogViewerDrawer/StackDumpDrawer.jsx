import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CameraAltOutlined from "@mui/icons-material/CameraAltOutlined";

import { useTaskDumpMutation } from "@/api/tasksApi";
import LogViewerDrawer from "./LogViewerDrawer";

// A single dump only shows where the task is; two consecutive dumps show
// whether it is moving. The verdict comes from the owning pylon.
const VERDICT_CONFIG = {
  stuck: {
    label: "Stuck",
    color: "error",
    hint: "Identical stack across two samples — the task is not progressing.",
  },
  waiting_on_io: {
    label: "Waiting on I/O",
    color: "info",
    hint: "Parked in a blocking socket read — normal while streaming, suspicious if it never ends.",
  },
  stuck_in_library: {
    label: "Stuck in library",
    color: "warning",
    hint: "Same application frames, only runtime internals moved.",
  },
  spinning: {
    label: "Spinning",
    color: "info",
    hint: "Stack changed between samples — the task is still executing.",
  },
  unknown: {
    label: "Single sample",
    color: "default",
    hint: "Press Dump again to compare and classify progress.",
  },
};

const MODE_LABELS = {
  process: "Forked process (SIGUSR1)",
  thread: "In-process thread",
};

function formatDumpText(reply) {
  if (!reply) return "";
  if (!reply.ok) return "";

  const sections = [];
  const header = [
    `Task:    ${reply.task_id || "—"}`,
    `Node:    ${reply.node || "—"}`,
    `Pylon:   ${reply.pylon_id || "—"}`,
    `Mode:    ${MODE_LABELS[reply.mode] || reply.mode || "—"}`,
  ];
  if (reply.pid) header.push(`PID:     ${reply.pid}`);
  if (reply.verdict) header.push(`Verdict: ${reply.verdict}`);
  sections.push(header.join("\n"));

  sections.push(`${"=".repeat(72)}\nCURRENT STACK\n${"=".repeat(72)}`);
  sections.push(reply.dump || "(empty)");

  if (reply.previous_dump) {
    sections.push(
      `${"=".repeat(72)}\nPREVIOUS STACK (earlier sample)\n${"=".repeat(72)}`,
    );
    sections.push(reply.previous_dump);
  }

  return sections.join("\n\n");
}

const StackDumpDrawer = memo((props) => {
  const { open, taskId, onClose } = props;
  const [requestDump, { isLoading }] = useTaskDumpMutation();
  const [reply, setReply] = useState(null);
  const [failure, setFailure] = useState(null);

  const capture = useCallback(
    async (id) => {
      if (!id) return;
      setFailure(null);
      try {
        const result = await requestDump({ taskId: id }).unwrap();
        if (result?.ok) {
          setReply(result);
        } else {
          setReply(null);
          setFailure(result?.error || "Dump failed");
        }
      } catch (err) {
        setReply(null);
        setFailure(err?.data?.error || err?.error || "Dump request failed");
      }
    },
    [requestDump],
  );

  // Auto-capture on open so the first press of the button is one click.
  useEffect(() => {
    if (!open) return;
    setReply(null);
    setFailure(null);
    capture(taskId);
  }, [open, taskId, capture]);

  const handleDumpAgain = useCallback(() => capture(taskId), [capture, taskId]);

  const dumpText = useMemo(() => formatDumpText(reply), [reply]);

  const verdict = reply?.ok ? VERDICT_CONFIG[reply.verdict] : null;

  const headerExtra = reply?.ok ? (
    <Chip
      label={MODE_LABELS[reply.mode] || reply.mode}
      size="small"
      variant="outlined"
      sx={styles.modeChip}
    />
  ) : null;

  const metaBar = (
    <Box sx={styles.metaBar}>
      {verdict && (
        <Tooltip title={verdict.hint}>
          <Chip
            label={verdict.label}
            size="small"
            color={verdict.color}
            variant="outlined"
          />
        </Tooltip>
      )}
      {reply?.ok && (
        <>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={styles.metaItem}
          >
            Node: {reply.node}
          </Typography>
          {reply.pid && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={styles.metaItem}
            >
              PID: {reply.pid}
            </Typography>
          )}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={styles.metaItem}
          >
            {reply.dump_count === 1
              ? "1 sample"
              : `${reply.dump_count} samples`}
          </Typography>
        </>
      )}
      {verdict && (
        <Typography variant="body2" color="text.metrics" sx={styles.hintText}>
          {verdict.hint}
        </Typography>
      )}
    </Box>
  );

  const footerExtra = (
    <Button
      size="small"
      variant="outlined"
      startIcon={
        isLoading ? (
          <CircularProgress size={12} />
        ) : (
          <CameraAltOutlined sx={{ fontSize: "0.875rem" }} />
        )
      }
      onClick={handleDumpAgain}
      disabled={isLoading || !taskId}
      sx={styles.actionButton}
    >
      Dump again
    </Button>
  );

  const placeholder = failure
    ? failure
    : isLoading
      ? "Capturing stack..."
      : "No stack captured.";

  return (
    <LogViewerDrawer
      open={open}
      onClose={onClose}
      title="Task Stack Dump"
      subtitle={taskId}
      logs={dumpText}
      loading={isLoading && !reply}
      placeholder={placeholder}
      downloadFilename={`task-stack-${taskId || "unknown"}`}
      headerExtra={headerExtra}
      metaBar={metaBar}
      footerExtra={footerExtra}
      showLevelFilter={false}
    />
  );
});

const styles = {
  modeChip: {
    fontSize: "0.6875rem",
    height: "1.25rem",
    flexShrink: 0,
  },
  metaBar: ({ palette }) => ({
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.5rem 1.5rem",
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    backgroundColor:
      palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
    flexWrap: "wrap",
  }),
  metaItem: {
    fontSize: "0.75rem",
    whiteSpace: "nowrap",
  },
  hintText: {
    fontSize: "0.75rem",
    marginLeft: "auto",
  },
  actionButton: {
    textTransform: "none",
    fontSize: "0.8125rem",
  },
};

export default StackDumpDrawer;
