import { memo } from 'react';

import { Alert } from '@mui/material';

import { PERSONAL_NOTICE } from '@/pages/GovernancePage/components/CredentialsTab/constants/credentials.constants';

/** What a personal credential means for its owner's runs: refused while it is not active, used instead of the shared credential once it is. */
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
