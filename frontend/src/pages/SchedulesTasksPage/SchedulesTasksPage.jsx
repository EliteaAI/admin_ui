import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Tab, Tabs } from '@mui/material';

import { DrawerPage } from '@/components/DrawerPage';
import { DrawerPageHeader } from '@/components/DrawerPageHeader';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';
import { usePageTitle } from '@/hooks/usePageTitle.hooks';

import { ActiveTasksTab } from './components/ActiveTasksTab';
import { SchedulesTab } from './components/SchedulesTab';
import { TasksTab } from './components/TasksTab';

const TABS = ['active-tasks', 'tasks', 'schedules'];
const DEFAULT_TAB = 'active-tasks';

// Ignore unknown hashes so a bogus/stale URL falls back to the default tab.
const tabFromHash = () => {
  const hash = window.location.hash.slice(1);
  return TABS.includes(hash) ? hash : DEFAULT_TAB;
};

const SchedulesTasksPage = memo(() => {
  const styles = schedulesTasksPageStyles();

  usePageTitle('Schedules & Tasks');

  const { hasPermission } = useCheckPermission();

  const [activeTab, setActiveTab] = useState(() => tabFromHash());
  const [search, setSearch] = useState('');

  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  // Keep the tab in sync with browser back/forward.
  useEffect(() => {
    const onHashChange = () => setActiveTab(tabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const canEditSchedules = useMemo(() => hasPermission(PERMISSIONS.scheduling.edit), [hasPermission]);

  const handleTabChange = useCallback((_, newValue) => {
    setActiveTab(newValue);
    setSearch('');
  }, []);

  const handleSearchChange = useCallback(value => {
    setSearch(value);
  }, []);

  const tabsElement = (
    <Tabs
      value={activeTab}
      onChange={handleTabChange}
      sx={styles.tabs}
    >
      <Tab
        label="Active Tasks"
        value="active-tasks"
        sx={styles.tab}
      />
      <Tab
        label="Tasks"
        value="tasks"
        sx={styles.tab}
      />
      <Tab
        label="Schedules"
        value="schedules"
        sx={styles.tab}
      />
    </Tabs>
  );

  return (
    <DrawerPage sx={{ overflow: 'hidden' }}>
      <DrawerPageHeader
        title="System"
        tabs={tabsElement}
        showBorder
        showSearchInput={activeTab === 'schedules' || activeTab === 'tasks' || activeTab === 'active-tasks'}
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder={activeTab === 'schedules' ? 'Search schedules' : 'Search tasks'}
      />

      {activeTab === 'schedules' && (
        <SchedulesTab
          search={search}
          readOnly={!canEditSchedules}
        />
      )}
      {activeTab === 'tasks' && <TasksTab search={search} />}
      {activeTab === 'active-tasks' && <ActiveTasksTab search={search} />}
    </DrawerPage>
  );
});

SchedulesTasksPage.displayName = 'SchedulesTasksPage';

/** @type {MuiSx} */
const schedulesTasksPageStyles = () => ({
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
});

export default SchedulesTasksPage;
