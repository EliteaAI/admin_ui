import { memo, useEffect, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { useMandateActionMutation } from '@/api/governance.api';
import { toGovernanceError } from '@/pages/GovernancePage/helpers/governance.helpers';

/**
 * What a consent will cover: the toolkits whose Microsoft sign-in credentials the mandate's agent version uses now
 * (the backend's `consent_preview`, nothing is written). A credential granted or re-approved later needs a new consent.
 */
const ConsentScopeNotice = memo(props => {
  const { projectId, mandateId } = props;

  const styles = consentScopeNoticeStyles();

  const [preview] = useMandateActionMutation();
  const [covered, setCovered] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    preview({ projectId, mandateId, action: 'consent_preview' })
      .unwrap()
      .then(result => active && setCovered(result.covered ?? []))
      .catch(err => active && setError(toGovernanceError(err, 'The covered credentials could not be read.')));
    return () => {
      active = false;
    };
  }, [preview, projectId, mandateId]);

  if (error) {
    return (
      <Typography
        variant="bodySmall"
        color="error"
        data-testid="mandate-consent-scope-error"
      >
        {error.message}
      </Typography>
    );
  }
  if (covered == null) return <CircularProgress size="1rem" />;

  return (
    <Box
      sx={styles.root}
      data-testid="mandate-consent-scope"
    >
      <Typography variant="labelMedium">Covers the Microsoft sign-in credentials of</Typography>
      {covered.map(item => (
        <Typography
          key={item.toolkits.join(',')}
          variant="bodyMedium"
        >
          {item.toolkits.join(', ')}
        </Typography>
      ))}
      <Typography
        variant="bodySmall"
        sx={styles.muted}
      >
        A credential granted or approved again later needs a new consent.
      </Typography>
    </Box>
  );
});

ConsentScopeNotice.displayName = 'ConsentScopeNotice';

/** @type {MuiSx} */
const consentScopeNoticeStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  muted: ({ palette }) => ({
    color: palette.text.metrics,
  }),
});

export default ConsentScopeNotice;
