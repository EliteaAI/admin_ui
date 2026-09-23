import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const AuditHeatmapTooltip = memo(props => {
  const { cell } = props;

  const styles = auditHeatmapTooltipStyles();

  if (!cell || cell.value == null) return null;

  return (
    <Box sx={styles.root}>
      <Typography
        variant="caption"
        sx={styles.title}
      >
        {cell.serieId}
      </Typography>
      <Typography variant="caption">
        {cell.data.x}: <strong>{cell.value}</strong> event
        {cell.value !== 1 ? 's' : ''}
      </Typography>
    </Box>
  );
});

AuditHeatmapTooltip.displayName = 'AuditHeatmapTooltip';

/** @type {MuiSx} */
const auditHeatmapTooltipStyles = () => ({
  root: ({ palette }) => ({
    backgroundColor: palette.background.paper,
    border: `0.0625rem solid ${palette.divider}`,
    borderRadius: '0.25rem',
    padding: '0.375rem 0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    boxShadow: palette.boxShadow.popover,
  }),
  title: {
    fontWeight: 600,
  },
});

export default AuditHeatmapTooltip;
