import { memo, useCallback, useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';

const ArrayChipsInput = memo(function ArrayChipsInput({ value, onChange, suggestions, placeholder }) {
  const [inputValue, setInputValue] = useState('');

  const availableOptions = useMemo(() => {
    if (!suggestions?.length) return [];
    return suggestions.filter((s) => !value.includes(s));
  }, [suggestions, value]);

  const handleDelete = useCallback(
    (itemToDelete) => {
      onChange(value.filter((item) => item !== itemToDelete));
    },
    [value, onChange],
  );

  // When suggestions exist, use Autocomplete
  if (suggestions?.length) {
    return (
      <Box>
        <Autocomplete
          freeSolo
          multiple
          size="small"
          options={availableOptions}
          value={value}
          inputValue={inputValue}
          onInputChange={(_, newInput) => setInputValue(newInput)}
          onChange={(_, newValue) => onChange(newValue)}
          renderTags={() => null}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={value.length === 0 ? (placeholder || 'Type to search...') : ''}
              sx={styles.input}
            />
          )}
          slotProps={{ popper: { sx: styles.popper } }}
          sx={styles.autocomplete}
        />
        {value.length > 0 && (
          <Box sx={styles.chipsContainer}>
            {value.map((item) => (
              <Chip
                key={item}
                label={item}
                size="small"
                onDelete={() => handleDelete(item)}
                sx={styles.chip}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  }

  // Fallback: plain text input with Enter/comma to add
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = inputValue.trim().replace(/,+$/, '');
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed]);
      }
      setInputValue('');
    }
  };

  const handleBlur = () => {
    const trimmed = inputValue.trim().replace(/,+$/, '');
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue('');
  };

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder || 'Type and press Enter to add'}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        sx={styles.input}
      />
      {value.length > 0 && (
        <Box sx={styles.chipsContainer}>
          {value.map((item) => (
            <Chip
              key={item}
              label={item}
              size="small"
              onDelete={() => handleDelete(item)}
              sx={styles.chip}
            />
          ))}
        </Box>
      )}
    </Box>
  );
});

const styles = {
  input: ({ palette }) => ({
    '& .MuiOutlinedInput-root': {
      fontSize: '0.8125rem',
      backgroundColor: palette.background.default,
    },
  }),
  autocomplete: {
    '& .MuiOutlinedInput-root': {
      padding: '2px 8px',
    },
  },
  popper: {
    '& .MuiAutocomplete-option': {
      fontSize: '0.8125rem',
    },
  },
  chipsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
    marginTop: '0.5rem',
  },
  chip: ({ palette }) => ({
    fontSize: '0.75rem',
    backgroundColor: palette.background.tabButton?.active || palette.action.selected,
  }),
};

export default ArrayChipsInput;
