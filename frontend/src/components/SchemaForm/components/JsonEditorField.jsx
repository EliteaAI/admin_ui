import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';

const JsonEditorField = memo(props => {
  const { value, onChange } = props;

  const [localStr, setLocalStr] = useState(() => {
    try {
      return JSON.stringify(value || {}, null, 2);
    } catch {
      return '{}';
    }
  });
  const [parseError, setParseError] = useState(null);
  const userEditingRef = useRef(false);

  useEffect(() => {
    if (userEditingRef.current) return;
    try {
      const externalStr = JSON.stringify(value || {}, null, 2);
      if (externalStr !== localStr) {
        setLocalStr(externalStr);
        setParseError(null);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = useCallback(
    val => {
      userEditingRef.current = true;
      setLocalStr(val);
      try {
        const parsed = JSON.parse(val);
        setParseError(null);
        onChange(parsed);
      } catch (e) {
        setParseError(e.message);
      }
    },
    [onChange],
  );

  const extensions = useMemo(() => [json()], []);

  const styles = jsonEditorFieldStyles();

  return (
    <Box sx={styles.jsonEditorWrapper}>
      <Box sx={styles.editorContainer}>
        <CodeMirror
          value={localStr}
          height="100%"
          extensions={extensions}
          onChange={handleChange}
          theme="dark"
        />
      </Box>
      {parseError && (
        <Typography
          variant="caption"
          color="error"
          sx={styles.parseError}
        >
          {parseError}
        </Typography>
      )}
    </Box>
  );
});

JsonEditorField.displayName = 'JsonEditorField';

/** @type {MuiSx} */
const jsonEditorFieldStyles = () => ({
  jsonEditorWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '18.75rem',
  },
  editorContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '0.375rem',
    overflow: 'hidden',
    '& .cm-theme-dark': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
    },
    '& .cm-editor': {
      flex: 1,
      fontSize: '0.75rem',
    },
    '& .cm-scroller': {
      overflow: 'auto',
    },
    '& .cm-gutters': {
      fontSize: '0.75rem',
    },
  },
  parseError: {
    marginTop: '0.25rem',
  },
});

export default JsonEditorField;
