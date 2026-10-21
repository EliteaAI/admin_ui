import { memo, useMemo } from 'react';

import { useCredentialReferenceGetQuery } from '@/api/governance.api';
import { PERSONAL_NOTICE } from '@/pages/GovernancePage/components/CredentialsTab/constants/credentials.constants';
import { storeLabel } from '@/pages/GovernancePage/components/CredentialsTab/helpers/credentials.helpers';
import DetailDrawer from '@/pages/GovernancePage/components/DetailDrawer';
import GovernanceStateChip from '@/pages/GovernancePage/components/GovernanceStateChip';
import {
  classLabel,
  formatDateTime,
  isPersonal,
  personName,
  referenceTitle,
  toGovernanceError,
} from '@/pages/GovernancePage/helpers/governance.helpers';

const yesNo = value => (value ? 'Yes' : 'No');

/**
 * One credential reference in full: what it is, its lifecycle and how many live grants use it. Metadata only: the
 * backend never sends a stored value, and none is asked for.
 */
const CredentialDetailDrawer = memo(props => {
  const { open, onClose, projectId, row } = props;

  const { currentData: data, error } = useCredentialReferenceGetQuery(
    { projectId, referenceId: row?.id },
    { skip: !open || !row, refetchOnMountOrArgChange: true },
  );

  // The list row is shown at once; the full record replaces it when it arrives
  const reference = data ?? row;

  const sections = useMemo(() => {
    if (!reference) return [];

    const personal = isPersonal(reference);

    const credential = [
      { key: 'configuration', label: 'Configuration', value: referenceTitle(reference) },
      { key: 'provider', label: 'Provider', value: reference.provider },
      { key: 'class', label: 'Class', value: classLabel(reference.ownership_class) },
      ...(personal ? [{ key: 'owner', label: 'Owner', value: personName(reference.owner) }] : []),
      { key: 'store', label: 'Store', value: storeLabel(reference.store_kind) },
    ];

    const lifecycle = [
      {
        key: 'state',
        label: 'State',
        value: (
          <GovernanceStateChip
            state={reference.state}
            testId="credential-state-chip"
          />
        ),
      },
      { key: 'generation', label: 'Generation', value: String(reference.generation ?? 0) },
      { key: 'validated', label: 'Probed at this generation', value: yesNo(reference.validated) },
      ...(!personal && reference.configuration_changed != null
        ? [
            {
              key: 'changed',
              label: 'Configuration changed since import',
              value: yesNo(reference.configuration_changed),
            },
          ]
        : []),
      { key: 'policy', label: 'Policy revision', value: reference.policy_revision },
      { key: 'approval', label: 'Approval reference', value: reference.approval_ref },
      { key: 'approved-by', label: 'Approved by', value: personName(reference.approved_by) },
      { key: 'created-by', label: 'Created by', value: personName(reference.created_by) },
      ...(reference.written_by
        ? [{ key: 'written-by', label: 'Value written by', value: personName(reference.written_by) }]
        : []),
      {
        key: 'expires',
        label: 'Expires',
        value: reference.expires_at ? formatDateTime(reference.expires_at) : null,
      },
      { key: 'created', label: 'Created', value: formatDateTime(reference.created_at) },
      { key: 'updated', label: 'Updated', value: formatDateTime(reference.updated_at) },
      ...(typeof data?.grants_count === 'number'
        ? [{ key: 'grants', label: 'Live grants', value: String(data.grants_count) }]
        : []),
      ...(typeof data?.ledger_in_flight === 'boolean'
        ? [{ key: 'in-flight', label: 'Store write in flight', value: yesNo(data.ledger_in_flight) }]
        : []),
    ];

    return [
      { key: 'credential', title: 'Credential', fields: credential },
      { key: 'lifecycle', title: 'Lifecycle', fields: lifecycle },
    ];
  }, [reference, data]);

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title={row ? referenceTitle(row) : 'Credential'}
      subtitle={row ? `${row.provider ?? ''} · ${classLabel(row.ownership_class)}` : undefined}
      testId="credential-detail-drawer"
      testIdPrefix="credential"
      sections={sections}
      notice={reference && isPersonal(reference) ? PERSONAL_NOTICE : undefined}
      errorText={error ? toGovernanceError(error, 'Failed to load the credential.').message : undefined}
    />
  );
});

CredentialDetailDrawer.displayName = 'CredentialDetailDrawer';

export default CredentialDetailDrawer;
