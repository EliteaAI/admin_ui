import { memo, useCallback } from 'react';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Box, IconButton, Typography } from '@mui/material';

import { useConfigSuggestionsQuery } from '@/api/configuration.api';

import ArrayChipsInput from './ArrayChipsInput';

// Separate component so each row can independently fetch tool suggestions
const MapEntryRow = memo(props => {
  const { entryKey, vals, valueSuggestionsSource, onDelete, onValuesChange } = props;

  const { data: toolsData } = useConfigSuggestionsQuery(
    { source: valueSuggestionsSource, toolkit: entryKey },
    { skip: !valueSuggestionsSource },
  );
  const toolSuggestions = toolsData?.values || [];

  const handleDelete = useCallback(() => onDelete(entryKey), [onDelete, entryKey]);

  const handleValuesChange = useCallback(
    newVals => onValuesChange(entryKey, newVals),
    [onValuesChange, entryKey],
  );

  const styles = mapEntryRowStyles();

  return (
    <Box sx={styles.entryRow}>
      <Box sx={styles.entryHeader}>
        <Typography
          variant="body2"
          sx={styles.entryKey}
        >
          {entryKey}
        </Typography>
        <IconButton
          size="small"
          onClick={handleDelete}
          sx={styles.deleteBtn}
        >
          <DeleteOutlineIcon sx={{ fontSize: '1rem' }} />
        </IconButton>
      </Box>
      <Box sx={styles.values}>
        <ArrayChipsInput
          value={Array.isArray(vals) ? vals : []}
          onChange={handleValuesChange}
          suggestions={toolSuggestions}
          placeholder="Type tool name..."
        />
      </Box>
    </Box>
  );
});

MapEntryRow.displayName = 'MapEntryRow';

/** @type {MuiSx} */
const mapEntryRowStyles = () => ({
  entryRow: ({ palette }) => ({
    marginBottom: '0.75rem',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border.table}`,
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
    color: palette.error.main,
  }),
  values: {
    paddingLeft: '1rem',
  },
});

export default MapEntryRow;
