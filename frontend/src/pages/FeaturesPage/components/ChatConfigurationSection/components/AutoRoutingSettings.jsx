import { memo, useCallback, useState } from 'react';

import { Alert, Box, Switch, Typography } from '@mui/material';

import { useAutoRoutingSettingsQuery, useAutoRoutingSettingsSaveMutation } from '@/api/autoRouting.api';

const AutoRoutingSettings = memo(() => {
  const { data, error: readError, isFetching } = useAutoRoutingSettingsQuery();
  const [save, { isLoading }] = useAutoRoutingSettingsSaveMutation();
  const [error, setError] = useState('');
  const change = useCallback(
    async (key, checked) => {
      setError('');
      try {
        await save({
          available: data.available,
          project_default: data.project_default,
          [key]: checked,
        }).unwrap();
      } catch (failure) {
        setError(failure?.data?.error || 'Unable to update Auto model selection');
      }
    },
    [save, data],
  );

  const handleAvailableChange = useCallback((_, value) => change('available', value), [change]);

  const handleProjectDefaultChange = useCallback((_, value) => change('project_default', value), [change]);

  const styles = autoRoutingSettingsStyles();

  if (readError)
    return (
      <Alert severity="error">Administration admin access is required to manage Auto model selection.</Alert>
    );
  return (
    <Box sx={styles.root}>
      <Box sx={styles.toggleCard}>
        <Box sx={styles.toggleRow}>
          <Box sx={styles.toggleLabel}>
            <Typography
              variant="body2"
              sx={styles.toggleTitle}
            >
              Make Auto available on this platform
            </Typography>
            <Typography
              variant="caption"
              sx={styles.toggleHint}
            >
              Allow Auto model selection in chats and standard agents. Pipeline model selectors continue to
              use explicitly selected models.
            </Typography>
          </Box>
          <Switch
            checked={data?.available === true}
            disabled={!data?.can_manage || isFetching || isLoading}
            onChange={handleAvailableChange}
            inputProps={{ 'aria-label': 'Make Auto available on this platform' }}
          />
        </Box>
      </Box>

      <Box sx={styles.toggleCard}>
        <Box sx={styles.toggleRow}>
          <Box sx={styles.toggleLabel}>
            <Typography
              variant="body2"
              sx={styles.toggleTitle}
            >
              Enable Auto by default for projects
            </Typography>
            <Typography
              variant="caption"
              sx={styles.toggleHint}
            >
              Use Auto as the project default. Projects can override this setting.
            </Typography>
          </Box>
          <Switch
            checked={data?.project_default === true}
            disabled={!data?.can_manage || !data?.available || isFetching || isLoading}
            onChange={handleProjectDefaultChange}
            inputProps={{ 'aria-label': 'Enable Auto by default for projects' }}
          />
        </Box>
      </Box>

      <Typography
        variant="body2"
        sx={styles.description}
      >
        Turning off platform availability blocks new Auto requests in all projects. Requests already in
        progress can finish, and existing model selections are retained.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
    </Box>
  );
});

AutoRoutingSettings.displayName = 'AutoRoutingSettings';

/** @type {MuiSx} */
const autoRoutingSettingsStyles = () => ({
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

export default AutoRoutingSettings;
