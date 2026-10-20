import { memo } from 'react';

import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import { Box, Button, Typography } from '@mui/material';

import { checkLabel } from '@/pages/GovernancePage/components/OverviewTab/helpers/governance.helpers';
import { checkSeverity } from '@/pages/GovernancePage/components/OverviewTab/helpers/governanceSettings.helpers';

const SEVERITY_ICONS = {
  success: CheckCircleOutline,
  error: ErrorOutline,
  warning: WarningAmberOutlined,
};

const STATE_SEVERITY = {
  ready: 'success',
  not_ready: 'error',
  ready_with_warnings: 'warning',
};

/** What audit-only and enforce depend on, with a failure text under each check that is not fine. */
const PreflightPanel = memo(props => {
  const { preflight, descriptions, onRecheck, isRechecking = false } = props;

  const styles = preflightPanelStyles();

  const checks = preflight?.checks ?? [];
  const stateSeverity = STATE_SEVERITY[preflight?.state] ?? 'warning';
  const StateIcon = SEVERITY_ICONS[stateSeverity];

  return (
    <Box
      sx={styles.root}
      data-testid="governance-preflight"
      data-state={preflight?.state}
    >
      <Box sx={styles.header}>
        <Box sx={styles.state}>
          <StateIcon
            color={stateSeverity}
            fontSize="small"
          />
          <Typography
            variant="bodyMedium"
            data-testid="governance-preflight-state"
          >
            {descriptions.preflight[preflight?.state] ?? ''}
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={<RefreshOutlined fontSize="small" />}
          disabled={isRechecking}
          onClick={onRecheck}
          data-testid="governance-recheck"
        >
          Re-check
        </Button>
      </Box>

      <Box sx={styles.checks}>
        {checks.map(check => {
          const severity = checkSeverity(check);
          const CheckIcon = SEVERITY_ICONS[severity];
          const message = check.status === 'ok' ? null : (check.message ?? descriptions.checks[check.id]);

          return (
            <Box
              key={check.id}
              sx={styles.check}
              data-testid={`governance-check-${check.id}`}
              data-status={check.status}
            >
              <CheckIcon
                color={severity}
                sx={styles.checkIcon}
              />
              <Box sx={styles.checkText}>
                <Typography variant="labelSmall">{checkLabel(check.id)}</Typography>
                {message && (
                  <Typography
                    variant="bodySmall"
                    sx={styles.checkMessage}
                  >
                    {message}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});

PreflightPanel.displayName = 'PreflightPanel';

/** @type {MuiSx} */
const preflightPanelStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.table}`,
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  state: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  checks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))',
    gap: '0.5rem 1rem',
  },
  check: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  checkIcon: {
    fontSize: '1rem',
    marginTop: '0.0625rem',
  },
  checkText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  checkMessage: ({ palette }) => ({
    color: palette.text.metrics,
  }),
});

export default PreflightPanel;
