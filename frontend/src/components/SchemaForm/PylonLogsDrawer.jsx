import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useTheme } from '@mui/material/styles';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { search, searchKeymap } from '@codemirror/search';
import { useRuntimePylonLogsMutation } from '@/api/configurationApi';

const PylonLogsDrawer = memo(function PylonLogsDrawer({ open, pylonId, onClose }) {
  const [logs, setLogs] = useState('');
  const [fetchLogs, { isLoading }] = useRuntimePylonLogsMutation();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [downloadAnchor, setDownloadAnchor] = useState(null);
  const editorViewRef = useRef(null);
  const muiTheme = useTheme();
  const cmTheme = muiTheme.palette.mode === 'dark' ? 'dark' : 'light';

  const extensions = useMemo(() => [
    search({ top: false }),
    keymap.of(searchKeymap),
    EditorView.lineWrapping,
  ], []);

  const handleCreateEditor = useCallback((view) => {
    editorViewRef.current = view;
  }, []);

  const scrollToTop = useCallback(() => {
    const view = editorViewRef.current;
    if (view) {
      view.dispatch({ effects: EditorView.scrollIntoView(0, { y: 'start' }) });
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    const view = editorViewRef.current;
    if (view) {
      view.dispatch({ effects: EditorView.scrollIntoView(view.state.doc.length, { y: 'end' }) });
    }
  }, []);

  // Clear logs when drawer opens with a new pylon
  useEffect(() => {
    if (open) {
      setLogs('');
    }
  }, [open, pylonId]);

  const handleFetch = useCallback(async () => {
    try {
      const result = await fetchLogs({ pylonId }).unwrap();
      if (result.ok) {
        setLogs(result.logs || '');
      } else {
        setSnackbar({ open: true, message: 'Error during logs retrieval', severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Error during logs retrieval', severity: 'error' });
      console.error(err);
    }
  }, [fetchLogs, pylonId]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const handleDownloadClick = useCallback((e) => {
    setDownloadAnchor(e.currentTarget);
  }, []);

  const handleDownload = useCallback((format) => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pylonId}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadAnchor(null);
  }, [logs, pylonId]);

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} sx={styles.drawer}>
        <Box sx={styles.root}>
          {/* Header */}
          <Box sx={styles.header}>
            <Box sx={styles.headerLeft}>
              <Typography variant="h6" sx={styles.title}>
                Pylon Logs
              </Typography>
              <Typography variant="body2" color="text.metrics" sx={styles.subtitle}>
                {pylonId}
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClose}>
              <CloseOutlined fontSize="small" />
            </IconButton>
          </Box>

          {/* Log display area */}
          <Box sx={styles.logsArea}>
            {isLoading ? (
              <Box sx={styles.loading}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box sx={styles.logsWrapper}>
                {logs ? (
                  <>
                    <CodeMirror
                      value={logs}
                      height="100%"
                      theme={cmTheme}
                      extensions={extensions}
                      readOnly
                      onCreateEditor={handleCreateEditor}
                      style={{ flex: 1, overflow: 'hidden', fontSize: '0.75rem' }}
                    />
                    <Box sx={styles.scrollButtons}>
                      <Tooltip title="Scroll to top" placement="left">
                        <IconButton size="small" onClick={scrollToTop} sx={styles.scrollButton}>
                          <KeyboardArrowUpIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Scroll to bottom" placement="left">
                        <IconButton size="small" onClick={scrollToBottom} sx={styles.scrollButton}>
                          <KeyboardArrowDownIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </>
                ) : (
                  <Box sx={styles.placeholder}>
                    Click &quot;Fetch&quot; to load pylon logs.
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Footer */}
          <Box sx={styles.footer}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadOutlinedIcon sx={{ fontSize: '0.875rem' }} />}
              endIcon={<ArrowDropDownIcon sx={{ fontSize: '0.875rem' }} />}
              onClick={handleDownloadClick}
              disabled={!logs || isLoading}
              sx={styles.actionButton}
            >
              Download
            </Button>
            <Menu
              anchorEl={downloadAnchor}
              open={Boolean(downloadAnchor)}
              onClose={() => setDownloadAnchor(null)}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              <MenuItem dense onClick={() => handleDownload('log')}>.log</MenuItem>
              <MenuItem dense onClick={() => handleDownload('txt')}>.txt</MenuItem>
            </Menu>
            <Button
              size="small"
              variant="contained"
              onClick={handleFetch}
              disabled={isLoading}
              sx={styles.actionButton}
            >
              {isLoading ? 'Fetching...' : 'Fetch'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
});

const styles = {
  drawer: {
    '& .MuiDrawer-paper': {
      width: '50vw',
      maxWidth: '50vw',
    },
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    overflow: 'hidden',
  },
  title: {
    fontSize: '1rem',
    fontWeight: 600,
  },
  subtitle: {
    fontSize: '0.75rem',
    fontFamily: 'monospace',
  },
  logsArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  logsWrapper: {
    flex: 1,
    display: 'flex',
    position: 'relative',
    overflow: 'hidden',
    '& .cm-editor': {
      flex: 1,
      height: '100%',
    },
    '& .cm-scroller': {
      fontFamily: 'monospace',
      fontSize: '0.75rem',
      lineHeight: 1.6,
    },
  },
  placeholder: ({ palette }) => ({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    color: palette.text.secondary,
    fontFamily: 'monospace',
  }),
  scrollButtons: {
    position: 'absolute',
    right: '1.25rem',
    bottom: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    zIndex: 1,
  },
  scrollButton: ({ palette }) => ({
    backgroundColor: palette.background.paper,
    border: `1px solid ${palette.border?.table || palette.divider}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
    '&:hover': {
      backgroundColor: palette.action?.hover || 'rgba(0,0,0,0.08)',
    },
  }),
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  footer: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    borderTop: `0.0625rem solid ${palette.border.table}`,
  }),
  actionButton: {
    textTransform: 'none',
    fontSize: '0.8125rem',
  },
};

export default PylonLogsDrawer;
