import { memo } from 'react';

import { Alert } from '@mui/material';

import { PERSONAL_NOTICE } from '@/pages/GovernancePage/components/CredentialsTab/constants/credentials.constants';

/** What a personal credential does until runtime release ships: it is checked for every run, but not used yet. */
const PersonalCredentialNotice = memo(props => {
  const { sx } = props;

  return (
    <Alert
      severity="info"
      sx={sx}
      data-testid="credential-personal-notice"
    >
      {PERSONAL_NOTICE}
    </Alert>
  );
});

PersonalCredentialNotice.displayName = 'PersonalCredentialNotice';

export default PersonalCredentialNotice;
