import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, Box, Button, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { parseMaintenanceTemplate } from '@/pages/ConfigurationPage/components/MaintenanceSection/helpers/maintenanceMessage.helpers';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';

const EDITOR_EXTENSIONS = [EditorView.lineWrapping];

const MaintenanceMessageEditor = memo(props => {
  const { serverTemplate, saving, saveBlocked, onSave, onDirtyChange } = props;

  const styles = maintenanceMessageEditorStyles();

  const theme = useTheme();

  const { supported, markdown: serverMessage } = useMemo(
    () => parseMaintenanceTemplate(serverTemplate),
    [serverTemplate],
  );

  const [message, setMessage] = useState(serverMessage);
  const isDirty = message !== serverMessage;

  useEffect(() => {
    setMessage(serverMessage);
  }, [serverMessage]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleDiscard = useCallback(() => {
    setMessage(serverMessage);
  }, [serverMessage]);

  const handleSave = useCallback(() => {
    onSave(message, 'Maintenance message saved.');
  }, [message, onSave]);

  return (
    <Box sx={styles.card}>
      <Box sx={styles.header}>
        <Typography
          variant="body2"
          sx={styles.title}
        >
          Maintenance Message
        </Typography>
        <Typography
          variant="caption"
          sx={styles.hint}
        >
          Customize the message displayed on the maintenance page. Supports Markdown formatting. Use it to
          share maintenance times, updates, and helpful links.
        </Typography>
      </Box>

      {supported ? (
        <>
          <Box sx={styles.editorWrapper}>
            <CodeMirror
              value={message}
              height="12rem"
              extensions={EDITOR_EXTENSIONS}
              onChange={setMessage}
              theme={theme.palette.mode}
            />
          </Box>
          <Box sx={styles.footer}>
            {saveBlocked && (
              <Typography
                variant="caption"
                sx={styles.hint}
              >
                Save or discard the Splash Page Template changes first.
              </Typography>
            )}
            <Button
              size="small"
              variant="outlined"
              onClick={handleDiscard}
              disabled={!isDirty || saving}
              sx={styles.actionButton}
            >
              Discard
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleSave}
              disabled={!isDirty || saving || saveBlocked}
              sx={styles.actionButton}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </>
      ) : (
        <Box sx={styles.body}>
          <Alert
            severity="info"
            sx={styles.alert}
          >
            The current splash template has no configurable message panel. Use Advanced mode to edit the
            template HTML directly.
          </Alert>
        </Box>
      )}
    </Box>
  );
});

MaintenanceMessageEditor.displayName = 'MaintenanceMessageEditor';

/** @type {MuiSx} */
const maintenanceMessageEditorStyles = () => ({
  card: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.table}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  header: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '1rem 1.25rem',
    backgroundColor: palette.background.tabPanel,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  title: {
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  hint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.75rem',
  }),
  editorWrapper: ({ palette }) => ({
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    '& .cm-editor': {
      fontSize: '0.75rem',
    },
    '& .cm-scroller': {
      overflow: 'auto',
    },
  }),
  body: {
    padding: '1rem 1.25rem',
  },
  alert: {
    fontSize: '0.8125rem',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
  },
  actionButton: {
    textTransform: 'none',
    fontSize: '0.8125rem',
  },
});

export default MaintenanceMessageEditor;
