import { memo, useCallback, useEffect, useState } from 'react';

import { Tab, Tabs } from '@mui/material';

import { DrawerPage } from '@/components/DrawerPage';
import { DrawerPageHeader } from '@/components/DrawerPageHeader';
import { usePageTitle } from '@/hooks/usePageTitle.hooks';

import AgentsTab from './components/AgentsTab';
import ConfigurationTab from './components/ConfigurationTab';
import OverviewTab from './components/OverviewTab';

const TABS = ['overview', 'agents', 'configuration'];
const DEFAULT_TAB = 'overview';

// Ignore unknown hashes so a stale URL falls back to the default tab.
const tabFromHash = () => {
  const hash = window.location.hash.slice(1);
  return TABS.includes(hash) ? hash : DEFAULT_TAB;
};

const AgentEvaluationPage = memo(() => {
  const styles = agentEvaluationPageStyles();

  usePageTitle('Agent Evaluation');

  const [activeTab, setActiveTab] = useState(() => tabFromHash());
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  useEffect(() => {
    const onHashChange = () => setActiveTab(tabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleTabChange = useCallback((_, value) => setActiveTab(value), []);

  // A counter on the overview opens the agents tab filtered to that status.
  const openAgents = useCallback(status => {
    setStatusFilter(status ?? '');
    setActiveTab('agents');
  }, []);

  const tabsElement = (
    <Tabs
      value={activeTab}
      onChange={handleTabChange}
      sx={styles.tabs}
    >
      <Tab
        label="Overview"
        value="overview"
        sx={styles.tab}
        data-testid="eval-auto-tab-overview"
      />
      <Tab
        label="Agents"
        value="agents"
        sx={styles.tab}
        data-testid="eval-auto-tab-agents"
      />
      <Tab
        label="Configuration"
        value="configuration"
        sx={styles.tab}
        data-testid="eval-auto-tab-configuration"
      />
    </Tabs>
  );

  return (
    <DrawerPage sx={styles.page}>
      <DrawerPageHeader
        title="Agent Evaluation"
        tabs={tabsElement}
        showBorder
      />

      {activeTab === 'overview' && <OverviewTab onOpenAgents={openAgents} />}
      {activeTab === 'agents' && (
        <AgentsTab
          status={statusFilter}
          onStatusChange={setStatusFilter}
        />
      )}
      {activeTab === 'configuration' && <ConfigurationTab />}
    </DrawerPage>
  );
});

AgentEvaluationPage.displayName = 'AgentEvaluationPage';

/** @type {MuiSx} */
const agentEvaluationPageStyles = () => ({
  page: {
    overflow: 'hidden',
  },
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

export default AgentEvaluationPage;
