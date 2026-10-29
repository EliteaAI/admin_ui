import { memo, useCallback, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Tab, Tabs } from '@mui/material';

import { DrawerPage } from '@/components/DrawerPage';
import { DrawerPageHeader } from '@/components/DrawerPageHeader';
import { PERMISSIONS } from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';
import { usePageTitle } from '@/hooks/usePageTitle.hooks';

import { CredentialsTab } from './components/CredentialsTab';
import { GrantsTab } from './components/GrantsTab';
import { IdentitiesTab } from './components/IdentitiesTab';
import { MandatesTab } from './components/MandatesTab';
import { OverviewTab } from './components/OverviewTab';

// `permission` hides a tab from operators who could not read it
const TABS = [
  {
    id: 'overview',
    label: 'Overview',
    permission: PERMISSIONS.governance.settings.view,
    Content: OverviewTab,
  },
  {
    id: 'identities',
    label: 'Agent identities',
    permission: PERMISSIONS.governance.bindings.view,
    Content: IdentitiesTab,
  },
  {
    id: 'credentials',
    label: 'Credentials',
    permission: PERMISSIONS.credentials.view,
    Content: CredentialsTab,
  },
  {
    id: 'grants',
    label: 'Grants',
    permission: PERMISSIONS.credentials.view,
    Content: GrantsTab,
  },
  {
    id: 'mandates',
    label: 'Mandates',
    permission: PERMISSIONS.governance.bindings.view,
    Content: MandatesTab,
  },
];

const GovernancePage = memo(() => {
  const styles = governancePageStyles();

  usePageTitle('Governance');

  const { hasPermission } = useCheckPermission();
  const visibleTabs = useMemo(() => TABS.filter(tab => hasPermission(tab.permission)), [hasPermission]);

  // The tab lives in ?tab= so it can be linked to. An unknown or hidden tab falls back to the first visible one.
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const currentTab = visibleTabs.find(tab => tab.id === requestedTab) ?? visibleTabs[0];
  const activeTab = currentTab.id;

  const handleTabChange = useCallback(
    (_, value) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          next.set('tab', value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const tabsElement = (
    <Tabs
      value={activeTab}
      onChange={handleTabChange}
      sx={styles.tabs}
    >
      {visibleTabs.map(tab => (
        <Tab
          key={tab.id}
          label={tab.label}
          value={tab.id}
          sx={styles.tab}
          data-testid={`governance-tab-${tab.id}`}
        />
      ))}
    </Tabs>
  );

  return (
    <DrawerPage>
      <DrawerPageHeader
        title="Governance"
        tabs={tabsElement}
        showBorder
      />
      <currentTab.Content />
    </DrawerPage>
  );
});

GovernancePage.displayName = 'GovernancePage';

/** @type {MuiSx} */
const governancePageStyles = () => ({
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

export default GovernancePage;
