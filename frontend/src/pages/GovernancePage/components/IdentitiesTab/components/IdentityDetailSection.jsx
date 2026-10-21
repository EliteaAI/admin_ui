import { memo } from 'react';

import { Box, Typography } from '@mui/material';

/** A titled list of label / value pairs. `fields` is `[{ key, label, value, mono }]`; a value can be text or a node. */
const IdentityDetailSection = memo(props => {
  const { title, fields } = props;

  const styles = identityDetailSectionStyles();

  return (
    <>
      <Typography variant="labelMedium">{title}</Typography>
      {fields.map(field => (
        <Box
          key={field.key}
          sx={styles.field}
          data-testid={`identity-field-${field.key}`}
        >
          <Typography
            variant="bodySmall"
            sx={styles.label}
          >
            {field.label}
          </Typography>
          {typeof field.value === 'object' && field.value !== null ? (
            field.value
          ) : (
            <Typography
              variant="bodyMedium"
              sx={field.mono ? styles.mono : styles.value}
            >
              {field.value ?? '-'}
            </Typography>
          )}
        </Box>
      ))}
    </>
  );
});

IdentityDetailSection.displayName = 'IdentityDetailSection';

/** @type {MuiSx} */
const identityDetailSectionStyles = () => ({
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  label: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  value: {
    wordBreak: 'break-word',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: '0.8125rem',
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap',
  },
});

export default IdentityDetailSection;
