import { memo, useCallback, useMemo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { ResponsiveHeatMap } from '@nivo/heatmap';

import AuditHeatmapTooltip from './components/AuditHeatmapTooltip';
import { BAND_DURATION_MAP, HEATMAP_MAX_TICK_LABELS } from './constants/auditEvents.constants';
import { formatEpoch } from './helpers/auditEvents.helpers';

const HEATMAP_MARGIN = { top: 2, right: 16, bottom: 52, left: 68 };

const AXIS_LEFT = {
  tickSize: 0,
  tickPadding: 6,
};

const formatCellValue = v => (v > 0 ? String(v) : '');

const AuditHeatmap = memo(props => {
  const { data, metadata, isFetching, onCellClick, viewMode } = props;

  const { palette } = useTheme();

  // Convert epoch X values to local-time formatted strings, preserve epoch
  const formattedData = useMemo(() => {
    if (!data || data.length === 0 || !metadata) return null;
    const intervalSec = metadata.interval_seconds;
    const rangeSec = metadata.range_seconds;
    return data.map(series => ({
      ...series,
      data: series.data.map(d => ({
        ...d,
        epoch: d.x,
        x: formatEpoch(d.x, intervalSec, rangeSec),
      })),
    }));
  }, [data, metadata]);

  // Thin out X-axis tick labels to ~15 max
  const tickValues = useMemo(() => {
    if (!formattedData || formattedData.length === 0) return [];
    const xLabels = formattedData[0].data.map(d => d.x);
    if (xLabels.length <= HEATMAP_MAX_TICK_LABELS) return xLabels;
    const step = Math.ceil(xLabels.length / HEATMAP_MAX_TICK_LABELS);
    return xLabels.filter((_, i) => i % step === 0);
  }, [formattedData]);

  const handleClick = useCallback(
    cell => {
      if (!onCellClick || !metadata || cell.value == null) return;
      const epoch = cell.data.epoch;
      const bandLabel = cell.serieId;
      const intervalSec = metadata.interval_seconds;
      const durationRange = BAND_DURATION_MAP[bandLabel];
      if (!durationRange) return;

      const dateFrom = new Date(epoch * 1000);
      const dateTo = new Date((epoch + intervalSec) * 1000);

      onCellClick({
        dateFrom,
        dateTo,
        bandLabel,
        durationMin: durationRange[0],
        durationMax: durationRange[1],
        timeLabel: cell.data.x,
      });
    },
    [onCellClick, metadata],
  );

  const axisBottom = useMemo(
    () => ({
      tickSize: 0,
      tickPadding: 4,
      tickRotation: -45,
      tickValues,
    }),
    [tickValues],
  );

  // Nivo takes its theme as plain values (font sizes in px numbers), not sx
  const nivoTheme = useMemo(
    () => ({
      text: { fill: palette.text.secondary, fontSize: 11 },
      axis: {
        ticks: { text: { fill: palette.text.secondary, fontSize: 10 } },
      },
      tooltip: {
        container: { background: 'transparent', padding: 0, boxShadow: 'none' },
      },
    }),
    [palette.text.secondary],
  );

  const colors = useMemo(() => ({ type: 'sequential', ...palette.heatmap.scale }), [palette.heatmap.scale]);

  const styles = auditHeatmapStyles();

  // No data at all — hide the chart
  if (!formattedData || formattedData.length === 0) return null;

  // Check if every cell is empty (null) or zero
  const hasNonZero = formattedData.some(series => series.data.some(d => d.y != null && d.y > 0));
  if (!hasNonZero) return null;

  return (
    <Box sx={styles.container}>
      {isFetching && (
        <Box sx={styles.loadingOverlay}>
          <CircularProgress size={24} />
        </Box>
      )}
      {metadata && (
        <Typography
          variant="caption"
          sx={styles.metaLabel}
        >
          {metadata.total_events ?? metadata.total_traces} {viewMode === 'traces' ? 'traces' : 'events'}{' '}
          &middot; {metadata.interval_label} buckets
        </Typography>
      )}
      <Box sx={styles.chartWrapper}>
        <ResponsiveHeatMap
          data={formattedData}
          margin={HEATMAP_MARGIN}
          valueFormat={formatCellValue}
          axisTop={null}
          axisRight={null}
          axisBottom={axisBottom}
          axisLeft={AXIS_LEFT}
          colors={colors}
          emptyColor={palette.heatmap.empty}
          borderWidth={1}
          borderColor={palette.heatmap.border}
          enableLabels={false}
          tooltip={AuditHeatmapTooltip}
          theme={nivoTheme}
          hoverTarget="cell"
          animate={false}
          onClick={handleClick}
        />
      </Box>
    </Box>
  );
});

AuditHeatmap.displayName = 'AuditHeatmap';

/** @type {MuiSx} */
const auditHeatmapStyles = () => ({
  container: ({ palette }) => ({
    position: 'relative',
    padding: '0.5rem 1.5rem 0',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  loadingOverlay: ({ palette }) => ({
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.background.overlay.strong,
    zIndex: 1,
    pointerEvents: 'none',
  }),
  metaLabel: ({ palette }) => ({
    display: 'block',
    color: palette.text.secondary,
    fontSize: '0.6875rem',
    marginBottom: '0.125rem',
  }),
  chartWrapper: {
    height: '11.5rem',
    cursor: 'pointer',
  },
});

export default AuditHeatmap;
