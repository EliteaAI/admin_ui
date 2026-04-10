import { memo, useCallback, useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import ArrayChipsInput from './ArrayChipsInput';
import { useConfigSuggestionsQuery } from '@/api/configurationApi';

const MapEditor = memo(function MapEditor({ value, onChange, keySuggestions, valueSuggestionsSource }) {
  const [newKey, setNewKey] = useState('');

  const entries = Object.entries(value || {});

  const availableKeySuggestions = useMemo(() => {
    if (!keySuggestions?.length) return [];
    const existingKeys = new Set(Object.keys(value || {}));
    return keySuggestions.filter((s) => !existingKeys.has(s));
  }, [keySuggestions, value]);

  const handleAddEntry = useCallback(() => {
    const trimmed = newKey.trim();
    if (trimmed && !(trimmed in (value || {}))) {
      onChange({ ...(value || {}), [trimmed]: [] });
      setNewKey('');
    }
  }, [newKey, value, onChange]);

  const handleDeleteEntry = useCallback(
    (key) => {
      const next = { ...value };
      delete next[key];
      onChange(next);
    },
    [value, onChange],
  );

  const handleValuesChange = useCallback(
    (key, newValues) => {
      onChange({ ...value, [key]: newValues });
    },
    [value, onChange],
  );

  return (
    <Box>
      {entries.map(([key, vals]) => (
        <MapEntryRow
          key={key}
          entryKey={key}
          vals={vals}
          valueSuggestionsSource={valueSuggestionsSource}
          onDelete={handleDeleteEntry}
          onValuesChange={handleValuesChange}
        />
      ))}

      <Box sx={styles.addRow}>
        {availableKeySuggestions.length > 0 ? (
          <Autocomplete
            freeSolo
            size="small"
            options={availableKeySuggestions}
            inputValue={newKey}
            onInputChange={(_, val) => setNewKey(val)}
            onChange={(_, val) => {
              if (val && !(val in (value || {}))) {
                onChange({ ...(value || {}), [val]: [] });
                setNewKey('');
              }
            }}
            renderInput={(params) => (
              <TextField {...params} placeholder="Add toolkit name..." sx={styles.addInput} />
            )}
            slotProps={{ popper: { sx: styles.popper } }}
            sx={{ flex: 1 }}
          />
        ) : (
          <TextField
            size="small"
            placeholder="Add toolkit name..."
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddEntry();
              }
            }}
            sx={styles.addInput}
          />
        )}
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddEntry}
          disabled={!newKey.trim() || newKey.trim() in (value || {})}
          sx={styles.addButton}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
});

// Separate component so each row can independently fetch tool suggestions
const MapEntryRow = memo(function MapEntryRow({
  entryKey,
  vals,
  valueSuggestionsSource,
  onDelete,
  onValuesChange,
}) {
  const { data: toolsData } = useConfigSuggestionsQuery(
    { source: valueSuggestionsSource, toolkit: entryKey },
    { skip: !valueSuggestionsSource },
  );
  const toolSuggestions = toolsData?.values || [];

  return (
    <Box sx={styles.entryRow}>
      <Box sx={styles.entryHeader}>
        <Typography variant="body2" sx={styles.entryKey}>
          {entryKey}
        </Typography>
        <IconButton size="small" onClick={() => onDelete(entryKey)} sx={styles.deleteBtn}>
          <DeleteOutlineIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
      </Box>
      <Box sx={{ pl: 2 }}>
        <ArrayChipsInput
          value={Array.isArray(vals) ? vals : []}
          onChange={(newVals) => onValuesChange(entryKey, newVals)}
          suggestions={toolSuggestions}
          placeholder="Type tool name..."
        />
      </Box>
    </Box>
  );
});

const styles = {
  entryRow: ({ palette }) => ({
    marginBottom: '0.75rem',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: `1px solid ${palette.border.table}`,
    backgroundColor: palette.background.default,
  }),
  entryHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  entryKey: ({ palette }) => ({
    fontWeight: 600,
    fontFamily: 'monospace',
    fontSize: '0.8125rem',
    color: palette.text.secondary,
  }),
  deleteBtn: ({ palette }) => ({
    color: palette.error?.main || palette.text.metrics,
  }),
  addRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    marginTop: '0.25rem',
  },
  addInput: ({ palette }) => ({
    flex: 1,
    '& .MuiOutlinedInput-root': {
      fontSize: '0.8125rem',
      backgroundColor: palette.background.default,
    },
  }),
  addButton: {
    textTransform: 'none',
    fontSize: '0.8125rem',
    whiteSpace: 'nowrap',
  },
  popper: {
    '& .MuiAutocomplete-option': {
      fontSize: '0.8125rem',
    },
  },
};

export default MapEditor;
