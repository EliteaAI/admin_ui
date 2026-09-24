import { memo, useCallback, useState } from 'react';

import { Alert, Box, FormControlLabel, Switch, Typography } from '@mui/material';

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
      <Typography variant="h6">Auto model selection</Typography>
      <Typography variant="body2">
        Add Auto to model pickers for chats and ordinary agents. Pipeline model pickers keep explicit models.
      </Typography>
      <FormControlLabel
        label="Make Auto available on this platform"
        control={
          <Switch
            checked={data?.available === true}
            disabled={!data?.can_manage || isFetching || isLoading}
            onChange={handleAvailableChange}
          />
        }
      />
      <FormControlLabel
        label="Enable Auto by default for projects"
        control={
          <Switch
            checked={data?.project_default === true}
            disabled={!data?.can_manage || !data?.available || isFetching || isLoading}
            onChange={handleProjectDefaultChange}
          />
        }
      />
      <Typography variant="body2">
        Projects can override the default. Turning platform availability off blocks further Auto calls in
        every project. Calls already in flight can finish. Existing model selections are retained.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
    </Box>
  );
});

AutoRoutingSettings.displayName = 'AutoRoutingSettings';

/** @type {MuiSx} */
const autoRoutingSettingsStyles = () => ({
  root: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
});

export default AutoRoutingSettings;
