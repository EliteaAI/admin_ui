import { memo, useCallback, useMemo, useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import { Autocomplete, Box, Button, TextField } from '@mui/material';

import MapEntryRow from './MapEntryRow';

const MapEditor = memo(props => {
  const { value, onChange, keySuggestions, valueSuggestionsSource } = props;

  const [newKey, setNewKey] = useState('');

  const entries = Object.entries(value || {});

  const availableKeySuggestions = useMemo(() => {
    if (!keySuggestions?.length) return [];
    const existingKeys = new Set(Object.keys(value || {}));
    return keySuggestions.filter(s => !existingKeys.has(s));
  }, [keySuggestions, value]);

  const handleAddEntry = useCallback(() => {
    const trimmed = newKey.trim();
    if (trimmed && !(trimmed in (value || {}))) {
      onChange({ ...(value || {}), [trimmed]: [] });
      setNewKey('');
    }
  }, [newKey, value, onChange]);

  const handleDeleteEntry = useCallback(
    key => {
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

  const handleKeyInputChange = useCallback((_, val) => setNewKey(val), []);

  const handleKeySelect = useCallback(
    (_, val) => {
      if (val && !(val in (value || {}))) {
        onChange({ ...(value || {}), [val]: [] });
        setNewKey('');
      }
    },
    [value, onChange],
  );

  const handleNewKeyChange = useCallback(e => setNewKey(e.target.value), []);

  const handleNewKeyKeyDown = useCallback(
    e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddEntry();
      }
    },
    [handleAddEntry],
  );

  const styles = mapEditorStyles();

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
            onInputChange={handleKeyInputChange}
            onChange={handleKeySelect}
            renderInput={params => (
              <TextField
                {...params}
                placeholder="Add toolkit name..."
                sx={styles.addInput}
              />
            )}
            slotProps={{ popper: { sx: styles.popper } }}
            sx={styles.autocomplete}
          />
        ) : (
          <TextField
            size="small"
            placeholder="Add toolkit name..."
            value={newKey}
            onChange={handleNewKeyChange}
            onKeyDown={handleNewKeyKeyDown}
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

MapEditor.displayName = 'MapEditor';

/** @type {MuiSx} */
const mapEditorStyles = () => ({
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
  autocomplete: {
    flex: 1,
  },
  popper: {
    '& .MuiAutocomplete-option': {
      fontSize: '0.8125rem',
    },
  },
});

export default MapEditor;
