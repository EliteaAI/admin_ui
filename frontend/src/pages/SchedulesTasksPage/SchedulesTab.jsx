import { memo, useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { useScheduleListQuery, useScheduleUpdateMutation } from '@/api/schedulesApi';
import { useTableSort } from '@/hooks/useTableSort';

import SchedulesTable from './SchedulesTable';
import ScheduleHistoryDrawer from './ScheduleHistoryDrawer';

const SchedulesTab = memo(function SchedulesTab({ search }) {
  const { data, isFetching, isError } = useScheduleListQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [updateSchedule] = useScheduleUpdateMutation();
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const { sortConfig, handleSort, sortData } = useTableSort({
    defaultField: 'name',
    defaultDirection: 'asc',
  });

  const filteredRows = useMemo(() => {
    const rows = data?.rows || [];
    if (!search) return rows;
    const lower = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(lower) ||
        r.rpc_func.toLowerCase().includes(lower),
    );
  }, [data, search]);

  const sortedRows = useMemo(() => sortData(filteredRows), [sortData, filteredRows]);

  const handleToggleActive = useCallback(
    (schedule) => {
      updateSchedule({ id: schedule.id, active: !schedule.active });
    },
    [updateSchedule],
  );

  const handleCronUpdate = useCallback(
    (schedule, newCron) => {
      if (newCron && newCron !== schedule.cron) {
        updateSchedule({ id: schedule.id, cron: newCron });
      }
    },
    [updateSchedule],
  );

  const handleScheduleClick = useCallback((schedule) => {
    setSelectedSchedule(schedule);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setSelectedSchedule(null);
  }, []);

  if (isFetching && !data) {
    return (
      <Box sx={styles.loadingContainer}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" width="100%" height="2.5rem" sx={{ mb: '0.5rem' }} />
        ))}
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={styles.errorContainer}>Failed to load schedules.</Box>
    );
  }

  return (
    <Box sx={styles.content}>
      <Box sx={styles.descriptionBox}>
        <Typography variant="bodyMedium" color="text.secondary" sx={styles.descriptionTitle}>
          Cron Schedules
        </Typography>
        <Typography variant="bodyMedium" color="text.metrics" component="div" sx={styles.descriptionText}>
          Background jobs that run automatically on a cron timer.<br />
          Each schedule calls an internal platform function at the configured interval.<br />
          Toggle the switch to enable or disable a schedule.<br />
          Click the cron expression to edit it inline.<br />
          Click a schedule name to view its execution history.
        </Typography>
      </Box>
      <SchedulesTable
        schedules={sortedRows}
        sortConfig={sortConfig}
        onSort={handleSort}
        onToggleActive={handleToggleActive}
        onCronUpdate={handleCronUpdate}
        onScheduleClick={handleScheduleClick}
      />
      <ScheduleHistoryDrawer
        open={selectedSchedule != null}
        onClose={handleDrawerClose}
        schedule={selectedSchedule}
      />
    </Box>
  );
});

const styles = {
  content: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  descriptionBox: ({ palette }) => ({
    padding: '0.75rem 1rem',
    marginTop: '0.5rem',
    marginBottom: '0.75rem',
    marginLeft: '1.5rem',
    marginRight: '1.5rem',
    borderRadius: '0.5rem',
    flexShrink: 0,
    backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    border: `1px solid ${palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
  }),
  descriptionTitle: {
    display: 'block',
    fontWeight: 600,
    fontSize: '0.875rem',
    marginBottom: '0.375rem',
  },
  descriptionText: {
    display: 'block',
    fontSize: '0.8125rem',
    lineHeight: 1.6,
  },
  loadingContainer: {
    width: '100%',
    padding: '1.5rem',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '3rem',
    color: 'error.main',
  },
};

export default SchedulesTab;
