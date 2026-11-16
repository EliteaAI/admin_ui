import { memo, useCallback, useState } from 'react';

import { Box, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from '@mui/material';

import { useEvalAutoItemsQuery } from '@/api/evalAuto.api';
import { GridTableContainer } from '@/components/GridTable';
import { useDebounceValue } from '@/hooks/useDebounceValue.hooks';
import {
  REASON_OPTIONS,
  STATUS_CONFIG,
  STATUS_OPTIONS,
  reasonLabel,
} from '@/pages/AgentEvaluationPage/helpers/evalAuto.helpers';

import AgentHistoryDrawer from './AgentHistoryDrawer';
import AgentsTable from './AgentsTable';

const DEFAULT_PAGE_SIZE = 20;
// Matches the admin API's limit, so a pasted long string never turns into a 400.
const SEARCH_MAX_LENGTH = 200;

/** Each agent's latest scheduled result, filtered by name, status, reason and project, with one agent's history in a drawer. */
const AgentsTab = memo(props => {
  const { status, onStatusChange } = props;

  const styles = agentsTabStyles();

  const [projectText, setProjectText] = useState('');
  const debouncedProject = useDebounceValue(projectText, 300);
  const [searchText, setSearchText] = useState('');
  const search = useDebounceValue(searchText, 300).trim();
  const [reason, setReason] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [openItem, setOpenItem] = useState(null);

  // Anything but a positive integer is no filter, so a half-typed value never reaches the API as a 400.
  const projectId =
    /^\d+$/.test(debouncedProject) && Number(debouncedProject) > 0 ? Number(debouncedProject) : null;

  const { data, isLoading, isError } = useEvalAutoItemsQuery(
    { projectId, status, reason, search, limit: pageSize, offset: page * pageSize },
    { refetchOnMountOrArgChange: true },
  );
  const rows = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleStatusChange = useCallback(
    event => {
      onStatusChange(event.target.value);
      setPage(0);
    },
    [onStatusChange],
  );

  const handleReasonChange = useCallback(event => {
    setReason(event.target.value);
    setPage(0);
  }, []);

  const handleSearchChange = useCallback(event => {
    setSearchText(event.target.value);
    setPage(0);
  }, []);

  const handleProjectChange = useCallback(event => {
    setProjectText(event.target.value.trim());
    setPage(0);
  }, []);

  const handlePageSizeChange = useCallback(value => {
    setPageSize(value);
    setPage(0);
  }, []);

  const handleOpen = useCallback(row => setOpenItem(row), []);
  const handleClose = useCallback(() => setOpenItem(null), []);

  let emptyMessage = null;
  if (!isLoading && !isError && rows.length === 0) {
    emptyMessage =
      status || reason || search || projectId
        ? 'No agents match the filters.'
        : 'No agent has been evaluated on schedule yet.';
  }

  const toolbar = (
    <Box sx={styles.toolbar}>
      <TextField
        size="small"
        label="Search"
        placeholder="Agent name or ID"
        value={searchText}
        onChange={handleSearchChange}
        sx={styles.search}
        slotProps={{ htmlInput: { maxLength: SEARCH_MAX_LENGTH, 'data-testid': 'eval-auto-search' } }}
      />
      <FormControl
        size="small"
        sx={styles.filter}
      >
        <InputLabel
          shrink
          id="eval-auto-status-label"
        >
          Status
        </InputLabel>
        <Select
          labelId="eval-auto-status-label"
          label="Status"
          value={status}
          onChange={handleStatusChange}
          displayEmpty
          notched
          SelectDisplayProps={{ 'data-testid': 'eval-auto-status-filter' }}
        >
          <MenuItem value="">Any status</MenuItem>
          {STATUS_OPTIONS.map(option => (
            <MenuItem
              key={option}
              value={option}
              data-testid={`eval-auto-status-option-${option}`}
            >
              {STATUS_CONFIG[option].label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl
        size="small"
        sx={styles.filter}
      >
        <InputLabel
          shrink
          id="eval-auto-reason-label"
        >
          Reason
        </InputLabel>
        <Select
          labelId="eval-auto-reason-label"
          label="Reason"
          value={reason}
          onChange={handleReasonChange}
          displayEmpty
          notched
          SelectDisplayProps={{ 'data-testid': 'eval-auto-reason-filter' }}
        >
          <MenuItem value="">Any reason</MenuItem>
          {REASON_OPTIONS.map(option => (
            <MenuItem
              key={option}
              value={option}
              data-testid={`eval-auto-reason-option-${option}`}
            >
              {reasonLabel(option)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        size="small"
        label="Project ID"
        value={projectText}
        onChange={handleProjectChange}
        sx={styles.filter}
        slotProps={{ htmlInput: { inputMode: 'numeric', 'data-testid': 'eval-auto-project-filter' } }}
      />
    </Box>
  );

  return (
    <Box
      sx={styles.root}
      data-testid="eval-auto-agents"
    >
      <GridTableContainer
        toolbar={toolbar}
        isLoading={isLoading}
        isEmpty={emptyMessage != null}
        emptyMessage={emptyMessage ?? ''}
      >
        {isError ? (
          <Box sx={styles.error}>
            <Typography
              variant="bodyMedium"
              color="error"
            >
              Failed to load the results.
            </Typography>
          </Box>
        ) : (
          <AgentsTable
            rows={rows}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
            onOpen={handleOpen}
          />
        )}
      </GridTableContainer>

      <AgentHistoryDrawer
        item={openItem}
        onClose={handleClose}
      />
    </Box>
  );
});

AgentsTab.displayName = 'AgentsTab';

/** @type {MuiSx} */
const agentsTabStyles = () => ({
  root: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    maxWidth: '100%',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  filter: {
    minWidth: '10rem',
  },
  search: {
    minWidth: '14rem',
  },
  error: {
    display: 'flex',
    justifyContent: 'center',
    padding: '2rem',
  },
});

export default AgentsTab;
