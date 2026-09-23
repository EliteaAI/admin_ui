import { memo, useCallback } from 'react';

import RestoreIcon from '@mui/icons-material/RestoreOutlined';
import { Box, Chip, IconButton, Switch, Tooltip, Typography } from '@mui/material';

import { isJsonEditor } from '@/components/SchemaForm/helpers/schemaForm.helpers';

import SchemaField from './SchemaField';

const GuardrailsFieldCard = memo(props => {
  const { field, values, onChange } = props;

  const isBoolean = field.type === 'boolean';
  const hasBuiltinDefault = typeof field.builtin_default === 'string' && field.builtin_default.length > 0;
  const atBuiltinDefault = hasBuiltinDefault && (values[field.key] || '') === field.builtin_default;
  const expandable = isJsonEditor(field);

  const handleSwitchChange = useCallback(e => onChange(field.key, e.target.checked), [onChange, field.key]);

  const handleRestoreDefault = useCallback(
    () => onChange(field.key, field.builtin_default),
    [onChange, field.key, field.builtin_default],
  );

  const handleValueChange = useCallback(val => onChange(field.key, val), [onChange, field.key]);

  const styles = guardrailsFieldCardStyles();

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
        {!isBoolean && hasBuiltinDefault && (
          <Tooltip
            title={
              atBuiltinDefault ? 'Already matches the built-in defaults' : 'Restore to built-in defaults'
            }
            placement="top"
          >
            <Box component="span">
              <IconButton
                size="small"
                disabled={atBuiltinDefault}
                onClick={handleRestoreDefault}
                aria-label={`restore-default-${field.key}`}
              >
                <RestoreIcon fontSize="small" />
              </IconButton>
            </Box>
          </Tooltip>
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

GuardrailsFieldCard.displayName = 'GuardrailsFieldCard';

/** @type {MuiSx} */
const guardrailsFieldCardStyles = () => ({
  fieldCard: ({ palette }) => ({
    padding: '0.875rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.table}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    backgroundColor: 'transparent',
  }),
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
  fieldCardExpand: {
    minHeight: '12.5rem',
  },
  fieldControlExpand: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '9.375rem',
  },
  restartChip: {
    fontSize: '0.625rem',
    height: '1.125rem',
    '& .MuiChip-label': {
      padding: '0 0.375rem',
    },
  },
});

export default GuardrailsFieldCard;
