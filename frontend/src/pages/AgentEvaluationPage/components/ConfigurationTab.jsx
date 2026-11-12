import { memo } from 'react';

import { Box, Skeleton, Typography } from '@mui/material';

import { useEvalAutoSettingsQuery } from '@/api/evalAuto.api';

import ConfigurationForm from './ConfigurationForm';
import DefaultDatasetSection from './DefaultDatasetSection';

/** The scheduled evaluation's settings and the platform default dataset. Reading needs `evalAuto.view`, saving `evalAuto.edit`. */
const ConfigurationTab = memo(() => {
  const styles = configurationTabStyles();

  const { data, isLoading, isError } = useEvalAutoSettingsQuery();

  return (
    <Box
      sx={styles.root}
      data-testid="eval-auto-configuration"
    >
      {isLoading && (
        <Skeleton
          variant="rectangular"
          height="20rem"
        />
      )}
      {isError && (
        <Typography
          variant="bodyMedium"
          color="error"
        >
          Failed to load the settings.
        </Typography>
      )}
      {data && <ConfigurationForm saved={data} />}
      <DefaultDatasetSection />
    </Box>
  );
});

ConfigurationTab.displayName = 'ConfigurationTab';

/** @type {MuiSx} */
const configurationTabStyles = () => ({
  root: {
    padding: '1.5rem',
    overflow: 'auto',
    maxWidth: '50rem',
  },
});

export default ConfigurationTab;
