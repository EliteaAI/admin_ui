import { memo, useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Input from '@mui/material/Input';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import cronstrue from 'cronstrue';

import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import {
  GridTableContainer,
  GridTableHeader,
  GridTableBody,
  GridTableRow,
} from '@/components/GridTable';

const SCHEDULE_COLUMNS = [
  { field: 'name', label: 'Name', width: '1fr', sortable: true },
  { field: 'cron', label: 'Cron', width: '14rem', sortable: false },
  { field: 'active', label: 'Active', width: '5rem', sortable: false },
  { field: 'rpc_func', label: 'Function', width: '1fr', sortable: true },
  { field: 'last_run', label: 'Last Run', width: '12rem', sortable: true },
];

function describeCron(expr) {
  try {
    return cronstrue.toString(expr, { use24HourTimeFormat: true });
  } catch {
    return '';
  }
}

const SchedulesTable = memo(function SchedulesTable({
  schedules = [],
  sortConfig,
  onSort,
  onToggleActive,
  onCronUpdate,
  onScheduleClick,
}) {
  const [editingCronId, setEditingCronId] = useState(null);
  const [cronDraft, setCronDraft] = useState('');
  const [hoveredRowId, setHoveredRowId] = useState(null);

  const { visibleColumns, dataColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: SCHEDULE_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
  });

  const handleCronClick = useCallback((schedule) => {
    setEditingCronId(schedule.id);
    setCronDraft(schedule.cron);
  }, []);

  const handleCronBlur = useCallback(
    (schedule) => {
      setEditingCronId(null);
      onCronUpdate(schedule, cronDraft.trim());
    },
    [cronDraft, onCronUpdate],
  );

  const handleCronKeyDown = useCallback(
    (e, schedule) => {
      if (e.key === 'Enter') {
        setEditingCronId(null);
        onCronUpdate(schedule, cronDraft.trim());
      }
      if (e.key === 'Escape') {
        setEditingCronId(null);
      }
    },
    [cronDraft, onCronUpdate],
  );

  const renderCell = useCallback(
    (column, value, row) => {
      if (column.field === 'name') {
        return (
          <Typography
            variant="bodyMedium"
            color="text.secondary"
            onClick={() => onScheduleClick(row)}
            sx={styles.nameText}
          >
            {value}
          </Typography>
        );
      }

      if (column.field === 'active') {
        return (
          <Switch
            size="small"
            checked={!!value}
            onChange={() => onToggleActive(row)}
          />
        );
      }

      if (column.field === 'cron') {
        if (editingCronId === row.id) {
          return (
            <Input
              autoFocus
              disableUnderline
              value={cronDraft}
              onChange={(e) => setCronDraft(e.target.value)}
              onBlur={() => handleCronBlur(row)}
              onKeyDown={(e) => handleCronKeyDown(e, row)}
              sx={styles.cronInput}
            />
          );
        }
        const desc = describeCron(value);
        return (
          <Box onClick={() => handleCronClick(row)} sx={styles.cronCell}>
            <Typography variant="bodyMedium" color="text.secondary" sx={styles.cronText}>
              {value}
            </Typography>
            {desc && (
              <Typography variant="bodySmall" color="text.metrics" sx={styles.cronDesc}>
                {desc}
              </Typography>
            )}
          </Box>
        );
      }

      if (column.field === 'last_run') {
        if (!value) {
          return (
            <Typography variant="bodyMedium" color="text.metrics" sx={styles.cellText}>
              Never
            </Typography>
          );
        }
        try {
          return (
            <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
              {new Date(value).toLocaleString()}
            </Typography>
          );
        } catch {
          return String(value);
        }
      }

      return (
        <Typography variant="bodyMedium" color="text.secondary" sx={styles.cellText}>
          {value || '\u2014'}
        </Typography>
      );
    },
    [onToggleActive, onScheduleClick, editingCronId, cronDraft, handleCronClick, handleCronBlur, handleCronKeyDown],
  );

  const getRowSx = useCallback((row) => {
    if (!row.active) return styles.inactiveRow;
    return undefined;
  }, []);

  return (
    <Box sx={styles.tableContainer}>
      <GridTableContainer
        isLoading={false}
        isEmpty={schedules.length === 0}
        emptyMessage="No schedules found"
      >
        <GridTableHeader
          columns={visibleColumns}
          sortConfig={sortConfig}
          onSort={onSort}
          gridTemplateColumns={gridTemplateColumns}
          showCheckbox={false}
        />

        <GridTableBody>
          {schedules.map((row) => (
            <GridTableRow
              key={row.id}
              row={row}
              columns={dataColumns}
              isHovered={hoveredRowId === row.id}
              onMouseEnter={() => setHoveredRowId(row.id)}
              onMouseLeave={() => setHoveredRowId(null)}
              gridTemplateColumns={gridTemplateColumns}
              showCheckbox={false}
              renderCell={renderCell}
              rowSx={getRowSx(row)}
            />
          ))}
        </GridTableBody>
      </GridTableContainer>
    </Box>
  );
});

const styles = {
  tableContainer: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  nameText: {
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  cronCell: {
    cursor: 'pointer',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    '&:hover .MuiTypography-root:first-of-type': {
      textDecoration: 'underline',
    },
  },
  cronText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'monospace',
  },
  cronDesc: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '0.6875rem',
    lineHeight: 1.2,
    opacity: 0.7,
  },
  cronInput: ({ palette }) => ({
    fontSize: '0.8125rem',
    fontFamily: 'monospace',
    padding: '0.125rem 0.375rem',
    backgroundColor: palette.background.userInputBackgroundActive,
    borderRadius: '0.25rem',
    width: '100%',
  }),
  inactiveRow: ({ palette }) => ({
    opacity: 0.5,
    backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
  }),
};

export default SchedulesTable;
