import { memo, useCallback } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Tab, Tabs } from '@mui/material';

import { DrawerPage } from '@/components/DrawerPage';
import { DrawerPageHeader } from '@/components/DrawerPageHeader';
import { usePageTitle } from '@/hooks/usePageTitle.hooks';

import ComingSoonTab from './components/ComingSoonTab';
import { OverviewTab } from './components/OverviewTab';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'identities', label: 'Agent identities' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'grants', label: 'Grants' },
  { id: 'mandates', label: 'Mandates' },
];
const DEFAULT_TAB = 'overview';

const GovernancePage = memo(() => {
  const styles = governancePageStyles();

  usePageTitle('Governance');

  // The tab lives in ?tab= so it can be linked to
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = TABS.some(tab => tab.id === requestedTab) ? requestedTab : DEFAULT_TAB;

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
      {TABS.map(tab => (
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
      {activeTab === 'overview' ? (
        <OverviewTab />
      ) : (
        <ComingSoonTab label={TABS.find(tab => tab.id === activeTab).label} />
      )}
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
