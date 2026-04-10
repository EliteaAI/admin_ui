import { memo, useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { ResponsiveHeatMap } from '@nivo/heatmap';

const MAX_TICK_LABELS = 15;

/**
 * Format an epoch timestamp (seconds) into a local-time label.
 * Uses 12-hour AM/PM format to match the table's time display.
 */
function formatEpoch(epoch, intervalSec, rangeSec) {
  const dt = new Date(epoch * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  if (intervalSec >= 86400) {
    return `${pad(dt.getMonth() + 1)}/${pad(dt.getDate())}`;
  }
  let hours = dt.getHours();
  const minutes = dt.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const time = `${hours}:${pad(minutes)} ${ampm}`;
  if (rangeSec > 86400) {
    return `${pad(dt.getMonth() + 1)}/${pad(dt.getDate())} ${time}`;
  }
  return time;
}

// Map band label → [durationMin, durationMax) in ms
// durationMax null means unbounded (>=10000)
const BAND_DURATION_MAP = {
  '<10ms':     [0, 10],
  '10-100ms':  [10, 100],
  '100ms-1s':  [100, 1000],
  '1-10s':     [1000, 10000],
  '>10s':      [10000, null],
};

const CustomTooltip = memo(function CustomTooltip({ cell }) {
  if (!cell || cell.value == null) return null;
  return (
    <Box sx={styles.tooltip}>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {cell.serieId}
      </Typography>
      <Typography variant="caption">
        {cell.data.x}: <strong>{cell.value}</strong> event{cell.value !== 1 ? 's' : ''}
      </Typography>
    </Box>
  );
});

const AuditHeatmap = memo(function AuditHeatmap({ data, metadata, isFetching, onCellClick, viewMode }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Convert epoch X values to local-time formatted strings, preserve epoch
  const formattedData = useMemo(() => {
    if (!data || data.length === 0 || !metadata) return null;
    const intervalSec = metadata.interval_seconds;
    const rangeSec = metadata.range_seconds;
    return data.map((series) => ({
      ...series,
      data: series.data.map((d) => ({
        ...d,
        epoch: d.x,
        x: formatEpoch(d.x, intervalSec, rangeSec),
      })),
    }));
  }, [data, metadata]);

  // Thin out X-axis tick labels to ~15 max
  const tickValues = useMemo(() => {
    if (!formattedData || formattedData.length === 0) return [];
    const xLabels = formattedData[0].data.map((d) => d.x);
    if (xLabels.length <= MAX_TICK_LABELS) return xLabels;
    const step = Math.ceil(xLabels.length / MAX_TICK_LABELS);
    return xLabels.filter((_, i) => i % step === 0);
  }, [formattedData]);

  const handleClick = useCallback((cell) => {
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
  }, [onCellClick, metadata]);

  // No data at all — hide the chart
  if (!formattedData || formattedData.length === 0) return null;

  // Check if every cell is empty (null) or zero
  const hasNonZero = formattedData.some((series) =>
    series.data.some((d) => d.y != null && d.y > 0),
  );
  if (!hasNonZero) return null;

  const nivoTheme = {
    text: { fill: theme.palette.text.secondary, fontSize: 11 },
    axis: {
      ticks: { text: { fill: theme.palette.text.secondary, fontSize: 10 } },
    },
    tooltip: { container: { background: 'transparent', padding: 0, boxShadow: 'none' } },
  };

  return (
    <Box sx={styles.container}>
      {isFetching && (
        <Box sx={styles.loadingOverlay}>
          <CircularProgress size={24} />
        </Box>
      )}
      {metadata && (
        <Typography variant="caption" sx={styles.metaLabel}>
          {metadata.total_events ?? metadata.total_traces} {viewMode === 'traces' ? 'traces' : 'events'} &middot; {metadata.interval_label} buckets
        </Typography>
      )}
      <Box sx={styles.chartWrapper}>
        <ResponsiveHeatMap
          data={formattedData}
          margin={{ top: 2, right: 16, bottom: 52, left: 68 }}
          valueFormat={(v) => (v > 0 ? String(v) : '')}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 0,
            tickPadding: 4,
            tickRotation: -45,
            tickValues,
          }}
          axisLeft={{
            tickSize: 0,
            tickPadding: 6,
          }}
          colors={isDark
            ? { type: 'sequential', colors: ['#0f2942', '#1d4ed8', '#38bdf8'] }
            : { type: 'sequential', scheme: 'blue_green' }
          }
          emptyColor={isDark ? '#111827' : '#f0f0f0'}
          borderWidth={1}
          borderColor={isDark ? '#1e293b' : '#e0e0e0'}
          enableLabels={false}
          tooltip={CustomTooltip}
          theme={nivoTheme}
          hoverTarget="cell"
          animate={false}
          onClick={handleClick}
        />
      </Box>
    </Box>
  );
});

const styles = {
  container: ({ palette }) => ({
    position: 'relative',
    padding: '0.5rem 1.5rem 0',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  metaLabel: {
    display: 'block',
    color: 'text.secondary',
    fontSize: '0.6875rem',
    marginBottom: '0.125rem',
  },
  chartWrapper: {
    height: '11.5rem',
    cursor: 'pointer',
  },
  tooltip: ({ palette }) => ({
    backgroundColor: palette.background.paper,
    border: `1px solid ${palette.divider}`,
    borderRadius: '0.25rem',
    padding: '0.375rem 0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  }),
};

export default AuditHeatmap;
