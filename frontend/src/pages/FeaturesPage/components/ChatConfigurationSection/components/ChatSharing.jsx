import { memo, useCallback } from 'react';

import { Box, Switch, Typography } from '@mui/material';

const ChatSharing = memo(props => {
  const { values, onChange } = props;

  const styles = chatSharingStyles();

  // A platform that never saved the setting keeps external sharing on
  const externalEnabled = values?.chat_sharing_external_enabled !== false;

  const handleToggleExternal = useCallback(
    e => onChange('chat_sharing_external_enabled', e.target.checked),
    [onChange],
  );

  return (
    <Box sx={styles.root}>
      <Typography
        variant="body2"
        sx={styles.description}
      >
        Control how chats can be shared. Sharing with members of the same project stays available whatever is
        set here.
      </Typography>

      <Box sx={styles.toggleCard}>
        <Box sx={styles.toggleRow}>
          <Box sx={styles.toggleLabel}>
            <Typography
              variant="body2"
              sx={styles.toggleTitle}
            >
              Enable External Chat Sharing
            </Typography>
            <Typography
              variant="caption"
              sx={styles.toggleHint}
            >
              When disabled, the Externally tab of Share Chat is hidden and new external links cannot be
              created, in team and private projects. Links created before keep working.
            </Typography>
          </Box>
          <Switch
            checked={externalEnabled}
            onChange={handleToggleExternal}
            slotProps={{ input: { 'aria-label': 'Enable External Chat Sharing' } }}
            data-testid="chat-sharing-external-switch"
          />
        </Box>
      </Box>
    </Box>
  );
});

ChatSharing.displayName = 'ChatSharing';

/** @type {MuiSx} */
const chatSharingStyles = () => ({
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

export default ChatSharing;
