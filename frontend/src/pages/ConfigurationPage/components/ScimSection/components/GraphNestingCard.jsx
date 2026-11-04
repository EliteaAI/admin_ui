import { memo, useCallback, useMemo } from 'react';

import { Alert, Box, Button, MenuItem, TextField, Typography } from '@mui/material';

import { useOAuthAppListQuery } from '@/api/oauthApps.api';
import {
  useScimGraphCheckMutation,
  useScimSettingsQuery,
  useScimSettingsUpdateMutation,
} from '@/api/scim.api';

const NONE = '';

const formatDate = value => (value ? new Date(value).toLocaleString() : 'never');

/** The Microsoft Entra app that reads group nesting from Graph (Entra SCIM sends direct members only) */
const GraphNestingCard = memo(props => {
  const { onNotify } = props;

  const styles = graphNestingCardStyles();

  const { data: settings } = useScimSettingsQuery();
  const { data: apps } = useOAuthAppListQuery();
  const [updateSettings, { isLoading: isSaving }] = useScimSettingsUpdateMutation();
  const [checkGraph, { isLoading: isChecking }] = useScimGraphCheckMutation();

  const entraApps = useMemo(
    () => (apps?.rows ?? []).filter(app => (app.provider ?? 'microsoft_entra') === 'microsoft_entra'),
    [apps],
  );
  const selected = settings?.graph_oauth_app_id ?? NONE;
  const status = settings?.graph;

  const handleChange = useCallback(
    async event => {
      try {
        await updateSettings({ graphOauthAppId: event.target.value }).unwrap();
        onNotify('Nesting app saved. Group nesting is being read.');
      } catch (err) {
        onNotify(err?.data?.error ?? err?.error ?? 'Failed to save the app.', 'error');
      }
    },
    [updateSettings, onNotify],
  );

  const handleCheck = useCallback(async () => {
    try {
      const result = await checkGraph().unwrap();
      onNotify(result.message, result.success ? 'success' : 'error');
    } catch (err) {
      onNotify(err?.data?.error ?? err?.error ?? 'Failed to read group nesting.', 'error');
    }
  }, [checkGraph, onNotify]);

  return (
    <Box sx={styles.root}>
      <Typography variant="headingSmall">Nested groups</Typography>
      <Typography
        variant="body2"
        sx={styles.description}
      >
        Entra sends only direct group members. To add users of nested groups to parent projects, pick a
        Microsoft Entra OAuth app with the GroupMember.Read.All application permission (admin consent). Nested
        groups must be assigned to the enterprise app as well.
      </Typography>
      <Box sx={styles.row}>
        <TextField
          select
          size="small"
          label="Entra app"
          value={entraApps.some(app => app.id === selected) ? selected : NONE}
          onChange={handleChange}
          disabled={isSaving}
          sx={styles.select}
        >
          <MenuItem value={NONE}>Off (no nesting)</MenuItem>
          {entraApps.map(app => (
            <MenuItem
              key={app.id}
              value={app.id}
            >
              {app.name}
            </MenuItem>
          ))}
        </TextField>
        <Button
          size="small"
          variant="outlined"
          disabled={!selected || isChecking}
          onClick={handleCheck}
          sx={styles.button}
        >
          Read nesting now
        </Button>
      </Box>
      {status?.error ? (
        <Alert severity="warning">
          Last read failed ({formatDate(status.last_attempt_at)}): {status.error}. The last known nesting is
          kept and nobody is removed because of it.
        </Alert>
      ) : (
        <Typography
          variant="bodySmall"
          sx={styles.description}
        >
          Last read: {formatDate(status?.last_success_at)}
        </Typography>
      )}
    </Box>
  );
});

GraphNestingCard.displayName = 'GraphNestingCard';

/** @type {MuiSx} */
const graphNestingCardStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  description: ({ palette }) => ({
    color: palette.text.metrics,
    maxWidth: '50rem',
  }),
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  select: {
    width: '20rem',
  },
  button: {
    textTransform: 'none',
  },
});

export default GraphNestingCard;
