import { memo } from 'react';

import InfoOutlined from '@mui/icons-material/InfoOutlined';
import { Box, Tooltip, Typography } from '@mui/material';

const SettingRow = memo(props => {
  const { label, tooltip, stacked = false, children } = props;

  const styles = settingRowStyles(stacked);

  return (
    <Box sx={styles.root}>
      <Box sx={styles.labelColumn}>
        <Typography
          variant="labelMedium"
          sx={styles.label}
        >
          {label}
        </Typography>
        {tooltip && (
          <Tooltip
            title={tooltip}
            placement="top"
          >
            <InfoOutlined sx={styles.infoIcon} />
          </Tooltip>
        )}
      </Box>
      <Box sx={styles.control}>{children}</Box>
    </Box>
  );
});

SettingRow.displayName = 'SettingRow';

/** @type {MuiSx} */
const settingRowStyles = stacked => ({
  root: {
    display: 'grid',
    gridTemplateColumns: stacked ? 'minmax(0, 1fr)' : 'minmax(10rem, 14rem) minmax(0, 1fr)',
    alignItems: stacked ? 'start' : 'center',
    gap: '1rem',
  },
  labelColumn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
  },
  label: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  infoIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.text.metrics,
  }),
  control: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.75rem',
    minWidth: 0,
  },
});

export default SettingRow;
