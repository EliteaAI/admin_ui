import { memo, useCallback } from 'react';

import { Box, Chip, Switch, Typography } from '@mui/material';

import { isJsonEditor } from '@/components/SchemaForm/helpers/schemaForm.helpers';

import SchemaField from './SchemaField';

const FieldCard = memo(props => {
  const { field, values, onChange } = props;

  const isBoolean = field.type === 'boolean';
  const expandable = isJsonEditor(field);

  const handleSwitchChange = useCallback(e => onChange(field.key, e.target.checked), [onChange, field.key]);

  const handleValueChange = useCallback(val => onChange(field.key, val), [onChange, field.key]);

  const styles = fieldCardStyles();

  return (
    <Box sx={[styles.fieldCard, expandable && styles.fieldCardExpand]}>
      <Box sx={styles.fieldHeader}>
        <Box sx={styles.fieldTitleRow}>
          <Typography
            variant="body2"
            sx={styles.fieldTitle}
          >
            {field.title || field.key}
          </Typography>
          {field.requires_restart && (
            <Chip
              label="Reload required"
              size="small"
              color="warning"
              variant="outlined"
              sx={styles.restartChip}
            />
          )}
        </Box>
        {isBoolean && (
          <Switch
            checked={!!values[field.key]}
            onChange={handleSwitchChange}
            size="small"
          />
        )}
      </Box>
      {field.description && (
        <Typography
          variant="caption"
          sx={styles.fieldDescription}
        >
          {field.description}
        </Typography>
      )}
      {!isBoolean && (
        <Box sx={[styles.fieldControl, expandable && styles.fieldControlExpand]}>
          <SchemaField
            field={field}
            value={values[field.key]}
            onChange={handleValueChange}
          />
        </Box>
      )}
    </Box>
  );
});

FieldCard.displayName = 'FieldCard';

/** @type {MuiSx} */
const fieldCardStyles = () => ({
  fieldCard: ({ palette }) => ({
    padding: '0.875rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.table}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  }),
  fieldCardExpand: {
    flex: 1,
    minHeight: 0,
  },
  fieldHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    minHeight: '1.75rem',
  },
  fieldTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  fieldTitle: ({ palette }) => ({
    fontWeight: 600,
    fontSize: '0.8125rem',
    color: palette.text.secondary,
  }),
  fieldDescription: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.75rem',
    lineHeight: 1.5,
  }),
  fieldControl: {
    marginTop: '0.375rem',
  },
  fieldControlExpand: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  restartChip: {
    fontSize: '0.625rem',
    height: '1.125rem',
    '& .MuiChip-label': {
      padding: '0 0.375rem',
    },
  },
});

export default FieldCard;
