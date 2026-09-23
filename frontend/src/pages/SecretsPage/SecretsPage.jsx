import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Tab, Tabs, Typography } from '@mui/material';

import { useSecretListQuery } from '@/api/secrets.api';
import { DrawerPage } from '@/components/DrawerPage';
import { DrawerPageHeader } from '@/components/DrawerPageHeader';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';
import { useDebounceValue } from '@/hooks/useDebounceValue.hooks';
import { usePageTitle } from '@/hooks/usePageTitle.hooks';
import { useTableSort } from '@/hooks/useTableSort.hooks';

import CreateSecretDialog from './components/CreateSecretDialog';
import DeleteSecretDialog from './components/DeleteSecretDialog';
import EditSecretDialog from './components/EditSecretDialog';
import SecretsTable from './components/SecretsTable';
import { isInternalSecret } from './helpers/secrets.helpers';

const SecretsPage = memo(() => {
  const styles = secretsPageStyles();

  usePageTitle('Secrets');

  const { hasPermission } = useCheckPermission();

  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounceValue(search, 300);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editSecretName, setEditSecretName] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSecretName, setDeleteSecretName] = useState('');

  const { data: allSecrets = [], isFetching, isError } = useSecretListQuery();
  const { sortConfig, handleSort, sortData } = useTableSort({
    defaultField: 'name',
  });

  // Split secrets into user vs internal
  const { userSecrets, internalSecrets } = useMemo(() => {
    const user = [];
    const internal = [];
    for (const s of allSecrets) {
      if (isInternalSecret(s.name)) {
        internal.push(s);
      } else {
        user.push(s);
      }
    }
    return { userSecrets: user, internalSecrets: internal };
  }, [allSecrets]);

  const activeSecrets = activeTab === 0 ? userSecrets : internalSecrets;

  const { canCreate, canEdit, canDelete } = useMemo(
    () => ({
      canCreate: hasPermission(PERMISSIONS.secrets.create),
      canEdit: hasPermission(PERMISSIONS.secrets.edit),
      canDelete: hasPermission(PERMISSIONS.secrets.delete),
    }),
    [hasPermission],
  );

  // Client-side search
  const filteredSecrets = useMemo(() => {
    if (!debouncedSearch) return activeSecrets;
    const lower = debouncedSearch.toLowerCase();
    return activeSecrets.filter(s => s.name.toLowerCase().includes(lower));
  }, [activeSecrets, debouncedSearch]);

  // Client-side sort
  const sortedSecrets = useMemo(() => sortData(filteredSecrets), [sortData, filteredSecrets]);

  // Client-side pagination
  const paginatedSecrets = useMemo(
    () => sortedSecrets.slice(page * pageSize, (page + 1) * pageSize),
    [sortedSecrets, page, pageSize],
  );

  // Set of all secret names for duplicate checking in create dialog
  const allSecretNames = useMemo(() => new Set(allSecrets.map(s => s.name)), [allSecrets]);

  // Handlers
  const handleTabChange = useCallback((_, newValue) => {
    setActiveTab(newValue);
    setPage(0);
    setSearch('');
  }, []);

  const handleSearchChange = useCallback(value => {
    setSearch(value);
    setPage(0);
  }, []);

  const handlePageChange = useCallback(newPage => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback(newSize => {
    setPageSize(newSize);
    setPage(0);
  }, []);

  const handleCreateOpen = useCallback(() => setCreateOpen(true), []);
  const handleCreateClose = useCallback(() => setCreateOpen(false), []);

  const handleEditOpen = useCallback(name => {
    setEditSecretName(name);
    setEditOpen(true);
  }, []);
  const handleEditClose = useCallback(() => {
    setEditOpen(false);
    setEditSecretName('');
  }, []);

  const handleDeleteOpen = useCallback(name => {
    setDeleteSecretName(name);
    setDeleteOpen(true);
  }, []);
  const handleDeleteClose = useCallback(() => {
    setDeleteOpen(false);
    setDeleteSecretName('');
  }, []);

  const tabsElement = (
    <Tabs
      value={activeTab}
      onChange={handleTabChange}
      sx={styles.tabs}
    >
      <Tab
        label={`User Secrets (${userSecrets.length})`}
        sx={styles.tab}
      />
      <Tab
        label={`Internal (${internalSecrets.length})`}
        sx={styles.tab}
      />
    </Tabs>
  );

  return (
    <>
      <DrawerPage sx={{ overflow: 'hidden' }}>
        <DrawerPageHeader
          title="Secrets"
          tabs={tabsElement}
          showBorder
          showSearchInput
          search={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by name"
          showAddButton={activeTab === 0 && canCreate}
          onAdd={handleCreateOpen}
          addButtonTooltip="Create secret"
        />

        <Box sx={styles.tableContainer}>
          {isError ? (
            <Box sx={styles.errorContainer}>
              <Typography
                variant="bodyMedium"
                color="error"
              >
                Failed to load secrets.
              </Typography>
            </Box>
          ) : (
            <SecretsTable
              secrets={paginatedSecrets}
              total={filteredSecrets.length}
              page={page}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              sortConfig={sortConfig}
              onSort={handleSort}
              isFetching={isFetching}
              isReadOnly={activeTab === 1 || (!canEdit && !canDelete)}
              onEdit={canEdit ? handleEditOpen : undefined}
              onDelete={canDelete ? handleDeleteOpen : undefined}
            />
          )}
        </Box>
      </DrawerPage>

      <CreateSecretDialog
        open={createOpen}
        onClose={handleCreateClose}
        existingNames={allSecretNames}
      />
      <EditSecretDialog
        open={editOpen}
        onClose={handleEditClose}
        secretName={editSecretName}
      />
      <DeleteSecretDialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        secretName={deleteSecretName}
      />
    </>
  );
});

SecretsPage.displayName = 'SecretsPage';

/** @type {MuiSx} */
const secretsPageStyles = () => ({
  tabs: ({ palette }) => ({
    minHeight: '2.5rem',
    '& .MuiTabs-indicator': {
      backgroundColor: palette.background.tabIndicator,
    },
  }),
  tab: ({ palette }) => ({
    textTransform: 'none',
    minHeight: '2.5rem',
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: palette.text.metrics,
    '&.Mui-selected': {
      color: palette.text.secondary,
    },
  }),
  tableContainer: {
    flex: 1,
    overflow: 'auto',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '2rem',
  },
});

export default SecretsPage;
