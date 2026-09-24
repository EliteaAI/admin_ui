import { memo, useCallback } from 'react';

import { Box, TextField, Typography } from '@mui/material';

import { TRIGGER_FIELDS } from '@/pages/FeaturesPage/components/ChatConfigurationSection/constants/chatConfiguration.constants';

const isValidTrigger = char => typeof char === 'string' && char.length === 1 && /^[^a-zA-Z0-9\s]$/.test(char);

const ChatMentions = memo(props => {
  const { values, onChange } = props;

  const styles = chatMentionsStyles();

  const handleChange = useCallback(
    key => e => {
      const value = e.target.value;
      // Only allow single character input
      if (value.length <= 1) {
        onChange(key, value);
      }
    },
    [onChange],
  );

  const getError = (key, value) => {
    if (!value) return null;
    if (!isValidTrigger(value)) {
      return 'Must be a single non-alphanumeric character';
    }
    // Check for duplicates
    const allValues = TRIGGER_FIELDS.map(f => values?.[f.key] || f.defaultValue);
    const currentIndex = TRIGGER_FIELDS.findIndex(f => f.key === key);
    const isDuplicate = allValues.some((v, i) => i !== currentIndex && v === value);
    if (isDuplicate) {
      return 'Trigger must be unique';
    }
    return null;
  };

  return (
    <Box sx={styles.root}>
      <Typography
        variant="body2"
        sx={styles.description}
      >
        Configure the trigger characters that activate mention dropdowns in chat and agent instructions. Each
        trigger must be a single non-alphanumeric character and must be unique. Changes require a browser
        refresh to take effect.
      </Typography>

      {TRIGGER_FIELDS.map(field => {
        const value = values?.[field.key] ?? field.defaultValue;
        const error = getError(field.key, value);

        return (
          <Box
            key={field.key}
            sx={styles.fieldCard}
          >
            <Box sx={[styles.fieldRow, !!error && styles.fieldRowWithError]}>
              <Box sx={styles.fieldLabel}>
                <Typography
                  variant="body2"
                  sx={styles.fieldTitle}
                >
                  {field.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={styles.fieldHint}
                >
                  {field.hint}
                </Typography>
              </Box>
              <TextField
                value={value}
                onChange={handleChange(field.key)}
                error={!!error}
                helperText={error}
                size="small"
                inputProps={{ maxLength: 1 }}
                sx={styles.input}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
});

ChatMentions.displayName = 'ChatMentions';

/** @type {MuiSx} */
const chatMentionsStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  description: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.8125rem',
    lineHeight: 1.6,
  }),
  // The background lives here (rather than on fieldRow) so the card can keep its rounded
  // corners without `overflow: hidden`, which would clip the absolutely positioned error.
  fieldCard: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.table}`,
    borderRadius: '0.5rem',
    backgroundColor: palette.background.tabPanel,
  }),
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
  },
  // Reserves room inside the card for the absolutely positioned error, which is out of flow.
  fieldRowWithError: {
    paddingBottom: '2rem',
  },
  fieldLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    flex: 1,
  },
  fieldTitle: {
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  fieldHint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.75rem',
  }),
  input: {
    width: '5rem',
    flexShrink: 0,
    // Anchor for the absolutely positioned helper text below.
    position: 'relative',
    // Matches the Support Assistant fields (size="small" + 0.875rem) so both pages
    // render inputs at the same height.
    '& .MuiInputBase-input': {
      fontSize: '0.875rem',
      textAlign: 'center',
      fontFamily: 'monospace',
    },
    // Lifted out of the 5rem-wide field so the message is not wrapped or clipped.
    '& .MuiFormHelperText-root': {
      position: 'absolute',
      top: '100%',
      right: 0,
      margin: '0.25rem 0 0',
      whiteSpace: 'nowrap',
      fontSize: '0.75rem',
    },
  },
});

export default ChatMentions;
