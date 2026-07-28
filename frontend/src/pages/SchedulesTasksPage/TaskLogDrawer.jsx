import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

import CloseOutlined from "@mui/icons-material/CloseOutlined";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import FullscreenOutlined from "@mui/icons-material/FullscreenOutlined";
import FullscreenExitOutlined from "@mui/icons-material/FullscreenExitOutlined";
import KeyboardArrowUpOutlined from "@mui/icons-material/KeyboardArrowUpOutlined";
import KeyboardArrowDownOutlined from "@mui/icons-material/KeyboardArrowDownOutlined";

import CodeMirror from "@uiw/react-codemirror";
import { vscodeDarkInit, vscodeLightInit } from "@uiw/codemirror-theme-vscode";
import { EditorView } from "@codemirror/view";

import { useTaskLogSocket } from "@/hooks/useTaskLogSocket";

const COMPLETION_DELAY_SEC = 15;

const TaskLogDrawer = memo(function TaskLogDrawer({
  open,
  taskId,
  taskMeta,
  onClose,
}) {
  const { logs, connected, clearLogs } = useTaskLogSocket(taskId, open);
  const editorViewRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const cmTheme = useMemo(
    () =>
      isDark
        ? vscodeDarkInit({
            settings: {
              background: "#1a1a2e",
              gutterBackground: "#1a1a2e",
            },
          })
        : vscodeLightInit({
            settings: {
              background: "#f5f5f5",
              gutterBackground: "#f5f5f5",
            },
          }),
    [isDark],
  );

  const cmExtensions = useMemo(
    () => [EditorView.editable.of(false), EditorView.lineWrapping],
    [],
  );

  const logText = useMemo(() => logs.join("\n"), [logs]);

  useEffect(() => {
    if (!autoScroll || !editorViewRef.current) return;
    const view = editorViewRef.current;
    view.dispatch({
      effects: EditorView.scrollIntoView(view.state.doc.length),
    });
  }, [logText, autoScroll]);

  useEffect(() => {
    clearLogs();
    setAutoScroll(true);
  }, [taskId, clearLogs]);

  const taskStatus = taskMeta?.status || "";
  const isFinished = ["done", "finished", "error", "stopped"].includes(
    taskStatus.toLowerCase(),
  );
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!open || !isFinished) {
      setCountdown(0);
      return;
    }
    setCountdown(COMPLETION_DELAY_SEC);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open, isFinished, taskId, onClose]);

  const handleScrollTop = useCallback(() => {
    setAutoScroll(false);
    const view = editorViewRef.current;
    if (view) {
      view.dispatch({ effects: EditorView.scrollIntoView(0) });
    }
  }, []);

  const handleScrollBottom = useCallback(() => {
    setAutoScroll(true);
    const view = editorViewRef.current;
    if (view) {
      view.dispatch({
        effects: EditorView.scrollIntoView(view.state.doc.length),
      });
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!logs.length) return;
    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `task-logs-${taskId || "unknown"}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [logs, taskId]);

  const handleEditorCreate = useCallback((view) => {
    editorViewRef.current = view;
  }, []);

  const hasLogs = logs.length > 0;

  const statusLabel = taskStatus
    ? taskStatus.charAt(0).toUpperCase() + taskStatus.slice(1).toLowerCase()
    : "Unknown";

  const statusColor = (() => {
    const s = taskStatus.toLowerCase();
    if (s === "running") return "success";
    if (s === "error") return "error";
    if (s === "stopped") return "warning";
    return "default";
  })();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={styles.drawer(fullscreen)}
    >
      <Box sx={styles.root}>
        <Box sx={styles.header}>
          <Box sx={styles.headerLeft}>
            <Typography variant="h6" sx={styles.title}>
              Task Logs
            </Typography>
            <Box sx={styles.headerMeta}>
              {taskId && (
                <Typography
                  variant="body2"
                  color="text.metrics"
                  sx={styles.taskIdText}
                >
                  {taskId}
                </Typography>
              )}
              <Chip
                label={connected ? "Live" : hasLogs ? "Cached" : "Connecting"}
                size="small"
                color={connected ? "success" : "default"}
                variant="outlined"
                sx={styles.statusChip}
              />
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: "0.25rem" }}>
            <Tooltip title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
              <IconButton size="small" onClick={() => setFullscreen((f) => !f)}>
                {fullscreen ? (
                  <FullscreenExitOutlined fontSize="small" />
                ) : (
                  <FullscreenOutlined fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={onClose}>
              <CloseOutlined fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {taskMeta && (
          <Box sx={styles.metaBar}>
            <Chip
              label={statusLabel}
              size="small"
              color={statusColor}
              variant="outlined"
            />
            {taskMeta.user && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={styles.metaItem}
              >
                User: {taskMeta.user}
              </Typography>
            )}
            {taskMeta.started_at && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={styles.metaItem}
              >
                Started: {new Date(taskMeta.started_at).toLocaleString()}
              </Typography>
            )}
            {isFinished && countdown > 0 && (
              <Typography
                variant="body2"
                color="text.metrics"
                sx={styles.countdownText}
              >
                Auto-close in {countdown}s
              </Typography>
            )}
          </Box>
        )}

        <Box sx={styles.toolbar}>
          <Typography
            variant="body2"
            color="text.metrics"
            sx={styles.lineCount}
          >
            {hasLogs
              ? `${logs.length} line${logs.length !== 1 ? "s" : ""}`
              : "No output"}
          </Typography>
          <Box sx={styles.toolbarActions}>
            <Tooltip title="Scroll to top">
              <span>
                <IconButton
                  size="small"
                  onClick={handleScrollTop}
                  disabled={!hasLogs}
                >
                  <KeyboardArrowUpOutlined fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Scroll to bottom">
              <span>
                <IconButton
                  size="small"
                  onClick={handleScrollBottom}
                  disabled={!hasLogs}
                >
                  <KeyboardArrowDownOutlined fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Download logs">
              <span>
                <IconButton
                  size="small"
                  onClick={handleDownload}
                  disabled={!hasLogs}
                >
                  <FileDownloadOutlined fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={styles.logContainer}>
          {!hasLogs && !connected && taskId && (
            <Typography variant="body2" sx={styles.emptyText}>
              Loading logs...
            </Typography>
          )}
          {!hasLogs && connected && (
            <Typography variant="body2" sx={styles.emptyText}>
              Waiting for log output...
            </Typography>
          )}
          {hasLogs && (
            <CodeMirror
              value={logText}
              extensions={cmExtensions}
              theme={cmTheme}
              basicSetup={{
                lineNumbers: true,
                foldGutter: false,
                highlightActiveLine: false,
                highlightSelectionMatches: true,
              }}
              onCreateEditor={handleEditorCreate}
              style={{ height: "100%", overflow: "auto", fontSize: "0.75rem" }}
            />
          )}
        </Box>
      </Box>
    </Drawer>
  );
});

const styles = {
  drawer: (fullscreen) => ({
    "& .MuiDrawer-paper": {
      width: fullscreen ? "100vw" : "50vw",
      maxWidth: fullscreen ? "100vw" : "50vw",
      transition: "width 0.3s ease, max-width 0.3s ease",
    },
  }),
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
    gap: "0.25rem",
    overflow: "hidden",
  },
  headerMeta: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  title: {
    fontSize: "1rem",
    fontWeight: 600,
  },
  taskIdText: {
    fontFamily: "monospace",
    fontSize: "0.75rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  statusChip: {
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
  countdownText: {
    fontSize: "0.75rem",
    whiteSpace: "nowrap",
    marginLeft: "auto",
  },
  toolbar: ({ palette }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.25rem 1rem 0.25rem 1.5rem",
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  toolbarActions: {
    display: "flex",
    gap: "0.125rem",
  },
  lineCount: {
    fontSize: "0.6875rem",
    fontFamily: "monospace",
  },
  logContainer: ({ palette }) => ({
    flex: 1,
    overflow: "hidden",
    backgroundColor: palette.mode === "dark" ? "#1a1a2e" : "#f5f5f5",
    "& .cm-editor": {
      height: "100%",
    },
    "& .cm-scroller": {
      overflow: "auto",
    },
  }),
  emptyText: ({ palette }) => ({
    color: palette.text.metrics,
    fontStyle: "italic",
    padding: "2rem",
    textAlign: "center",
  }),
};

export default TaskLogDrawer;
