import { memo, useCallback, useState } from 'react';

import { Alert, Box, Switch, Typography } from '@mui/material';

import {
  useManualContextTokensSettingsQuery,
  useManualContextTokensSettingsSaveMutation,
} from '@/api/manualContextTokens.api';

const ManualContextTokensSettings = memo(() => {
  const { data, error: readError, isFetching } = useManualContextTokensSettingsQuery();
  const [save, { isLoading }] = useManualContextTokensSettingsSaveMutation();
  const [error, setError] = useState('');

  const handleChange = useCallback(
    async (_, enabled) => {
      setError('');
      try {
        await save({ enabled }).unwrap();
      } catch (failure) {
        setError(failure?.data?.error || 'Unable to update manual Max Context Tokens');
      }
    },
    [save],
  );

  const styles = manualContextTokensSettingsStyles();

  if (readError)
    return <Alert severity="error">Administration admin access is required to manage this setting.</Alert>;
  return (
    <Box sx={styles.root}>
      <Box sx={styles.toggleCard}>
        <Box sx={styles.toggleRow}>
          <Box sx={styles.toggleLabel}>
            <Typography
              variant="body2"
              sx={styles.toggleTitle}
            >
              Allow manual Max Context Tokens (summarization testing)
            </Typography>
            <Typography
              variant="caption"
              sx={styles.toggleHint}
            >
              Platform admins see a Max Context Tokens input in the chat Context Management settings. The
              value replaces the context window mode&apos;s summarization trigger for that chat. Other users
              are not affected.
            </Typography>
          </Box>
          <Switch
            checked={data?.enabled === true}
            disabled={!data?.can_manage || isFetching || isLoading}
            onChange={handleChange}
            inputProps={{ 'aria-label': 'Allow manual Max Context Tokens' }}
          />
        </Box>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
    </Box>
  );
});

ManualContextTokensSettings.displayName = 'ManualContextTokensSettings';

/** @type {MuiSx} */
const manualContextTokensSettingsStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  toggleCard: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.table}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  toggleRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '1rem 1.25rem',
    backgroundColor: palette.background.tabPanel,
  }),
  toggleLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    minWidth: 0,
  },
  toggleTitle: {
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  toggleHint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.75rem',
  }),
});

export default ManualContextTokensSettings;
