import { memo, useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import ArrayChipsInput from './ArrayChipsInput';
import MapEditor from './MapEditor';
import UsersTableEditor from './UsersTableEditor';
import { useConfigSuggestionsQuery } from '@/api/configurationApi';

function PasswordField({ value, onChange }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      fullWidth
      size="small"
      type={showPassword ? 'text' : 'password'}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter value..."
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setShowPassword((s) => !s)} edge="end">
                {showPassword ? <VisibilityOff sx={{ fontSize: '1rem' }} /> : <Visibility sx={{ fontSize: '1rem' }} />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      sx={styles.textField}
    />
  );
}

function JsonEditorField({ value, onChange }) {
  const [localStr, setLocalStr] = useState(() => {
    try {
      return JSON.stringify(value || {}, null, 2);
    } catch {
      return '{}';
    }
  });
  const [parseError, setParseError] = useState(null);
  const userEditingRef = useRef(false);

  // Sync from external value when it changes (e.g. async fetch completes)
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
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = useCallback(
    (val) => {
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

  return (
    <Box sx={styles.jsonEditorWrapper}>
      <Box sx={styles.editorContainer}>
        <CodeMirror
          value={localStr}
          height="100%"
          extensions={[json()]}
          onChange={handleChange}
          theme="dark"
        />
      </Box>
      {parseError && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
          {parseError}
        </Typography>
      )}
    </Box>
  );
}

const SchemaField = memo(function SchemaField({ field, value, onChange }) {
  const { type, format, items, additionalProperties } = field;
  const enumValues = field.enum;

  // Fetch suggestions for enum_source (array fields)
  const enumSource = field.enum_source;
  const { data: suggestionsData } = useConfigSuggestionsQuery(
    { source: enumSource },
    { skip: !enumSource },
  );
  const suggestions = suggestionsData?.values || [];
  const suggestionLabels = suggestionsData?.labels || {};

  // Fetch suggestions for enum_source_keys (map editor keys)
  const enumSourceKeys = field.enum_source_keys;
  const { data: keySuggestionsData } = useConfigSuggestionsQuery(
    { source: enumSourceKeys },
    { skip: !enumSourceKeys },
  );
  const keySuggestions = keySuggestionsData?.values || [];

  switch (type) {
    case 'string':
      if (enumValues?.length) {
        return (
          <Select
            fullWidth
            size="small"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            displayEmpty
            sx={styles.select}
          >
            {enumValues.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        );
      }
      if (format === 'password') {
        return <PasswordField value={value} onChange={onChange} />;
      }
      return (
        <TextField
          fullWidth
          size="small"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value..."
          sx={styles.textField}
        />
      );

    case 'integer':
    case 'number':
      return (
        <TextField
          fullWidth
          size="small"
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(Number(e.target.value))}
          inputProps={{ min: field.minimum, max: field.maximum }}
          placeholder="Enter number..."
          sx={styles.textField}
        />
      );

    case 'array':
      if (items?.type === 'string' || (items?.type === 'integer' && enumSource)) {
        return (
          <ArrayChipsInput
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
            suggestions={suggestions}
            labels={suggestionLabels}
          />
        );
      }
      if (items?.type === 'object' && items?.properties?.login && items?.properties?.password) {
        return (
          <UsersTableEditor
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
          />
        );
      }
      return <JsonEditorField value={value} onChange={onChange} />;

    case 'object':
      if (additionalProperties?.type === 'array') {
        return (
          <MapEditor
            value={value || {}}
            onChange={onChange}
            keySuggestions={keySuggestions}
            valueSuggestionsSource={field.enum_source_values}
          />
        );
      }
      return <JsonEditorField value={value} onChange={onChange} />;

    default:
      return (
        <TextField
          fullWidth
          size="small"
          value={typeof value === 'string' ? value : JSON.stringify(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value..."
          sx={styles.textField}
        />
      );
  }
});

const styles = {
  textField: ({ palette }) => ({
    '& .MuiOutlinedInput-root': {
      fontSize: '0.8125rem',
      backgroundColor: palette.background.default,
    },
  }),
  select: ({ palette }) => ({
    fontSize: '0.8125rem',
    backgroundColor: palette.background.default,
  }),
  jsonEditorWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '300px',
  },
  editorContainer: ({ palette }) => ({
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
  }),
};

export default SchemaField;
