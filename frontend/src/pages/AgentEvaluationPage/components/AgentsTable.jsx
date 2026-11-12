import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Link, Typography } from '@mui/material';

import { GridTableBody, GridTableHeader, GridTablePagination, GridTableRow } from '@/components/GridTable';
import { ELITEA_UI_BASE } from '@/helpers/env.helpers';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns.hooks';
import {
  buildPaginationProps,
  formatCoverage,
  formatDate,
  formatScore,
  reasonLabel,
  runUrl,
  tierLabel,
  triggerLabel,
} from '@/pages/AgentEvaluationPage/helpers/evalAuto.helpers';

import StatusChip from './StatusChip';

const COLUMNS = [
  { field: 'agent_name', label: 'Agent', width: '1.6fr' },
  { field: 'project_id', label: 'Project', width: '5rem', hideBelow: 700 },
  { field: 'application_version_id', label: 'Version', width: '5rem', hideBelow: 1200 },
  { field: 'status', label: 'Status', width: '8rem' },
  { field: 'headline_score', label: 'Score', width: '5rem' },
  { field: 'coverage', label: 'Coverage', width: '6rem', hideBelow: 800 },
  { field: 'dataset_tier', label: 'Dataset', width: '1.2fr', hideBelow: 1000 },
  { field: 'reason_code', label: 'Reason', width: '1.2fr', hideBelow: 900 },
  { field: 'trigger', label: 'Trigger', width: '6rem', hideBelow: 1300 },
  { field: 'finished_at', label: 'Finished', width: '1.1fr', hideBelow: 1100 },
  { field: 'eval_run_id', label: 'Run', width: '5rem' },
];

const AgentsTable = memo(props => {
  const { rows, total, page, pageSize, onPageChange, onPageSizeChange, onOpen } = props;

  const styles = useMemo(() => agentsTableStyles(), []);

  const [hoveredRowId, setHoveredRowId] = useState(null);

  const { visibleColumns, dataColumns, gridTemplateColumns } = useResponsiveColumns({
    columns: COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
  });

  const paginationProps = useMemo(
    () => buildPaginationProps({ total, page, pageSize, onPageChange, onPageSizeChange }),
    [total, page, pageSize, onPageChange, onPageSizeChange],
  );

  const renderCell = useCallback(
    (column, _, row) => {
      switch (column.field) {
        case 'agent_name':
          return (
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => onOpen(row)}
              sx={styles.link}
              data-testid={`eval-auto-agent-open-${row.id}`}
            >
              {row.agent_name ?? `Agent ${row.application_id}`}
            </Link>
          );
        case 'project_id':
          return String(row.project_id);
        case 'application_version_id':
          return row.application_version_id ? String(row.application_version_id) : '-';
        case 'trigger':
          return triggerLabel(row.trigger);
        case 'status':
          return (
            <StatusChip
              status={row.status}
              testId="eval-auto-status-chip"
            />
          );
        case 'headline_score':
          return formatScore(row.headline_score);
        case 'coverage':
          return formatCoverage(row.coverage);
        case 'dataset_tier':
          return tierLabel(row.dataset_tier);
        case 'reason_code':
          return (
            <Typography
              variant="bodySmall"
              sx={styles.reason}
              title={row.reason_detail ?? ''}
            >
              {reasonLabel(row.reason_code)}
            </Typography>
          );
        case 'finished_at':
          return formatDate(row.finished_at);
        case 'eval_run_id': {
          const href = runUrl(ELITEA_UI_BASE, row);
          return href ? (
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={styles.runLink}
              data-testid={`eval-auto-run-link-${row.id}`}
            >
              #{row.eval_run_id}
            </Link>
          ) : (
            '-'
          );
        }
        default:
          return '-';
      }
    },
    [onOpen, styles],
  );

  return (
    <>
      <GridTableHeader
        columns={visibleColumns}
        gridTemplateColumns={gridTemplateColumns}
        showCheckbox={false}
      />
      <GridTableBody>
        {rows.map(row => (
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
          />
        ))}
      </GridTableBody>
      {total > 0 && (
        <Box data-testid="eval-auto-pagination">
          <GridTablePagination {...paginationProps} />
        </Box>
      )}
    </>
  );
});

AgentsTable.displayName = 'AgentsTable';

/** @type {MuiSx} */
const agentsTableStyles = () => ({
  link: {
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'left',
    fontSize: '0.875rem',
  },
  runLink: {
    fontSize: '0.875rem',
  },
  reason: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

export default AgentsTable;
