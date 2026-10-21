import { memo, useMemo } from 'react';

import DetailDrawer from '@/pages/GovernancePage/components/DetailDrawer';
import GovernanceStateChip from '@/pages/GovernancePage/components/GovernanceStateChip';
import {
  bindingTitle,
  grantTitle,
  subjectLabel,
  toolkitTitle,
} from '@/pages/GovernancePage/components/GrantsTab/helpers/grants.helpers';
import { classLabel, formatDateTime, personName } from '@/pages/GovernancePage/helpers/governance.helpers';

/** One grant in full, from its list row: what it lets whom use, until when, and who created and approved it. */
const GrantDetailDrawer = memo(props => {
  const { open, onClose, row } = props;

  const sections = useMemo(() => {
    if (!row) return [];

    const grant = [
      { key: 'agent', label: 'Agent', value: bindingTitle(row.binding) },
      {
        key: 'toolkit',
        label: 'Toolkit',
        value: [toolkitTitle(row.toolkit), row.toolkit?.type].filter(Boolean).join(' · '),
      },
      {
        key: 'credential',
        label: 'Credential',
        value: [
          row.credential?.configuration_title ?? row.credential?.provider,
          row.credential?.ownership_class && classLabel(row.credential.ownership_class),
        ]
          .filter(Boolean)
          .join(' · '),
      },
      { key: 'user', label: 'User', value: subjectLabel(row.subject) },
    ];

    const lifecycle = [
      {
        key: 'state',
        label: 'State',
        value: (
          <GovernanceStateChip
            state={row.state}
            testId="grant-state-chip"
          />
        ),
      },
      {
        key: 'valid-from',
        label: 'Valid from',
        value: row.valid_from ? formatDateTime(row.valid_from) : null,
      },
      {
        key: 'valid-until',
        label: 'Valid until',
        value: row.valid_until ? formatDateTime(row.valid_until) : 'No end date',
      },
      { key: 'approval', label: 'Approval reference', value: row.approval_ref },
      { key: 'created-by', label: 'Created by', value: personName(row.created_by) },
      { key: 'approved-by', label: 'Approved by', value: personName(row.approved_by) },
      { key: 'epoch', label: 'Revocation epoch', value: String(row.revocation_epoch ?? 0) },
    ];

    return [
      { key: 'grant', title: 'Grant', fields: grant },
      { key: 'lifecycle', title: 'Lifecycle', fields: lifecycle },
    ];
  }, [row]);

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={row ? grantTitle(row) : 'Grant'}
      subtitle={row ? subjectLabel(row.subject) : undefined}
      testId="grant-detail-drawer"
      testIdPrefix="grant"
      sections={sections}
    />
  );
});

GrantDetailDrawer.displayName = 'GrantDetailDrawer';

export default GrantDetailDrawer;
