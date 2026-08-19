import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import FullscreenOutlined from "@mui/icons-material/FullscreenOutlined";
import FullscreenExitOutlined from "@mui/icons-material/FullscreenExitOutlined";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useTheme } from "@mui/material/styles";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { search, searchKeymap } from "@codemirror/search";
import { LOG_LEVELS, LEVEL_COLORS, filterLogsByLevel } from "./logLevels";

const LogViewerDrawer = memo((props) => {
  const {
    open,
    onClose,
    title,
    subtitle,
    logs,
    headerExtra,
    metaBar,
    footerExtra,
    loading = false,
    placeholder = "No logs available.",
    downloadFilename = "logs",
    showLevelFilter = true,
    onScrollTop,
    onScrollBottom,
  } = props;

  const [downloadAnchor, setDownloadAnchor] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeLevels, setActiveLevels] = useState(() => new Set(LOG_LEVELS));
  const editorViewRef = useRef(null);
  const muiTheme = useTheme();
  const cmTheme = muiTheme.palette.mode === "dark" ? "dark" : "light";

  useEffect(() => {
    if (open) setActiveLevels(new Set(LOG_LEVELS));
  }, [open]);

  const toggleLevel = useCallback((level) => {
    setActiveLevels((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }, []);

  const filteredLogs = useMemo(
    () => (showLevelFilter ? filterLogsByLevel(logs, activeLevels) : logs),
    [logs, activeLevels, showLevelFilter],
  );

  const extensions = useMemo(
    () => [
      search({ top: false }),
      keymap.of(searchKeymap),
      EditorView.lineWrapping,
    ],
    [],
  );

  const handleCreateEditor = useCallback((view) => {
    editorViewRef.current = view;
  }, []);

  const scrollToTop = useCallback(() => {
    const view = editorViewRef.current;
    if (view) {
      view.dispatch({ effects: EditorView.scrollIntoView(0, { y: "start" }) });
    }
    onScrollTop?.();
  }, [onScrollTop]);

  const scrollToBottom = useCallback(() => {
    const view = editorViewRef.current;
    if (view) {
      view.dispatch({
        effects: EditorView.scrollIntoView(view.state.doc.length, { y: "end" }),
      });
    }
    onScrollBottom?.();
  }, [onScrollBottom]);

  const handleDownloadClick = useCallback((e) => {
    setDownloadAnchor(e.currentTarget);
  }, []);

  const handleDownload = useCallback(
    (format) => {
      const blob = new Blob([logs], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${downloadFilename}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadAnchor(null);
    },
    [logs, downloadFilename],
  );

  const hasLogs = logs && logs.length > 0;
  const lineCount = hasLogs ? filteredLogs.split("\n").length : 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={styles.drawer(fullscreen)}
    >
      <Box sx={styles.root}>
        {/* Header */}
        <Box sx={styles.header}>
          <Box sx={styles.headerLeft}>
            <Typography variant="h6" sx={styles.title}>
              {title}
            </Typography>
            <Box sx={styles.headerMeta}>
              {subtitle && (
                <Typography
                  variant="body2"
                  color="text.metrics"
                  sx={styles.subtitle}
                >
                  {subtitle}
                </Typography>
              )}
              {headerExtra}
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

        {/* Optional meta bar */}
        {metaBar}

        {/* Level filter chips */}
        {hasLogs && showLevelFilter && (
          <Box sx={styles.levelFilterBar}>
            {LOG_LEVELS.map((level) => (
              <Chip
                key={level}
                label={level}
                size="small"
                color={LEVEL_COLORS[level]}
                variant={activeLevels.has(level) ? "filled" : "outlined"}
                onClick={() => toggleLevel(level)}
                sx={styles.levelChip}
              />
            ))}
          </Box>
        )}

        {/* Log display area */}
        <Box sx={styles.logsArea}>
          {loading ? (
            <Box sx={styles.loading}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Box sx={styles.logsWrapper}>
              {hasLogs ? (
                <>
                  <CodeMirror
                    value={filteredLogs}
                    height="100%"
                    theme={cmTheme}
                    extensions={extensions}
                    readOnly
                    onCreateEditor={handleCreateEditor}
                    style={{
                      flex: 1,
                      overflow: "hidden",
                      fontSize: "0.75rem",
                    }}
                  />
                  <Box sx={styles.scrollButtons}>
                    <Tooltip title="Scroll to top" placement="left">
                      <IconButton
                        size="small"
                        onClick={scrollToTop}
                        sx={styles.scrollButton}
                      >
                        <KeyboardArrowUpIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Scroll to bottom" placement="left">
                      <IconButton
                        size="small"
                        onClick={scrollToBottom}
                        sx={styles.scrollButton}
                      >
                        <KeyboardArrowDownIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </>
              ) : (
                <Box sx={styles.placeholder}>{placeholder}</Box>
              )}
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={styles.footer}>
          <Typography
            variant="body2"
            color="text.metrics"
            sx={styles.lineCount}
          >
            {hasLogs
              ? `${lineCount} line${lineCount !== 1 ? "s" : ""}`
              : "No output"}
          </Typography>
          <Box sx={styles.footerActions}>
            {footerExtra}
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadOutlinedIcon sx={{ fontSize: "0.875rem" }} />}
              endIcon={<ArrowDropDownIcon sx={{ fontSize: "0.875rem" }} />}
              onClick={handleDownloadClick}
              disabled={!hasLogs || loading}
              sx={styles.actionButton}
            >
              Download
            </Button>
            <Menu
              anchorEl={downloadAnchor}
              open={Boolean(downloadAnchor)}
              onClose={() => setDownloadAnchor(null)}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              transformOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
              <MenuItem dense onClick={() => handleDownload("log")}>
                .log
              </MenuItem>
              <MenuItem dense onClick={() => handleDownload("txt")}>
                .txt
              </MenuItem>
            </Menu>
          </Box>
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
    gap: "0.125rem",
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
  subtitle: {
    fontSize: "0.75rem",
    fontFamily: "monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  levelFilterBar: ({ palette }) => ({
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    padding: "0.5rem 1.5rem",
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  levelChip: {
    fontSize: "0.6875rem",
    height: "1.375rem",
    cursor: "pointer",
  },
  logsArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  logsWrapper: {
    flex: 1,
    display: "flex",
    position: "relative",
    overflow: "hidden",
    "& .cm-editor": {
      flex: 1,
      height: "100%",
    },
    "& .cm-scroller": {
      fontFamily: "monospace",
      fontSize: "0.75rem",
      lineHeight: 1.6,
    },
  },
  placeholder: ({ palette }) => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.875rem",
    color: palette.text.secondary,
    fontFamily: "monospace",
  }),
  scrollButtons: {
    position: "absolute",
    right: "1.25rem",
    bottom: "0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    zIndex: 1,
  },
  scrollButton: ({ palette }) => ({
    backgroundColor: palette.background.paper,
    border: `1px solid ${palette.border?.table || palette.divider}`,
    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
    "&:hover": {
      backgroundColor: palette.action?.hover || "rgba(0,0,0,0.08)",
    },
  }),
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  footer: ({ palette }) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    borderTop: `0.0625rem solid ${palette.border.table}`,
  }),
  footerActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  lineCount: {
    fontSize: "0.6875rem",
    fontFamily: "monospace",
  },
  actionButton: {
    textTransform: "none",
    fontSize: "0.8125rem",
  },
};

export default LogViewerDrawer;
