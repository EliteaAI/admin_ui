import { memo, useCallback, useMemo, useState } from 'react';

import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import AddOutlined from '@mui/icons-material/AddOutlined';
import AutorenewOutlined from '@mui/icons-material/AutorenewOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import GroupsOutlined from '@mui/icons-material/GroupsOutlined';
import KeyOutlined from '@mui/icons-material/KeyOutlined';
import LinkOffOutlined from '@mui/icons-material/LinkOffOutlined';
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined';
import SyncOutlined from '@mui/icons-material/SyncOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  useScimGroupListQuery,
  useScimGroupSyncMutation,
  useScimGroupUnlinkMutation,
  useScimTokenCreateMutation,
  useScimTokenListQuery,
  useScimTokenRevokeMutation,
  useScimTokenRotateMutation,
} from '@/api/scim.api';
import { CollapsibleSection } from '@/components/CollapsibleSection';
import { GridTableBody, GridTableContainer, GridTableHeader, GridTableRow } from '@/components/GridTable';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns.hooks';

import GraphNestingCard from './components/GraphNestingCard';
import ScimUsersAudit from './components/ScimUsersAudit';
import TokenIssuedDialog from './components/TokenIssuedDialog';
import UnlinkGroupDialog from './components/UnlinkGroupDialog';

const TOKEN_COLUMNS = [
  { field: 'name', label: 'Name', width: '1.2fr', sortable: false },
  { field: 'last4', label: 'Token', width: '8rem', sortable: false },
  { field: 'last_used_at', label: 'Last used', width: '12rem', sortable: false, hideBelow: 900 },
  { field: 'revoked_at', label: 'Status', width: '8rem', sortable: false },
  { field: 'actions', label: '', sortable: false },
];

const GROUP_COLUMNS = [
  { field: 'display_name', label: 'Group', width: '1.2fr', sortable: false },
  { field: 'project_name', label: 'Project', width: '1.2fr', sortable: false },
  { field: 'status', label: 'Status', width: '8rem', sortable: false },
  { field: 'member_count', label: 'Members', width: '7rem', sortable: false },
  { field: 'children', label: 'Nesting', width: '1fr', sortable: false, hideBelow: 1100 },
  { field: 'last_activity_at', label: 'Last activity', width: '12rem', sortable: false, hideBelow: 1000 },
  { field: 'actions', label: '', sortable: false },
];

const STATUS_CHIPS = {
  pending: { label: 'Pending', color: 'default' },
  active: { label: 'Active', color: 'primary' },
  removed: { label: 'Removed', color: 'default' },
  error: { label: 'Error', color: 'error' },
};

const formatDate = value => (value ? new Date(value).toLocaleString() : '-');

const errorText = (err, fallback) => err?.data?.error ?? err?.error ?? fallback;

const ScimSection = memo(() => {
  const styles = useMemo(() => scimSectionStyles(), []);

  const [tokenName, setTokenName] = useState('');
  const [issued, setIssued] = useState(null);
  const [unlinkTarget, setUnlinkTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [expanded, setExpanded] = useState({ tokens: false, nesting: false, users: false, groups: false });

  const tokens = useScimTokenListQuery();
  const groups = useScimGroupListQuery();
  const [createToken, { isLoading: isCreating }] = useScimTokenCreateMutation();
  const [rotateToken] = useScimTokenRotateMutation();
  const [revokeToken] = useScimTokenRevokeMutation();
  const [syncGroup] = useScimGroupSyncMutation();
  const [unlinkGroup, { isLoading: isUnlinking }] = useScimGroupUnlinkMutation();

  const tokenRows = useMemo(() => tokens.data?.rows ?? [], [tokens.data]);
  const groupRows = useMemo(() => groups.data?.rows ?? [], [groups.data]);
  const baseUrl = tokens.data?.base_url ?? '';

  const tokenColumns = useResponsiveColumns({
    columns: TOKEN_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: '6rem',
  });
  const groupColumns = useResponsiveColumns({
    columns: GROUP_COLUMNS,
    containerWidth: window.innerWidth,
    showCheckbox: false,
    actionsColumnWidth: '8rem',
  });

  const notify = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);
  const closeSnackbar = useCallback(() => setSnackbar(prev => ({ ...prev, open: false })), []);
  const closeIssued = useCallback(() => setIssued(null), []);
  const toggleSection = useCallback(id => setExpanded(prev => ({ ...prev, [id]: !prev[id] })), []);

  const handleTokenNameChange = useCallback(event => setTokenName(event.target.value), []);

  const runAction = useCallback(
    async (action, success, failure) => {
      try {
        const result = await action().unwrap();
        if (success) notify(success);
        return result;
      } catch (err) {
        notify(errorText(err, failure), 'error');
        return null;
      }
    },
    [notify],
  );

  const handleCreateToken = useCallback(async () => {
    const result = await runAction(
      () => createToken({ name: tokenName.trim() }),
      null,
      'Failed to issue a token.',
    );
    if (result) {
      setTokenName('');
      setIssued(result.token);
    }
  }, [runAction, createToken, tokenName]);

  const handleRotate = useCallback(
    async row => {
      const result = await runAction(() => rotateToken({ id: row.id }), null, 'Failed to rotate the token.');
      if (result) setIssued(result.token);
    },
    [runAction, rotateToken],
  );

  const handleRevoke = useCallback(
    row => runAction(() => revokeToken({ id: row.id }), `Token "${row.name}" revoked.`, 'Failed to revoke.'),
    [runAction, revokeToken],
  );

  const handleSync = useCallback(
    row =>
      runAction(
        () => syncGroup({ groupId: row.id }),
        `Sync of "${row.display_name}" started.`,
        'Failed to start the sync.',
      ),
    [runAction, syncGroup],
  );

  const closeUnlink = useCallback(() => setUnlinkTarget(null), []);

  const handleUnlink = useCallback(async () => {
    const group = unlinkTarget;
    await runAction(
      () => unlinkGroup({ groupId: group.id }),
      `"${group.display_name}" unlinked; it is mapped again on the next sync.`,
      'Failed to unlink the group.',
    );
    setUnlinkTarget(null);
  }, [runAction, unlinkGroup, unlinkTarget]);

  const renderTokenCell = useCallback(
    (column, value) => {
      if (column.field === 'last4') {
        return <Typography variant="bodyMedium">…{value}</Typography>;
      }
      if (column.field === 'last_used_at') {
        return <Typography variant="bodyMedium">{formatDate(value)}</Typography>;
      }
      if (column.field === 'revoked_at') {
        return (
          <Chip
            label={value ? 'Revoked' : 'Active'}
            size="small"
            color={value ? 'default' : 'primary'}
            variant="outlined"
          />
        );
      }
      return (
        <Typography
          variant="bodyMedium"
          sx={styles.cellText}
        >
          {value}
        </Typography>
      );
    },
    [styles],
  );

  const renderTokenActions = useCallback(
    row =>
      row.revoked_at ? null : (
        <Box sx={styles.actionsRow}>
          <Tooltip title="Rotate: revoke and issue a replacement">
            <IconButton
              size="small"
              onClick={() => handleRotate(row)}
            >
              <AutorenewOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Revoke">
            <IconButton
              size="small"
              onClick={() => handleRevoke(row)}
            >
              <BlockOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    [styles, handleRotate, handleRevoke],
  );

  const renderGroupCell = useCallback(
    (column, value, row) => {
      if (column.field === 'status') {
        const chip = STATUS_CHIPS[value] ?? STATUS_CHIPS.pending;
        return (
          <Tooltip title={row.error ?? ''}>
            <Chip
              label={chip.label}
              size="small"
              color={chip.color}
              variant="outlined"
            />
          </Tooltip>
        );
      }
      if (column.field === 'project_name') {
        return (
          <Typography
            variant="bodyMedium"
            sx={styles.cellText}
          >
            {row.project_id ? `${value ?? '-'} (#${row.project_id})` : '-'}
          </Typography>
        );
      }
      if (column.field === 'member_count') {
        return (
          <Tooltip title="Direct members / with nested groups">
            <Typography variant="bodyMedium">
              {value}
              {row.effective_member_count !== value ? ` / ${row.effective_member_count}` : ''}
            </Typography>
          </Tooltip>
        );
      }
      if (column.field === 'children') {
        const parts = [
          ...(row.parents ?? []).map(name => `in ${name}`),
          ...(value ?? []).map(name => `has ${name}`),
        ];
        return (
          <Typography
            variant="bodyMedium"
            sx={styles.cellText}
          >
            {parts.length ? parts.join(', ') : '-'}
          </Typography>
        );
      }
      if (column.field === 'last_activity_at') {
        return <Typography variant="bodyMedium">{formatDate(value)}</Typography>;
      }
      return (
        <Tooltip title={row.external_id ?? ''}>
          <Typography
            variant="bodyMedium"
            sx={styles.cellText}
          >
            {value ?? '-'}
          </Typography>
        </Tooltip>
      );
    },
    [styles],
  );

  const renderGroupActions = useCallback(
    row =>
      row.status === 'removed' ? null : (
        <Box sx={styles.actionsRow}>
          {row.project_id && (
            <Tooltip title="Unlink: remove synced members and map the group again by name">
              <IconButton
                size="small"
                onClick={() => setUnlinkTarget(row)}
              >
                <LinkOffOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Sync now: link or create the project and update its members">
            <IconButton
              size="small"
              onClick={() => handleSync(row)}
            >
              <SyncOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    [styles, handleSync],
  );

  if (tokens.isError && tokens.error?.status === 404) {
    return (
      <Typography
        variant="bodyMedium"
        sx={styles.description}
      >
        SCIM provisioning is not enabled on this deployment. Set scim.enabled in the admin plugin config.
      </Typography>
    );
  }

  return (
    <Box sx={styles.root}>
      <Typography
        variant="body2"
        sx={styles.description}
      >
        The IdP (Microsoft Entra ID enterprise app, provisioning mode Automatic) pushes users and groups here
        over SCIM. Every group assigned to the app becomes a team project with the group&apos;s name. Members
        get the Viewer role and leave the project when they leave the group. These projects can only be
        changed in the IdP; admins can change member roles only.
      </Typography>

      <Box sx={styles.urlRow}>
        <TextField
          size="small"
          label="Tenant URL"
          value={baseUrl}
          sx={styles.urlField}
          slotProps={{ input: { readOnly: true } }}
        />
      </Box>

      <CollapsibleSection
        icon={KeyOutlined}
        title="Tokens"
        count={
          tokenRows.length ? `${tokenRows.length} ${tokenRows.length === 1 ? 'token' : 'tokens'}` : undefined
        }
        sectionId="tokens"
        expanded={expanded.tokens}
        onToggle={toggleSection}
      >
        <Box sx={styles.urlRow}>
          <TextField
            size="small"
            label="Token name"
            placeholder="e.g. Entra production"
            value={tokenName}
            onChange={handleTokenNameChange}
          />
          <Button
            size="small"
            variant="contained"
            startIcon={<AddOutlined />}
            disabled={!tokenName.trim() || isCreating}
            onClick={handleCreateToken}
            sx={styles.button}
          >
            Issue token
          </Button>
        </Box>
        <GridTableContainer
          isLoading={tokens.isFetching}
          isEmpty={tokenRows.length === 0}
          emptyMessage="No tokens yet. Issue one and paste it into the IdP as the Secret Token."
        >
          <GridTableHeader
            columns={tokenColumns.visibleColumns}
            gridTemplateColumns={tokenColumns.gridTemplateColumns}
            showCheckbox={false}
          />
          <GridTableBody>
            {tokenRows.map(row => (
              <GridTableRow
                key={row.id}
                row={row}
                columns={tokenColumns.dataColumns}
                gridTemplateColumns={tokenColumns.gridTemplateColumns}
                showCheckbox={false}
                idField="id"
                rowSx={row.revoked_at ? styles.inactiveRow : undefined}
                renderCell={renderTokenCell}
                renderActions={renderTokenActions}
              />
            ))}
          </GridTableBody>
        </GridTableContainer>
      </CollapsibleSection>

      <CollapsibleSection
        icon={AccountTreeOutlined}
        title="Nested groups"
        sectionId="nesting"
        expanded={expanded.nesting}
        onToggle={toggleSection}
      >
        <GraphNestingCard onNotify={notify} />
      </CollapsibleSection>

      <CollapsibleSection
        icon={ManageAccountsOutlined}
        title="Users audit"
        sectionId="users"
        expanded={expanded.users}
        onToggle={toggleSection}
      >
        <ScimUsersAudit />
      </CollapsibleSection>

      <CollapsibleSection
        icon={GroupsOutlined}
        title="Groups"
        count={
          groupRows.length ? `${groupRows.length} ${groupRows.length === 1 ? 'group' : 'groups'}` : undefined
        }
        sectionId="groups"
        expanded={expanded.groups}
        onToggle={toggleSection}
      >
        {groups.isError ? (
          <Typography
            variant="bodyMedium"
            color="error"
          >
            Failed to load groups.
          </Typography>
        ) : (
          <GridTableContainer
            isLoading={groups.isFetching}
            isEmpty={groupRows.length === 0}
            emptyMessage="No groups provisioned yet. Assign groups to the enterprise app in the IdP."
          >
            <GridTableHeader
              columns={groupColumns.visibleColumns}
              gridTemplateColumns={groupColumns.gridTemplateColumns}
              showCheckbox={false}
            />
            <GridTableBody>
              {groupRows.map(row => (
                <GridTableRow
                  key={row.id}
                  row={row}
                  columns={groupColumns.dataColumns}
                  gridTemplateColumns={groupColumns.gridTemplateColumns}
                  showCheckbox={false}
                  idField="id"
                  rowSx={row.status === 'removed' ? styles.inactiveRow : undefined}
                  renderCell={(column, value) => renderGroupCell(column, value, row)}
                  renderActions={renderGroupActions}
                />
              ))}
            </GridTableBody>
          </GridTableContainer>
        )}
      </CollapsibleSection>

      <UnlinkGroupDialog
        group={unlinkTarget}
        isLoading={isUnlinking}
        onConfirm={handleUnlink}
        onClose={closeUnlink}
      />
      <TokenIssuedDialog
        token={issued}
        baseUrl={baseUrl}
        onClose={closeIssued}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'success' ? 5000 : 10000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={styles.snackbarAlert}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

ScimSection.displayName = 'ScimSection';

/** @type {MuiSx} */
const scimSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  description: ({ palette }) => ({
    color: palette.text.metrics,
    maxWidth: '50rem',
  }),
  urlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  urlField: {
    width: '40rem',
    maxWidth: '100%',
  },
  button: {
    textTransform: 'none',
    flexShrink: 0,
  },
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chips: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.25rem',
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  inactiveRow: {
    opacity: 0.6,
  },
  snackbarAlert: {
    width: '100%',
  },
});

export default ScimSection;
