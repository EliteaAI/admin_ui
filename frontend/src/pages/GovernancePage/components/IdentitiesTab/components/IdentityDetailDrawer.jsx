import { memo, useMemo } from 'react';

import { useAgentIdentityGetQuery } from '@/api/governance.api';
import DrawerShell from '@/pages/GovernancePage/components/DrawerShell';
import { DIGEST_STATUS } from '@/pages/GovernancePage/components/IdentitiesTab/constants/identities.constants';
import {
  modeLabel,
  rowTitle,
} from '@/pages/GovernancePage/components/IdentitiesTab/helpers/identities.helpers';
import { formatDateTime, toGovernanceError } from '@/pages/GovernancePage/helpers/governance.helpers';

import DigestStatusChip from './DigestStatusChip';
import IdentityDetailSection from './IdentityDetailSection';
import IdentityStateChip from './IdentityStateChip';

const person = user => user?.email ?? (user?.id != null ? `User ${user.id}` : null);

// Only hashes, lengths and counts are shown. The backend sends no instruction text, and none is read here.
const toolLine = tool =>
  [
    `${tool.type ?? 'toolkit'}${tool.name ? ` ${tool.name}` : ''}`,
    tool.credential_configuration_uuid && `configuration ${tool.credential_configuration_uuid}`,
    tool.selected_tools_count != null && `${tool.selected_tools_count} selected tools`,
    tool.selected_tools_sha256 && `sha256 ${tool.selected_tools_sha256}`,
    tool.ref && `agent ${tool.ref}`,
  ]
    .filter(Boolean)
    .join(' · ');

/**
 * One identity in full: its lifecycle, the stored and the current definition digest, and the inputs the digest
 * is made of (model, hashes and counts, never the instruction text).
 */
const IdentityDetailDrawer = memo(props => {
  const { open, onClose, projectId, row } = props;

  const { currentData: data, error } = useAgentIdentityGetQuery(
    { projectId, bindingId: row?.id },
    { skip: !open || !row, refetchOnMountOrArgChange: true },
  );

  // The list row is shown at once; the full record replaces it when it arrives
  const binding = data ?? row;
  const inputs = data?.digest_inputs;

  const sections = useMemo(() => {
    if (!binding) return [];

    const lifecycle = [
      { key: 'state', label: 'State', value: <IdentityStateChip state={binding.state} /> },
      { key: 'mode', label: 'Identity mode', value: modeLabel(binding.identity_mode) },
      { key: 'policy', label: 'Policy revision', value: binding.policy_revision },
      { key: 'approval', label: 'Approval reference', value: binding.approval_ref },
      { key: 'epoch', label: 'Revocation epoch', value: String(binding.revocation_epoch ?? 0) },
      {
        key: 'created',
        label: 'Created',
        value: `${person(binding.created_by) ?? '-'} · ${formatDateTime(binding.created_at)}`,
      },
      {
        key: 'changed',
        label: 'State last changed by',
        value: `${person(binding.state_changed_by) ?? '-'} · ${formatDateTime(binding.updated_at)}`,
      },
      ...(typeof data?.grants_count === 'number'
        ? [{ key: 'grants', label: 'Grants', value: String(data.grants_count) }]
        : []),
    ];

    const definition = [
      { key: 'status', label: 'Definition now', value: <DigestStatusChip status={binding.digest_status} /> },
      {
        key: 'status-hint',
        label: 'What it means',
        value: (DIGEST_STATUS[binding.digest_status] ?? DIGEST_STATUS.unknown).hint,
      },
      {
        key: 'digest-stored',
        label: 'Digest stored',
        value: data?.definition_digest ?? binding.definition_digest,
        mono: true,
      },
      { key: 'digest-now', label: 'Digest now', value: data?.digest_now, mono: true },
    ];

    const digestInputs = inputs
      ? [
          { key: 'agent-type', label: 'Agent type', value: inputs.agent_type },
          { key: 'model', label: 'Model', value: inputs.model },
          {
            key: 'instructions',
            label: 'Instructions',
            value: `${inputs.instructions?.length ?? 0} characters · sha256 ${inputs.instructions?.sha256 ?? '-'}`,
            mono: true,
          },
          {
            key: 'llm-settings',
            label: 'LLM settings',
            value: `sha256 ${inputs.llm_settings_sha256 ?? '-'}`,
            mono: true,
          },
          {
            key: 'tools',
            label: `Toolkits (${inputs.tools?.length ?? 0})`,
            value: (inputs.tools ?? []).map(toolLine).join('\n') || 'None',
            mono: true,
          },
        ]
      : [];

    return [
      { key: 'lifecycle', title: 'Lifecycle', fields: lifecycle },
      { key: 'definition', title: 'Definition', fields: definition },
      ...(digestInputs.length > 0
        ? [{ key: 'inputs', title: 'What the digest is made of', fields: digestInputs }]
        : []),
    ];
  }, [binding, data, inputs]);

  const rows = useMemo(
    () =>
      sections.map(section => ({
        key: section.key,
        testId: `identity-section-${section.key}`,
        content: (
          <IdentityDetailSection
            title={section.title}
            fields={section.fields}
          />
        ),
      })),
    [sections],
  );

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      title={row ? rowTitle(row) : 'Agent identity'}
      subtitle={row ? modeLabel(row.identity_mode) : undefined}
      testId="identity-detail-drawer"
      isLoading={false}
      errorText={error ? toGovernanceError(error, 'Failed to load the identity.').message : undefined}
      rows={rows}
    />
  );
});

IdentityDetailDrawer.displayName = 'IdentityDetailDrawer';

export default IdentityDetailDrawer;
