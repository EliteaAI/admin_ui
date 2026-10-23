import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IdentitiesTab } from '@/pages/GovernancePage/components/IdentitiesTab';
import store, { setUser } from '@/store';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SETTINGS_PATH, makeSettings, mockApi, ok, renderWithProviders } from './governanceTest.helpers';
import {
  AGENTS_PATH,
  BINDINGS_APPROVE,
  BINDINGS_MANAGE,
  BINDINGS_VIEW,
  LIST_PATH,
  PROJECT,
  PROJECTS_PATH,
  PROJECT_STORAGE_KEY,
  actionPath,
  agentsResponse,
  detailPath,
  listResponse,
  makeDetail,
  makeIdentity,
  refusal,
  rememberProject,
} from './identitiesTest.helpers';

const OPERATOR_ID = 99;

const listCalls = calls => calls.filter(call => call.method === 'GET' && call.path === LIST_PATH);

const openMenu = async (user, id) => {
  await user.click(await screen.findByTestId(`identity-actions-${id}`));
};

const menuActions = () =>
  screen
    .queryAllByTestId(/^identity-action-/)
    .map(item => item.dataset.testid.replace('identity-action-', ''));

beforeEach(() => {
  localStorage.clear();
  rememberProject();
  store.dispatch(setUser({ id: OPERATOR_ID, name: 'Operator', email: 'operator@example.com' }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('list', () => {
  it('asks to choose a project first and sends no request without one', async () => {
    localStorage.clear();
    const calls = mockApi({ [`GET ${PROJECTS_PATH}`]: ok({ total: 0, rows: [] }) });
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW] });

    expect(await screen.findByText('Choose a project to see its agent identities.')).toBeInTheDocument();
    expect(calls.some(call => call.path === LIST_PATH)).toBe(false);
  });

  it('shows agent, version, mode, definition status, state and who created it', async () => {
    mockApi({
      [`GET ${LIST_PATH}`]: listResponse([
        makeIdentity(),
        makeIdentity({
          id: 'b2',
          application: { id: 6, name: 'Triage bot' },
          version: { id: 61, name: 'v14' },
          identity_mode: 'dedicated_agent',
          state: 'pending_approval',
          digest_status: 'changed',
        }),
      ]),
    });
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW] });

    expect(await screen.findByTestId('identity-open-b1')).toHaveTextContent('Jira helper');
    expect(screen.getByTestId('identity-open-b2')).toHaveTextContent('Triage bot');
    const chips = screen.getAllByTestId('identity-state-chip').map(chip => chip.textContent);
    expect(chips).toEqual(['Active', 'Pending approval']);
    expect(screen.getAllByTestId('identity-digest-chip').map(chip => chip.textContent)).toEqual([
      'Match',
      'Changed',
    ]);
    expect(screen.getByText('Elitea native')).toBeInTheDocument();
    expect(screen.getByText('Dedicated agent')).toBeInTheDocument();
    expect(screen.getAllByText('creator@example.com')).toHaveLength(2);
  });

  it('sends the project, the default sort and the page size of 20', async () => {
    const calls = mockApi({ [`GET ${LIST_PATH}`]: listResponse([makeIdentity()]) });
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW] });
    await screen.findByTestId('identity-open-b1');

    expect(listCalls(calls)[0].params).toEqual({
      limit: '20',
      offset: '0',
      sort_by: 'updated_at',
      sort_order: 'desc',
    });
  });

  it('builds the query from the filters, the search, the sort and the page', async () => {
    const rows = Array.from({ length: 10 }, (_, index) => makeIdentity({ id: `b${index}` }));
    const calls = mockApi({
      [`GET ${LIST_PATH}`]: ok({ total: 25, rows }),
    });
    const user = userEvent.setup();
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW] });
    await screen.findByTestId('identity-open-b0');

    await user.click(screen.getByTestId('identities-state-filter'));
    await user.click(await screen.findByTestId('identities-state-suspended'));
    await waitFor(() => expect(listCalls(calls).at(-1).params.state).toBe('suspended'));

    await user.click(screen.getByTestId('identities-mode-filter'));
    await user.click(await screen.findByTestId('identities-mode-dedicated_agent'));
    await waitFor(() => expect(listCalls(calls).at(-1).params.identity_mode).toBe('dedicated_agent'));

    await user.type(screen.getByTestId('identities-search'), 'jira');
    await waitFor(() => expect(listCalls(calls).at(-1).params.search).toBe('jira'));

    const agentHeader = screen
      .getAllByText('Agent')
      .find(element => !element.closest('[data-testid="identities-toolbar"]'));
    await user.click(agentHeader);
    await waitFor(() => expect(listCalls(calls).at(-1).params.sort_by).toBe('application_name'));
    expect(listCalls(calls).at(-1).params).toMatchObject({
      state: 'suspended',
      identity_mode: 'dedicated_agent',
      search: 'jira',
      sort_by: 'application_name',
      sort_order: 'asc',
      offset: '0',
    });
  });

  it('pages with limit and offset and goes back to the first page when a filter changes', async () => {
    const rows = Array.from({ length: 20 }, (_, index) => makeIdentity({ id: `b${index}` }));
    const calls = mockApi({ [`GET ${LIST_PATH}`]: ok({ total: 45, rows }) });
    const user = userEvent.setup();
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW] });
    await screen.findByTestId('identity-open-b0');

    const pageInfo = screen.getByText('1 - 20 of 45');
    await user.click(within(pageInfo.parentElement).getAllByRole('button').at(-1));
    await waitFor(() => expect(listCalls(calls).at(-1).params.offset).toBe('20'));

    await user.click(screen.getByTestId('identities-state-filter'));
    await user.click(await screen.findByTestId('identities-state-active'));
    await waitFor(() =>
      expect(listCalls(calls).at(-1).params).toMatchObject({ state: 'active', offset: '0' }),
    );
  });

  it('says so when the project has no identities and when filters match nothing', async () => {
    mockApi({ [`GET ${LIST_PATH}`]: listResponse([]) });
    const user = userEvent.setup();
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW, BINDINGS_MANAGE] });

    expect(
      await screen.findByText('No agent identities in Team Alpha yet. Use Create identity to add one.'),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId('identities-state-filter'));
    await user.click(await screen.findByTestId('identities-state-retired'));
    expect(await screen.findByText('No agent identities match the filters.')).toBeInTheDocument();
  });

  it('shows the readable refusal with its code when the list cannot be read', async () => {
    mockApi({ [`GET ${LIST_PATH}`]: refusal(403, 'FORBIDDEN', 'You do not have access to this project.') });
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW] });

    expect(await screen.findByTestId('governance-error')).toHaveTextContent(
      'You do not have access to this project.',
    );
    expect(screen.getByTestId('governance-error-code')).toHaveTextContent('FORBIDDEN');
  });
});

describe('project picker', () => {
  it('lists the projects, loads the one chosen and remembers it', async () => {
    localStorage.clear();
    const calls = mockApi({
      [`GET ${PROJECTS_PATH}`]: ok({
        total: 2,
        rows: [
          { id: 12, name: 'Team Alpha' },
          { id: 13, name: 'Team Beta' },
        ],
      }),
      [`GET ${LIST_PATH}`]: listResponse([makeIdentity()]),
    });
    const user = userEvent.setup();
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW] });

    await user.click(screen.getByTestId('governance-project-input'));
    await user.click(await screen.findByText('Team Alpha'));

    expect(await screen.findByTestId('identity-open-b1')).toBeInTheDocument();
    expect(listCalls(calls)).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(PROJECT_STORAGE_KEY))).toEqual(PROJECT);
  });

  it('works when the browser refuses to store the choice', async () => {
    localStorage.clear();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    mockApi({
      [`GET ${PROJECTS_PATH}`]: ok({ total: 1, rows: [{ id: 12, name: 'Team Alpha' }] }),
      [`GET ${LIST_PATH}`]: listResponse([makeIdentity()]),
    });
    const user = userEvent.setup();
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW] });

    await user.click(screen.getByTestId('governance-project-input'));
    await user.click(await screen.findByText('Team Alpha'));

    expect(await screen.findByTestId('identity-open-b1')).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});

describe('row actions and permissions', () => {
  const ROWS = [
    makeIdentity({ id: 'draft', state: 'draft' }),
    makeIdentity({ id: 'provisioning', state: 'provisioning' }),
    makeIdentity({ id: 'pending', state: 'pending_approval' }),
    makeIdentity({ id: 'active', state: 'active' }),
    makeIdentity({ id: 'suspended', state: 'suspended' }),
    makeIdentity({ id: 'retiring', state: 'retiring' }),
    makeIdentity({ id: 'retired', state: 'retired' }),
  ];
  const ALL = [BINDINGS_VIEW, BINDINGS_MANAGE, BINDINGS_APPROVE];

  it.each([
    ['draft', ['details', 'submit', 'retire']],
    ['provisioning', ['details', 'retire']],
    ['pending', ['details', 'activate', 'retire']],
    ['active', ['details', 'suspend', 'rebind', 'retire']],
    ['suspended', ['details', 'resume', 'rebind', 'retire']],
    ['retiring', ['details', 'retire']],
    ['retired', ['details']],
  ])('offers only the valid actions for a %s row', async (id, expected) => {
    mockApi({ [`GET ${LIST_PATH}`]: listResponse(ROWS) });
    const user = userEvent.setup();
    renderWithProviders(<IdentitiesTab />, { permissions: ALL });

    await openMenu(user, id);

    expect(menuActions()).toEqual(expected);
  });

  it('offers only Details to an operator who can view', async () => {
    mockApi({ [`GET ${LIST_PATH}`]: listResponse(ROWS) });
    const user = userEvent.setup();
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW] });

    await openMenu(user, 'active');

    expect(menuActions()).toEqual(['details']);
    expect(screen.queryByTestId('identities-create')).not.toBeInTheDocument();
  });

  it('keeps activation for the approve permission and the rest for the manage permission', async () => {
    mockApi({ [`GET ${LIST_PATH}`]: listResponse(ROWS) });
    const user = userEvent.setup();
    const manageOnly = renderWithProviders(<IdentitiesTab />, {
      permissions: [BINDINGS_VIEW, BINDINGS_MANAGE],
    });

    await openMenu(user, 'pending');
    expect(menuActions()).toEqual(['details', 'retire']);
    await user.keyboard('{Escape}');
    manageOnly.unmount();

    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW, BINDINGS_APPROVE] });
    await openMenu(user, 'pending');
    expect(menuActions()).toEqual(['details', 'activate']);
    expect(screen.queryByTestId('identities-create')).not.toBeInTheDocument();
  });

  it('disables approval, with the reason, for the operator who created the identity', async () => {
    store.dispatch(setUser({ id: 1, name: 'Creator', email: 'creator@example.com' }));
    mockApi({ [`GET ${LIST_PATH}`]: listResponse(ROWS) });
    const user = userEvent.setup();
    renderWithProviders(<IdentitiesTab />, { permissions: ALL });

    await openMenu(user, 'pending');

    expect(screen.getByTestId('identity-action-activate')).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows the create button only with the manage permission', async () => {
    mockApi({ [`GET ${LIST_PATH}`]: listResponse([]) });
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW, BINDINGS_MANAGE] });

    expect(await screen.findByTestId('identities-create')).toBeEnabled();
  });
});

describe('create dialog', () => {
  const setup = (extra = {}) => {
    const calls = mockApi({
      [`GET ${LIST_PATH}`]: listResponse([]),
      [`GET ${AGENTS_PATH}`]: agentsResponse(),
      [`POST ${LIST_PATH}`]: ok({ ok: true, id: 'new-1', state: 'draft', digest: 'sha256:aa' }),
      ...extra,
    });
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW, BINDINGS_MANAGE] });
    return calls;
  };

  const pickAgentAndVersion = async user => {
    await user.click(await screen.findByTestId('identities-create'));
    await user.click(await screen.findByTestId('identity-create-agent'));
    await user.click(await screen.findByText('Jira helper'));
    await user.click(screen.getByTestId('identity-create-version'));
    await user.click(await screen.findByTestId('identity-create-version-52'));
  };

  it('creates the identity for the chosen agent, version and mode', async () => {
    const calls = setup();
    const user = userEvent.setup();

    await pickAgentAndVersion(user);
    await user.click(screen.getByTestId('identity-create-mode'));
    await user.click(await screen.findByTestId('identity-create-mode-dedicated_agent'));
    await user.click(screen.getByTestId('identity-create-submit'));

    await waitFor(() => expect(calls.some(call => call.method === 'POST')).toBe(true));
    expect(calls.find(call => call.method === 'POST').body).toEqual({
      application_id: 5,
      version_id: 52,
      identity_mode: 'dedicated_agent',
    });
    expect(await screen.findByTestId('identities-snackbar')).toHaveTextContent(
      'Identity for Jira helper v48 created as a draft.',
    );
    await waitFor(() => expect(screen.queryByTestId('identity-create-dialog')).not.toBeInTheDocument());
  });

  it('blocks a mode the version already has an identity for', async () => {
    const calls = setup();
    const user = userEvent.setup();

    await user.click(await screen.findByTestId('identities-create'));
    await user.click(await screen.findByTestId('identity-create-agent'));
    await user.click(await screen.findByText('Jira helper'));
    await user.click(screen.getByTestId('identity-create-version'));
    await user.click(await screen.findByTestId('identity-create-version-51'));

    expect(await screen.findByTestId('identity-create-taken')).toBeInTheDocument();
    expect(screen.getByTestId('identity-create-submit')).toBeDisabled();
    expect(calls.some(call => call.method === 'POST')).toBe(false);
  });

  it('keeps Create disabled until an agent and a version are chosen', async () => {
    setup();
    const user = userEvent.setup();

    await user.click(await screen.findByTestId('identities-create'));

    expect(screen.getByTestId('identity-create-submit')).toBeDisabled();
  });

  it('shows the refusal with its code when the identity already exists', async () => {
    setup({
      [`POST ${LIST_PATH}`]: refusal(409, 'BINDING_EXISTS', 'binding already exists; use another action'),
    });
    const user = userEvent.setup();

    await pickAgentAndVersion(user);
    await user.click(screen.getByTestId('identity-create-submit'));

    expect(await screen.findByTestId('governance-error')).toHaveTextContent('binding already exists');
    expect(screen.getByTestId('governance-error-code')).toHaveTextContent('BINDING_EXISTS');
    expect(screen.getByTestId('identity-create-dialog')).toBeInTheDocument();
  });

  it('keeps the runtime domain mode available when the setting cannot be read', async () => {
    setup();
    const user = userEvent.setup();

    await pickAgentAndVersion(user);
    await user.click(screen.getByTestId('identity-create-mode'));

    expect(await screen.findByTestId('identity-create-mode-runtime_domain_binding')).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});

describe('create dialog with the settings readable', () => {
  it('disables the runtime domain mode when the effective setting forbids it', async () => {
    mockApi({
      [`GET ${LIST_PATH}`]: listResponse([]),
      [`GET ${AGENTS_PATH}`]: agentsResponse(),
      [`GET ${SETTINGS_PATH}`]: ok(makeSettings()),
    });
    const user = userEvent.setup();
    renderWithProviders(<IdentitiesTab />, {
      permissions: [BINDINGS_VIEW, BINDINGS_MANAGE, 'governance.settings.view'],
    });

    await user.click(await screen.findByTestId('identities-create'));
    await user.click(await screen.findByTestId('identity-create-agent'));
    await user.click(await screen.findByText('Jira helper'));
    await user.click(screen.getByTestId('identity-create-version'));
    await user.click(await screen.findByTestId('identity-create-version-52'));
    await user.click(screen.getByTestId('identity-create-mode'));

    await waitFor(() =>
      expect(screen.getByTestId('identity-create-mode-runtime_domain_binding')).toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );
  });
});

describe('actions', () => {
  const setup = (rows, handlers = {}, permissions = [BINDINGS_VIEW, BINDINGS_MANAGE, BINDINGS_APPROVE]) => {
    const calls = mockApi({
      [`GET ${LIST_PATH}`]: listResponse(rows),
      ...handlers,
    });
    renderWithProviders(<IdentitiesTab />, { permissions });
    return calls;
  };

  it('confirms suspend and sends the state the operator saw, without approval fields', async () => {
    const calls = setup([makeIdentity()], {
      [`POST ${actionPath('b1')}`]: ok({ ok: true, id: 'b1', state: 'suspended' }),
    });
    const user = userEvent.setup();

    await openMenu(user, 'b1');
    await user.click(screen.getByTestId('identity-action-suspend'));
    expect(screen.getByTestId('identity-confirm-dialog')).toHaveTextContent(
      'Runs admitted earlier with it are stopped at their next check.',
    );
    await user.click(screen.getByTestId('identity-confirm-submit'));

    await waitFor(() => expect(calls.some(call => call.method === 'POST')).toBe(true));
    expect(calls.find(call => call.method === 'POST').body).toEqual({
      action: 'suspend',
      expected_state: 'active',
    });
    expect(await screen.findByTestId('identities-snackbar')).toHaveTextContent('Jira helper v47 suspended.');
  });

  it.each([
    ['draft', 'submit'],
    ['suspended', 'resume'],
    ['active', 'rebind'],
    ['active', 'retire'],
  ])('sends %s -> %s with expected_state', async (state, action) => {
    const calls = setup([makeIdentity({ state })], {
      [`POST ${actionPath('b1')}`]: ok({ ok: true, id: 'b1', state: 'x' }),
    });
    const user = userEvent.setup();

    await openMenu(user, 'b1');
    await user.click(screen.getByTestId(`identity-action-${action}`));
    await user.click(screen.getByTestId('identity-confirm-submit'));

    await waitFor(() => expect(calls.some(call => call.method === 'POST')).toBe(true));
    expect(calls.find(call => call.method === 'POST').body).toEqual({ action, expected_state: state });
  });

  it('refreshes the list after an action', async () => {
    const calls = setup([makeIdentity()], {
      [`POST ${actionPath('b1')}`]: ok({ ok: true, id: 'b1', state: 'suspended' }),
    });
    const user = userEvent.setup();
    await openMenu(user, 'b1');
    await user.click(screen.getByTestId('identity-action-suspend'));
    await user.click(screen.getByTestId('identity-confirm-submit'));

    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(1));
  });

  it('asks for the approval reference and the policy revision before activating', async () => {
    const calls = setup([makeIdentity({ state: 'pending_approval' })], {
      [`POST ${actionPath('b1')}`]: ok({ ok: true, id: 'b1', state: 'active' }),
    });
    const user = userEvent.setup();

    await openMenu(user, 'b1');
    await user.click(screen.getByTestId('identity-action-activate'));

    const dialog = screen.getByTestId('identity-activate-dialog');
    expect(dialog).toHaveTextContent('A second administrator must approve it');
    const submit = screen.getByTestId('identity-activate-submit');
    expect(submit).toBeDisabled();

    await user.type(screen.getByTestId('identity-approval-ref'), 'CHG-42');
    expect(submit).toBeDisabled();

    await user.type(screen.getByTestId('identity-policy-revision'), '2026-10-20.1');
    expect(submit).toBeEnabled();
    await user.click(submit);

    await waitFor(() => expect(calls.some(call => call.method === 'POST')).toBe(true));
    expect(calls.find(call => call.method === 'POST').body).toEqual({
      action: 'activate',
      expected_state: 'pending_approval',
      approval_ref: 'CHG-42',
      policy_revision: '2026-10-20.1',
    });
    expect(await screen.findByTestId('identities-snackbar')).toHaveTextContent('Jira helper v47 activated.');
  });

  it('refuses characters the backend would refuse and prefills the effective policy revision', async () => {
    setup(
      [makeIdentity({ state: 'pending_approval' })],
      {
        [`GET ${SETTINGS_PATH}`]: ok(
          makeSettings({
            effective: {
              mode: 'audit_only',
              policy_revision: 'CHG-9',
              admit_legacy_pat: false,
              allow_runtime_domain_binding: false,
              environment: null,
              capped: false,
              unavailable: false,
            },
          }),
        ),
      },
      [BINDINGS_VIEW, BINDINGS_APPROVE, 'governance.settings.view'],
    );
    const user = userEvent.setup();

    await openMenu(user, 'b1');
    await user.click(screen.getByTestId('identity-action-activate'));

    await waitFor(() => expect(screen.getByTestId('identity-policy-revision')).toHaveValue('CHG-9'));
    await user.type(screen.getByTestId('identity-approval-ref'), 'has space');
    expect(screen.getByTestId('identity-activate-submit')).toBeDisabled();
  });

  it('renders the self-approval refusal with its message and code', async () => {
    setup([makeIdentity({ state: 'pending_approval' })], {
      [`POST ${actionPath('b1')}`]: refusal(
        403,
        'SELF_APPROVAL',
        'another operator must approve this binding',
      ),
    });
    const user = userEvent.setup();

    await openMenu(user, 'b1');
    await user.click(screen.getByTestId('identity-action-activate'));
    await user.type(screen.getByTestId('identity-approval-ref'), 'CHG-42');
    await user.type(screen.getByTestId('identity-policy-revision'), 'REV-1');
    await user.click(screen.getByTestId('identity-activate-submit'));

    const alert = await screen.findByTestId('governance-error');
    expect(alert).toHaveTextContent('another operator must approve this binding');
    expect(within(alert).getByTestId('governance-error-code')).toHaveTextContent('SELF_APPROVAL');
    expect(screen.getByTestId('identity-activate-dialog')).toBeInTheDocument();
  });

  it('renders other refusals the same way', async () => {
    setup([makeIdentity({ state: 'suspended' })], {
      [`POST ${actionPath('b1')}`]: refusal(
        409,
        'BINDING_DIGEST_MISMATCH',
        'the definition changed since the binding was created',
      ),
    });
    const user = userEvent.setup();

    await openMenu(user, 'b1');
    await user.click(screen.getByTestId('identity-action-resume'));
    await user.click(screen.getByTestId('identity-confirm-submit'));

    expect(await screen.findByTestId('governance-error-code')).toHaveTextContent('BINDING_DIGEST_MISMATCH');
    expect(screen.getByTestId('identity-confirm-dialog')).toBeInTheDocument();
  });

  it('reads the list again and tells the operator when the identity changed meanwhile', async () => {
    const calls = setup([makeIdentity()], {
      [`POST ${actionPath('b1')}`]: refusal(
        409,
        'CONCURRENT_CHANGE',
        'the binding changed while this ran; read it again and retry',
      ),
    });
    const user = userEvent.setup();

    await openMenu(user, 'b1');
    await user.click(screen.getByTestId('identity-action-suspend'));
    await user.click(screen.getByTestId('identity-confirm-submit'));

    const snackbar = await screen.findByTestId('identities-snackbar');
    expect(snackbar).toHaveTextContent('Jira helper v47 was changed by someone else.');
    expect(snackbar).toHaveClass('MuiAlert-filledWarning');
    await waitFor(() => expect(screen.queryByTestId('identity-confirm-dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(1));
  });
});

describe('detail drawer', () => {
  it('shows the stored and current digests and what they are made of, never the instruction text', async () => {
    const detail = makeDetail();
    // The backend sends only the length and the hash; even if text came along it must not be rendered
    detail.digest_inputs.instructions.text = 'You are a secret system prompt';
    detail.digest_inputs.instructions.preview = 'SECRET INSTRUCTION TEXT';
    mockApi({
      [`GET ${LIST_PATH}`]: listResponse([makeIdentity({ digest_status: 'changed' })]),
      [`GET ${detailPath('b1')}`]: ok({ ...detail, digest_status: 'changed' }),
    });
    const user = userEvent.setup();
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW] });

    await user.click(await screen.findByTestId('identity-open-b1'));

    const drawer = await screen.findByTestId('identity-detail-drawer');
    await waitFor(() =>
      expect(within(drawer).getByTestId('identity-field-digest-now')).toHaveTextContent('91be04aa'),
    );
    expect(within(drawer).getByTestId('identity-field-digest-stored')).toHaveTextContent(
      'sha256:7f3a9c1d2e4b',
    );
    expect(within(drawer).getByTestId('identity-field-model')).toHaveTextContent('gpt-4.1');
    expect(within(drawer).getByTestId('identity-field-agent-type')).toHaveTextContent('react');
    expect(within(drawer).getByTestId('identity-field-instructions')).toHaveTextContent(
      '2314 characters · sha256 ab12cd34',
    );
    expect(within(drawer).getByTestId('identity-field-llm-settings')).toHaveTextContent('sha256 ef56ab78');
    const tools = within(drawer).getByTestId('identity-field-tools');
    expect(tools).toHaveTextContent('github github');
    expect(tools).toHaveTextContent('configuration becf88bf-0000-4000-8000-000000000001');
    expect(tools).toHaveTextContent('3 selected tools');
    expect(tools).toHaveTextContent('sha256 99aa88bb');
    expect(within(drawer).getByTestId('identity-digest-chip')).toHaveTextContent('Changed');
    expect(within(drawer).getByTestId('identity-field-created')).toHaveTextContent('creator@example.com');

    expect(document.body).not.toHaveTextContent('secret system prompt');
    expect(document.body).not.toHaveTextContent('SECRET INSTRUCTION TEXT');
  });

  it('opens from the row menu and shows the grants count only when the backend sends one', async () => {
    mockApi({
      [`GET ${LIST_PATH}`]: listResponse([makeIdentity()]),
      [`GET ${detailPath('b1')}`]: ok(makeDetail({ grants_count: 4 })),
    });
    const user = userEvent.setup();
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW] });

    await openMenu(user, 'b1');
    await user.click(screen.getByTestId('identity-action-details'));

    expect(await screen.findByTestId('identity-field-grants')).toHaveTextContent('4');
  });

  it('does not show a grants line when the count is not available yet', async () => {
    mockApi({
      [`GET ${LIST_PATH}`]: listResponse([makeIdentity()]),
      [`GET ${detailPath('b1')}`]: ok(makeDetail()),
    });
    const user = userEvent.setup();
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW] });

    await user.click(await screen.findByTestId('identity-open-b1'));
    await screen.findByTestId('identity-field-digest-now');

    expect(screen.queryByTestId('identity-field-grants')).not.toBeInTheDocument();
  });
});
