import { afterEach, describe, expect, it, vi } from 'vitest';

import { OverviewTab } from '@/pages/GovernancePage/components/OverviewTab';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  HISTORY_PATH,
  MANAGE,
  SETTINGS_PATH,
  SUMMARY_PATH,
  VIEW,
  emptyHistory,
  fail,
  failingPreflight,
  makeSettings,
  mockApi,
  ok,
  renderWithProviders,
  storedRow,
} from './governanceTest.helpers';

const ENV_VAR = 'ELITEA_CREDENTIAL_GOVERNANCE_ENVIRONMENT';

const setup = async (settings, { permissions = [VIEW, MANAGE], extra = {} } = {}) => {
  const calls = mockApi({
    [`GET ${SETTINGS_PATH}`]: ok(settings),
    [`GET ${HISTORY_PATH}`]: ok(emptyHistory),
    ...extra,
  });
  const user = userEvent.setup();
  renderWithProviders(<OverviewTab />, { permissions });
  if (permissions.includes(VIEW)) await screen.findByTestId('governance-overview');
  return { calls, user };
};

const putCalls = calls => calls.filter(call => call.method === 'PUT');

const pickMode = (user, mode) => user.click(screen.getByTestId(`governance-mode-radio-${mode}`));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('permission gating', () => {
  it('shows a notice and asks the backend for nothing without governance.settings.view', async () => {
    const { calls } = await setup(makeSettings(), { permissions: [] });

    expect(screen.getByTestId('governance-no-access')).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('renders read-only with view alone: disabled fields, no note, no Save', async () => {
    await setup(makeSettings({ stored: storedRow() }), { permissions: [VIEW] });

    expect(screen.getByTestId('governance-policy-revision')).toBeDisabled();
    expect(screen.getByTestId('governance-flag-admit_legacy_pat')).toBeDisabled();
    expect(screen.getByTestId('governance-mode-radio-enforce')).toBeDisabled();
    expect(screen.queryByTestId('governance-save')).not.toBeInTheDocument();
    expect(screen.queryByTestId('governance-change-note')).not.toBeInTheDocument();
    expect(screen.getByTestId('governance-readonly-note')).toBeInTheDocument();
    expect(screen.getByTestId('governance-history-button')).toBeInTheDocument();
  });

  it('offers the note and Save with governance.settings.manage', async () => {
    await setup(makeSettings({ stored: storedRow() }));

    expect(screen.getByTestId('governance-policy-revision')).toBeEnabled();
    expect(screen.getByTestId('governance-change-note')).toBeInTheDocument();
    expect(screen.getByTestId('governance-save')).toBeDisabled();
    expect(screen.queryByTestId('governance-readonly-note')).not.toBeInTheDocument();
  });
});

describe('deployment ceiling', () => {
  it('disables the modes above the ceiling and explains why in the tooltip', async () => {
    const { user } = await setup(makeSettings({ ceiling: { max_mode: 'audit_only', source: 'MAX_MODE' } }));

    expect(screen.getByTestId('governance-mode-radio-off')).toBeEnabled();
    expect(screen.getByTestId('governance-mode-radio-audit_only')).toBeEnabled();
    expect(screen.getByTestId('governance-mode-radio-enforce')).toBeDisabled();

    await user.hover(screen.getByTestId('governance-mode-option-enforce'));
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent(
      "This deployment allows governance up to 'Audit only'. Raising the limit is a deployment change (`ELITEA_CREDENTIAL_GOVERNANCE_MAX_MODE`).",
    );
  });

  it('shows the mode description as the tooltip of an allowed mode', async () => {
    const { user } = await setup(makeSettings());

    await user.hover(screen.getByTestId('governance-mode-option-audit_only'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Every run is checked as if governance were enforced',
    );
  });

  it('tells the operator the saved mode is not in effect when the deployment caps it', async () => {
    await setup(
      makeSettings({
        stored: storedRow({ mode: 'enforce' }),
        effective: { ...makeSettings().effective, mode: 'audit_only', capped: true },
        ceiling: { max_mode: 'audit_only', source: 'MAX_MODE' },
      }),
    );

    expect(screen.getByTestId('governance-capped-banner')).toHaveTextContent(
      "The deployment limits governance to 'Audit only', so the saved mode 'Enforce' is not in effect.",
    );
    expect(screen.getByTestId('governance-effective-mode')).toHaveTextContent('In effect now: Audit only');
    // The saved mode is above the ceiling: nothing can be saved until a lower one is chosen
    await userEvent.type(screen.getByTestId('governance-change-note'), 'x');
    expect(screen.getByTestId('governance-save')).toBeDisabled();
    expect(screen.getByTestId('governance-save-reason')).toHaveTextContent('Choose a lower mode.');
  });
});

describe('locked environment', () => {
  const locked = () =>
    makeSettings({
      stored: storedRow({ environment: 'ignored-by-lock' }),
      effective: { ...makeSettings().effective, environment: 'prod-eu' },
      locks: { environment: { env_var: ENV_VAR } },
    });

  it('shows the deployment value read-only with a lock chip naming the variable', async () => {
    const { user } = await setup(locked());

    expect(screen.getByTestId('governance-environment')).toHaveValue('prod-eu');
    expect(screen.getByTestId('governance-environment')).toBeDisabled();
    expect(screen.getByTestId('governance-environment-lock')).toHaveTextContent(ENV_VAR);

    await user.hover(screen.getByTestId('governance-environment-lock'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Set by the deployment');
  });

  it('does not send the environment while it is locked', async () => {
    const settings = locked();
    const { calls, user } = await setup(settings, {
      extra: { [`PUT ${SETTINGS_PATH}`]: ok(settings) },
    });

    await user.click(screen.getByTestId('governance-flag-admit_legacy_pat'));
    await user.type(screen.getByTestId('governance-change-note'), 'Allow tokens');
    await user.click(screen.getByTestId('governance-save'));

    await waitFor(() => expect(putCalls(calls)).toHaveLength(1));
    expect(putCalls(calls)[0].body).not.toHaveProperty('environment');
  });

  it('leaves the environment editable when the deployment does not set it', async () => {
    await setup(makeSettings());

    expect(screen.getByTestId('governance-environment')).toBeEnabled();
    expect(screen.queryByTestId('governance-environment-lock')).not.toBeInTheDocument();
  });
});

describe('preflight', () => {
  const blocked = (overrides = {}) =>
    makeSettings({
      stored: storedRow({ mode: 'audit_only' }),
      preflight: failingPreflight(),
      ...overrides,
    });

  it('blocks Save for a mode that needs it, with the reason visible', async () => {
    const { user } = await setup(blocked());

    await pickMode(user, 'enforce');
    await user.type(screen.getByTestId('governance-change-note'), 'Go live');

    expect(screen.getByTestId('governance-save')).toBeDisabled();
    expect(screen.getByTestId('governance-save-reason')).toHaveTextContent(
      'Governance cannot be turned on while the preflight fails (Master key).',
    );
  });

  it('lists the failed check with its message', async () => {
    await setup(blocked());

    const check = screen.getByTestId('governance-check-master_key');
    expect(check).toHaveAttribute('data-status', 'fail');
    expect(check).toHaveTextContent('The secrets master key is not set.');
    expect(screen.getByTestId('governance-preflight-state')).toHaveTextContent(
      'Not ready: governance can stay off',
    );
  });

  it('still lets the operator switch to Off', async () => {
    const { user } = await setup(blocked());

    await pickMode(user, 'off');
    await user.type(screen.getByTestId('governance-change-note'), 'Roll back');

    expect(screen.getByTestId('governance-save')).toBeEnabled();
  });

  it('re-reads the settings on Re-check', async () => {
    const { calls, user } = await setup(blocked());
    const before = calls.filter(call => call.path === SETTINGS_PATH).length;

    await user.click(screen.getByTestId('governance-recheck'));

    await waitFor(() => expect(calls.filter(call => call.path === SETTINGS_PATH).length).toBe(before + 1));
  });

  it('warns in red when governance is on but a required service is down', async () => {
    await setup(
      blocked({ effective: { ...makeSettings().effective, mode: 'audit_only', unavailable: true } }),
    );

    expect(screen.getByTestId('governance-unavailable-banner')).toHaveTextContent(
      'Governance is on but a required service is unavailable.',
    );
  });
});

describe('storage not set up', () => {
  it('shows the task to run and keeps Save disabled', async () => {
    const { user } = await setup(makeSettings({ table_present: false, read: 'missing_table' }));

    expect(screen.getByTestId('governance-table-missing')).toHaveTextContent(
      'Run the task create_governance_settings_tables under System → Tasks.',
    );

    await pickMode(user, 'audit_only');
    await user.type(screen.getByTestId('governance-policy-revision'), 'CHG-9');
    await user.type(screen.getByTestId('governance-change-note'), 'Start');

    expect(screen.getByTestId('governance-save')).toBeDisabled();
  });

  it('shows the same notice when a save is refused with MIGRATION_REQUIRED', async () => {
    const { user } = await setup(makeSettings(), {
      extra: {
        [`PUT ${SETTINGS_PATH}`]: fail(409, {
          error: 'Settings storage is not set up. Run the task create_governance_settings_tables.',
          code: 'MIGRATION_REQUIRED',
        }),
      },
    });

    await user.click(screen.getByTestId('governance-flag-admit_legacy_pat'));
    await user.type(screen.getByTestId('governance-change-note'), 'Try');
    await user.click(screen.getByTestId('governance-save'));

    expect(await screen.findByTestId('governance-table-missing')).toBeInTheDocument();
    expect(screen.getByTestId('governance-save')).toBeDisabled();
  });
});

describe('saving', () => {
  it('sends the typed body with expected_revision 0 when nothing is stored, after the confirmation', async () => {
    const saved = makeSettings({ stored: storedRow({ revision: 1 }) });
    const { calls, user } = await setup(makeSettings(), {
      extra: { [`PUT ${SETTINGS_PATH}`]: ok(saved) },
    });

    await pickMode(user, 'audit_only');
    await user.type(screen.getByTestId('governance-policy-revision'), '  CHG-1042 ');
    await user.click(screen.getByTestId('governance-flag-admit_legacy_pat'));
    await user.type(screen.getByTestId('governance-change-note'), ' Start measuring ');
    await user.click(screen.getByTestId('governance-save'));

    // A change of mode asks first, and nothing is sent yet
    const dialog = await screen.findByTestId('governance-switch-dialog');
    expect(within(dialog).getByText('Switch governance to Audit only?')).toBeInTheDocument();
    expect(within(dialog).getByText('Start measuring')).toBeInTheDocument();
    expect(putCalls(calls)).toHaveLength(0);

    await user.click(screen.getByTestId('governance-switch-confirm'));

    await waitFor(() => expect(putCalls(calls)).toHaveLength(1));
    expect(putCalls(calls)[0].body).toEqual({
      mode: 'audit_only',
      policy_revision: 'CHG-1042',
      admit_legacy_pat: true,
      allow_runtime_domain_binding: false,
      environment: '',
      change_note: 'Start measuring',
      expected_revision: 0,
    });
    expect(await screen.findByText('Governance settings saved.')).toBeInTheDocument();
  });

  it('sends the stored revision, and saves a change of flags without a confirmation', async () => {
    const stored = storedRow({ revision: 3 });
    const { calls, user } = await setup(makeSettings({ stored }), {
      extra: { [`PUT ${SETTINGS_PATH}`]: ok(makeSettings({ stored: storedRow({ revision: 4 }) })) },
    });

    await user.click(screen.getByTestId('governance-flag-allow_runtime_domain_binding'));
    await user.type(screen.getByTestId('governance-change-note'), 'Runtime bindings');
    await user.click(screen.getByTestId('governance-save'));

    await waitFor(() => expect(putCalls(calls)).toHaveLength(1));
    expect(screen.queryByTestId('governance-switch-dialog')).not.toBeInTheDocument();
    expect(putCalls(calls)[0].body).toMatchObject({
      mode: 'audit_only',
      policy_revision: 'CHG-1',
      allow_runtime_domain_binding: true,
      change_note: 'Runtime bindings',
      expected_revision: 3,
    });
  });

  it('refreshes after a save and clears the note', async () => {
    const after = makeSettings({ stored: storedRow({ revision: 4, allow_runtime_domain_binding: true }) });
    let current = makeSettings({ stored: storedRow({ revision: 3 }) });
    const { calls, user } = await setup(current, {
      extra: {
        [`GET ${SETTINGS_PATH}`]: () => ok(current),
        [`PUT ${SETTINGS_PATH}`]: () => {
          current = after;
          return ok(after);
        },
      },
    });

    await user.click(screen.getByTestId('governance-flag-allow_runtime_domain_binding'));
    await user.type(screen.getByTestId('governance-change-note'), 'Runtime bindings');
    await user.click(screen.getByTestId('governance-save'));

    await waitFor(() =>
      expect(screen.getByTestId('governance-last-change')).toHaveTextContent('Last change: revision 4'),
    );
    expect(screen.getByTestId('governance-change-note')).toHaveValue('');
    expect(calls.filter(call => call.method === 'GET' && call.path === SETTINGS_PATH).length).toBeGreaterThan(
      1,
    );
  });

  it('asks for a policy revision before audit-only or enforce', async () => {
    const { user } = await setup(makeSettings());

    await pickMode(user, 'enforce');
    await user.type(screen.getByTestId('governance-change-note'), 'Go');

    expect(screen.getByTestId('governance-save')).toBeDisabled();
    expect(screen.getByTestId('governance-save-reason')).toHaveTextContent('A policy revision is required');
  });

  it('keeps Save disabled until there is a change and a note', async () => {
    const { user } = await setup(makeSettings({ stored: storedRow() }));

    await user.type(screen.getByTestId('governance-change-note'), 'No change');
    expect(screen.getByTestId('governance-save')).toBeDisabled();

    await user.click(screen.getByTestId('governance-flag-admit_legacy_pat'));
    expect(screen.getByTestId('governance-save')).toBeEnabled();

    await user.clear(screen.getByTestId('governance-change-note'));
    expect(screen.getByTestId('governance-save')).toBeDisabled();
    expect(screen.getByTestId('governance-save-reason')).toHaveTextContent('Add a change note');
  });

  it('shows the audit-only summary before enforce', async () => {
    const { calls, user } = await setup(makeSettings({ stored: storedRow({ mode: 'audit_only' }) }), {
      extra: {
        [`GET ${SUMMARY_PATH}`]: ok([
          { decision: 'allow', would_deny: true, reason_code: 'NO_ACTIVE_BINDING', count: 7 },
          { decision: 'allow', would_deny: true, reason_code: 'CREDENTIAL_NOT_GRANTED', count: 3 },
        ]),
      },
    });

    await pickMode(user, 'enforce');
    await user.type(screen.getByTestId('governance-change-note'), 'Go live');
    await user.click(screen.getByTestId('governance-save'));

    const body = await screen.findByText(/audit-only recorded 10 runs that would have been refused/);
    expect(body).toBeInTheDocument();
    const reasons = screen.getByTestId('governance-switch-reasons');
    expect(reasons).toHaveTextContent('NO_ACTIVE_BINDING');
    expect(reasons).toHaveTextContent('CREDENTIAL_NOT_GRANTED');
    expect(calls.find(call => call.path === SUMMARY_PATH).params).toEqual({
      since_hours: '24',
      would_deny: 'true',
    });
  });

  it('describes switching to Off in the dialog', async () => {
    const { user } = await setup(makeSettings({ stored: storedRow() }));

    await pickMode(user, 'off');
    await user.type(screen.getByTestId('governance-change-note'), 'Roll back');
    await user.click(screen.getByTestId('governance-save'));

    expect(await screen.findByTestId('governance-switch-body')).toHaveTextContent(
      'Identity, binding and credential checks stop for new runs.',
    );
  });
});

describe('errors', () => {
  const conflict = {
    error: 'The settings changed since they were read; read them again and retry.',
    code: 'REVISION_CONFLICT',
  };

  it('shows the refusal of a direct save with its code chip', async () => {
    const { user } = await setup(makeSettings({ stored: storedRow() }), {
      extra: { [`PUT ${SETTINGS_PATH}`]: fail(409, conflict) },
    });

    await user.click(screen.getByTestId('governance-flag-admit_legacy_pat'));
    await user.type(screen.getByTestId('governance-change-note'), 'Tokens');
    await user.click(screen.getByTestId('governance-save'));

    const alert = await screen.findByTestId('governance-error');
    expect(alert).toHaveTextContent(conflict.error);
    expect(within(alert).getByTestId('governance-error-code')).toHaveTextContent('REVISION_CONFLICT');
    expect(screen.queryByText('Governance settings saved.')).not.toBeInTheDocument();
  });

  it('shows the refusal inside the confirmation dialog, with the failed checks', async () => {
    const { user } = await setup(makeSettings({ stored: storedRow({ mode: 'off' }) }), {
      extra: {
        [`GET ${SUMMARY_PATH}`]: ok([]),
        [`PUT ${SETTINGS_PATH}`]: fail(409, {
          error: 'Governance cannot be turned on until the failed checks are fixed.',
          code: 'PREFLIGHT_FAILED',
          failed_checks: ['master_key'],
        }),
      },
    });

    await pickMode(user, 'enforce');
    await user.type(screen.getByTestId('governance-change-note'), 'Go live');
    await user.click(screen.getByTestId('governance-save'));
    await user.click(await screen.findByTestId('governance-switch-confirm'));

    const dialog = screen.getByTestId('governance-switch-dialog');
    const alert = await within(dialog).findByTestId('governance-error');
    expect(within(alert).getByTestId('governance-error-code')).toHaveTextContent('PREFLIGHT_FAILED');
    expect(alert).toHaveTextContent('Failed checks: Master key');
  });

  it('shows a failed load with its code and lets the operator retry', async () => {
    mockApi({
      [`GET ${SETTINGS_PATH}`]: fail(503, {
        error: 'The settings could not be read or saved. Try again.',
        code: 'DEPENDENCY_UNAVAILABLE',
      }),
    });
    renderWithProviders(<OverviewTab />, { permissions: [VIEW] });

    const alert = await screen.findByTestId('governance-error');
    expect(within(alert).getByTestId('governance-error-code')).toHaveTextContent('DEPENDENCY_UNAVAILABLE');
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});

describe('texts', () => {
  it('prefers the backend text over the built-in copy', async () => {
    const { user } = await setup(
      makeSettings({
        descriptions: {
          modes: { audit_only: { label: 'Shadow', tooltip: 'Backend wording. Second sentence.' } },
          fields: { policy_revision: { label: 'Rules label', tooltip: 'Backend field tooltip' } },
        },
      }),
    );

    const option = screen.getByTestId('governance-mode-option-audit_only');
    expect(option).toHaveTextContent('Shadow');
    expect(option).toHaveTextContent('Backend wording.');
    expect(screen.getByText('Rules label')).toBeInTheDocument();
    // A mode the backend does not describe keeps the design copy
    expect(screen.getByTestId('governance-mode-option-enforce')).toHaveTextContent('Enforce');

    await user.hover(option);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Backend wording. Second sentence.');
  });

  it('shows the last change with who made it', async () => {
    mockApi({
      [`GET ${SETTINGS_PATH}`]: ok(makeSettings({ stored: storedRow({ revision: 7 }) })),
      [`GET ${HISTORY_PATH}`]: ok({
        total: 1,
        table_present: true,
        rows: [
          {
            revision: 7,
            mode: 'audit_only',
            policy_revision: 'CHG-1',
            flags: { admit_legacy_pat: false, allow_runtime_domain_binding: false },
            environment: null,
            change_note: 'Measure',
            changed_by: { id: 7, email: 'admin@example.com' },
            changed_at: '2026-10-20T18:02:00+00:00',
          },
        ],
      }),
    });
    renderWithProviders(<OverviewTab />, { permissions: [VIEW] });

    await waitFor(() =>
      expect(screen.getByTestId('governance-last-change')).toHaveTextContent(
        'Last change: revision 7 by admin@example.com',
      ),
    );
  });
});

describe('development runs (#7213)', () => {
  it('shows the default of the mode while the operator has not chosen, and sends nothing for it', async () => {
    const stored = storedRow({ revision: 3 }); // audit only, allow_development_runs absent
    const { calls, user } = await setup(makeSettings({ stored }), {
      extra: { [`PUT ${SETTINGS_PATH}`]: ok(makeSettings({ stored: storedRow({ revision: 4 }) })) },
    });

    const toggle = screen.getByTestId('governance-flag-allow_development_runs');
    expect(toggle).toBeChecked(); // on under audit only
    expect(screen.getByTestId('governance-flag-allow_development_runs-default')).toHaveTextContent(
      'Default for Audit only',
    );

    await pickMode(user, 'enforce');
    expect(toggle).not.toBeChecked(); // off under enforce until chosen
    expect(screen.getByTestId('governance-flag-allow_development_runs-default')).toHaveTextContent(
      'Default for Enforce',
    );
    await pickMode(user, 'audit_only');

    await user.click(screen.getByTestId('governance-flag-admit_legacy_pat'));
    await user.type(screen.getByTestId('governance-change-note'), 'Tokens');
    await user.click(screen.getByTestId('governance-save'));

    await waitFor(() => expect(putCalls(calls)).toHaveLength(1));
    expect(putCalls(calls)[0].body).not.toHaveProperty('allow_development_runs');
  });

  it('sends the explicit choice once the operator toggles it, and shows the stored choice', async () => {
    const stored = storedRow({ revision: 3, mode: 'enforce', allow_development_runs: null });
    const { calls, user } = await setup(makeSettings({ stored }), {
      extra: {
        [`PUT ${SETTINGS_PATH}`]: ok(
          makeSettings({ stored: storedRow({ revision: 4, mode: 'enforce', allow_development_runs: true }) }),
        ),
      },
    });

    await user.click(screen.getByTestId('governance-flag-allow_development_runs'));
    expect(screen.queryByTestId('governance-flag-allow_development_runs-default')).not.toBeInTheDocument();
    await user.type(screen.getByTestId('governance-change-note'), 'Let developers test');
    await user.click(screen.getByTestId('governance-save'));

    await waitFor(() => expect(putCalls(calls)).toHaveLength(1));
    expect(screen.queryByTestId('governance-switch-dialog')).not.toBeInTheDocument();
    expect(putCalls(calls)[0].body).toMatchObject({
      mode: 'enforce',
      allow_development_runs: true,
      expected_revision: 3,
    });
    await waitFor(() => expect(screen.getByTestId('governance-flag-allow_development_runs')).toBeChecked());
    expect(screen.queryByTestId('governance-flag-allow_development_runs-default')).not.toBeInTheDocument();
  });

  it('is read-only and Save stays blocked while the settings table lacks the column', async () => {
    const { user } = await setup(makeSettings({ stored: storedRow(), columns_present: false }));

    expect(screen.getByTestId('governance-column-missing')).toHaveTextContent(
      'Run the task create_governance_settings_tables',
    );
    await user.click(screen.getByTestId('governance-flag-admit_legacy_pat'));
    await user.type(screen.getByTestId('governance-change-note'), 'Try');
    expect(screen.getByTestId('governance-save')).toBeDisabled();
  });
});
