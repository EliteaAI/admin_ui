import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Button, Typography } from '@mui/material';

import { html } from '@codemirror/lang-html';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';

const SplashTemplateEditor = memo(props => {
  const { serverTemplate, saving, saveBlocked, onSave, onDirtyChange } = props;

  const styles = splashTemplateEditorStyles();

  const [template, setTemplate] = useState(serverTemplate);
  const isDirty = template !== serverTemplate;

  useEffect(() => {
    setTemplate(serverTemplate);
  }, [serverTemplate]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  const handleDiscard = useCallback(() => {
    setTemplate(serverTemplate);
  }, [serverTemplate]);

  const handleSave = useCallback(() => {
    onSave(
      template,
      template.trim() ? 'Splash template saved.' : 'Splash template reset. The default template is used.',
    );
  }, [onSave, template]);

  const extensions = useMemo(() => [html(), EditorView.lineWrapping], []);

  return (
    <Box sx={styles.editorCard}>
      <Box sx={styles.editorHeader}>
        <Typography
          variant="body2"
          sx={styles.editorTitle}
        >
          Splash Page Template
        </Typography>
        <Typography
          variant="caption"
          sx={styles.editorHint}
        >
          Custom HTML shown during maintenance. Leave empty to use the default template.
        </Typography>
      </Box>
      <Box sx={styles.editorWrapper}>
        <CodeMirror
          value={template}
          height="18.75rem"
          extensions={extensions}
          onChange={setTemplate}
          theme="dark"
        />
      </Box>
      <Box sx={styles.editorFooter}>
        {saveBlocked && (
          <Typography
            variant="caption"
            sx={styles.editorHint}
          >
            Save or discard the Maintenance Message changes first.
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
          {saving ? 'Saving...' : 'Save Template'}
        </Button>
      </Box>
    </Box>
  );
});

SplashTemplateEditor.displayName = 'SplashTemplateEditor';

/** @type {MuiSx} */
const splashTemplateEditorStyles = () => ({
  editorCard: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.table}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  editorHeader: ({ palette }) => ({
    padding: '1rem 1.25rem',
    backgroundColor: palette.background.tabPanel,
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  editorTitle: {
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  editorHint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.75rem',
  }),
  editorWrapper: {
    '& .cm-theme-dark': {
      display: 'flex',
      flexDirection: 'column',
    },
    '& .cm-editor': {
      fontSize: '0.75rem',
    },
    '& .cm-scroller': {
      overflow: 'auto',
    },
    '& .cm-gutters': {
      fontSize: '0.75rem',
    },
  },
  editorFooter: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
    padding: '0.75rem 1.25rem',
    borderTop: `0.0625rem solid ${palette.border.table}`,
  }),
  actionButton: {
    textTransform: 'none',
    fontSize: '0.8125rem',
  },
});

export default SplashTemplateEditor;
