import { memo, useMemo } from 'react';

import DetailDrawer from '@/pages/GovernancePage/components/DetailDrawer';
import {
  consentLabel,
  identityLabel,
  operationsLabel,
  rowTitle,
} from '@/pages/GovernancePage/components/MandatesTab/helpers/mandates.helpers';
import { formatDateTime, personName, stateLabel } from '@/pages/GovernancePage/helpers/governance.helpers';

/** One mandate: scope, approval and the identity its runs act with. The owner is named, never by subject id. */
const MandateDetailDrawer = memo(props => {
  const { open, onClose, row } = props;

  const sections = useMemo(() => {
    if (!row) return [];
    return [
      {
        key: 'scope',
        title: 'Scope',
        fields: [
          { key: 'covers', label: 'Covers', value: rowTitle(row) },
          { key: 'owner', label: 'Owner', value: personName(row.owner) },
          { key: 'operations', label: 'Runs', value: operationsLabel(row.operations) },
          { key: 'runtime', label: 'Longest run', value: `${Math.round((row.max_runtime_s ?? 0) / 60)} min` },
          { key: 'valid_until', label: 'Valid until', value: formatDateTime(row.valid_until) },
          { key: 'revision', label: 'Revision', value: String(row.revision ?? '-') },
        ],
      },
      {
        key: 'identity',
        title: 'Identity',
        fields: [
          { key: 'source', label: 'Acts with', value: identityLabel(row.identity_source) },
          { key: 'consent', label: 'Consent', value: consentLabel(row) },
          { key: 'consented_at', label: 'Consented at', value: formatDateTime(row.consented_at) },
        ],
      },
      {
        key: 'approval',
        title: 'Approval',
        fields: [
          { key: 'state', label: 'State', value: stateLabel(row.state) },
          { key: 'created_by', label: 'Created by', value: personName(row.created_by) },
          { key: 'approved_by', label: 'Approved by', value: personName(row.approved_by) },
          { key: 'approval_ref', label: 'Approval reference', value: row.approval_ref },
          { key: 'policy_revision', label: 'Policy revision', value: row.policy_revision },
        ],
      },
    ];
  }, [row]);

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={row ? rowTitle(row) : ''}
      subtitle="Mandate"
      testId="mandate-detail"
      testIdPrefix="mandate"
      sections={sections}
    />
  );
});

MandateDetailDrawer.displayName = 'MandateDetailDrawer';

export default MandateDetailDrawer;
