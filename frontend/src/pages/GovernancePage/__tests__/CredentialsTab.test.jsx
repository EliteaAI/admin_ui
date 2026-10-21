import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CredentialsTab } from '@/pages/GovernancePage/components/CredentialsTab';
import store, { setUser } from '@/store';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  CANDIDATES_PATH,
  CRED_APPROVE,
  CRED_MANAGE,
  CRED_PROBE,
  CRED_VIEW,
  OPERATOR_ID,
  REFS_PATH,
  TYPES_PATH,
  USERS_PATH,
  candidatesResponse,
  listOf,
  makePersonal,
  makeReference,
  makeTypes,
  materialPath,
  refActionPath,
  refDetailPath,
  usersResponse,
} from './credentialsTest.helpers';
import {
  SETTINGS_PATH,
  fail,
  makeSettings,
  mockApi,
  ok,
  renderWithProviders,
} from './governanceTest.helpers';
import { PROJECTS_PATH, rememberProject } from './identitiesTest.helpers';

const ALL = [CRED_VIEW, CRED_MANAGE, CRED_PROBE, CRED_APPROVE];

const listCalls = calls => calls.filter(call => call.method === 'GET' && call.path === REFS_PATH);
const postCalls = calls => calls.filter(call => call.method === 'POST');

const openMenu = async (user, id) => {
  await user.click(await screen.findByTestId(`credential-actions-${id}`));
};

const menuActions = () =>
  screen
    .queryAllByTestId(/^credential-action-/)
    .map(item => item.dataset.testid.replace('credential-action-', ''))
    .filter(name => name !== 'details');

const refusal = (status, code, message) => fail(status, { error: message, code });

const setup = (rows, handlers = {}, permissions = ALL) => {
  const calls = mockApi({
    [`GET ${REFS_PATH}`]: listOf(rows),
    [`GET ${USERS_PATH}`]: usersResponse(),
    ...handlers,
  });
  renderWithProviders(<CredentialsTab />, { permissions });
  return calls;
};

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
    renderWithProviders(<CredentialsTab />, { permissions: [CRED_VIEW] });

    expect(await screen.findByText('Choose a project to see its credentials.')).toBeInTheDocument();
    expect(calls.some(call => call.path === REFS_PATH)).toBe(false);
  });

  it('shows configuration, provider, class with the owner, store, state, generation, probe and approver', async () => {
    setup(
      [
        makeReference({ configuration_changed: true }),
        makePersonal({ state: 'validated', validated: true, store_kind: 'corporate_vault' }),
      ],
      {},
      [CRED_VIEW],
    );

    expect(await screen.findByTestId('credential-open-r1')).toHaveTextContent('github_config');
    expect(screen.getByTestId('credential-open-p1')).toHaveTextContent('jira_epam');
    expect(screen.getAllByTestId('credential-state-chip').map(chip => chip.textContent)).toEqual([
      'Active',
      'Validated',
    ]);
    expect(screen.getAllByTestId('credential-class-chip').map(chip => chip.textContent)).toEqual([
      'Service',
      'Personal',
    ]);
    expect(screen.getByTestId('credential-owner')).toHaveTextContent('u1@epam.com');
    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Corporate Vault')).toBeInTheDocument();
    expect(screen.getByText('approver@example.com')).toBeInTheDocument();
    expect(screen.getAllByText('OK')).toHaveLength(2);
    expect(screen.getAllByTestId('credential-changed-chip')).toHaveLength(1);
  });

  it('shows the personal-credential notice when the page has a personal row, and not otherwise', async () => {
    setup([makePersonal()], {}, [CRED_VIEW]);
    expect(await screen.findByTestId('credential-personal-notice')).toHaveTextContent(
      'Recorded and checked for every run.',
    );
  });

  it('words the personal notice for the released runtime', async () => {
    setup([makePersonal()], {}, [CRED_VIEW]);
    const notice = await screen.findByTestId('credential-personal-notice');
    expect(notice).toHaveTextContent('While this personal credential is not active, runs of its owner');
    expect(notice).toHaveTextContent('those runs use it instead of the shared credential.');
    expect(notice).not.toHaveTextContent('runtime release ships');
  });

  it('shows the start of the configuration uuid when the title is missing, not the provider again', async () => {
    setup(
      [
        makeReference({
          id: 'r1',
          configuration: { uuid: 'becf88bf-0000-4000-8000-000000000001', title: null },
        }),
        makeReference({
          id: 'r2',
          configuration: { uuid: '1a2b3c4d-0000-4000-8000-000000000002', title: null },
        }),
      ],
      {},
      [CRED_VIEW],
    );

    expect(await screen.findByTestId('credential-open-r1')).toHaveTextContent('becf88bf');
    expect(screen.getByTestId('credential-open-r2')).toHaveTextContent('1a2b3c4d');
  });

  it('shows no personal notice for shared credentials', async () => {
    setup([makeReference()], {}, [CRED_VIEW]);
    await screen.findByTestId('credential-open-r1');
    expect(screen.queryByTestId('credential-personal-notice')).not.toBeInTheDocument();
  });

  it('sends the project, the default sort and the page size of 20', async () => {
    const calls = setup([makeReference()], {}, [CRED_VIEW]);
    await screen.findByTestId('credential-open-r1');

    expect(listCalls(calls)[0].params).toEqual({
      limit: '20',
      offset: '0',
      sort_by: 'updated_at',
      sort_order: 'desc',
    });
  });

  it('builds the query from the filters, the owner, the search, the sort and the page', async () => {
    const rows = Array.from({ length: 20 }, (_, index) => makeReference({ id: `r${index}` }));
    const calls = setup(rows, { [`GET ${REFS_PATH}`]: ok({ total: 45, rows }) }, [CRED_VIEW]);
    const user = userEvent.setup();
    await screen.findByTestId('credential-open-r0');

    await user.click(screen.getByTestId('credentials-state-filter'));
    await user.click(await screen.findByTestId('credentials-state-suspended'));
    await waitFor(() => expect(listCalls(calls).at(-1).params.state).toBe('suspended'));

    await user.click(screen.getByTestId('credentials-class-filter'));
    await user.click(await screen.findByTestId('credentials-class-personal'));
    await waitFor(() => expect(listCalls(calls).at(-1).params.ownership_class).toBe('personal'));

    await user.click(screen.getByTestId('credentials-store-filter'));
    await user.click(await screen.findByTestId('credentials-store-corporate_vault'));
    await waitFor(() => expect(listCalls(calls).at(-1).params.store_kind).toBe('corporate_vault'));

    await user.click(screen.getByTestId('credentials-owner-filter-input'));
    await user.click(await screen.findByText('u1@epam.com'));
    await waitFor(() => expect(listCalls(calls).at(-1).params.owner_user_id).toBe('7'));

    await user.type(screen.getByTestId('credentials-search'), 'jira');
    await waitFor(() => expect(listCalls(calls).at(-1).params.search).toBe('jira'));

    const providerHeader = screen
      .getAllByText('Provider')
      .find(element => !element.closest('[data-testid="credentials-toolbar"]'));
    await user.click(providerHeader);
    await waitFor(() => expect(listCalls(calls).at(-1).params.sort_by).toBe('provider'));
    expect(listCalls(calls).at(-1).params).toMatchObject({
      state: 'suspended',
      ownership_class: 'personal',
      store_kind: 'corporate_vault',
      owner_user_id: '7',
      search: 'jira',
      sort_by: 'provider',
      sort_order: 'asc',
      offset: '0',
    });
  });

  it('pages with limit and offset', async () => {
    const rows = Array.from({ length: 20 }, (_, index) => makeReference({ id: `r${index}` }));
    const calls = setup(rows, { [`GET ${REFS_PATH}`]: ok({ total: 45, rows }) }, [CRED_VIEW]);
    const user = userEvent.setup();
    await screen.findByTestId('credential-open-r0');

    const pageInfo = screen.getByText('1 - 20 of 45');
    await user.click(pageInfo.parentElement.querySelectorAll('button')[1]);
    await waitFor(() => expect(listCalls(calls).at(-1).params).toMatchObject({ limit: '20', offset: '20' }));
  });

  it('says so when the project has no credentials and when filters match nothing', async () => {
    setup([], {}, [CRED_VIEW, CRED_MANAGE]);
    const user = userEvent.setup();

    expect(
      await screen.findByText(
        'No credentials registered in Team Alpha yet. Use Register credential to add one.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId('credentials-state-filter'));
    await user.click(await screen.findByTestId('credentials-state-retired'));
    expect(await screen.findByText('No credentials match the filters.')).toBeInTheDocument();
  });

  it('shows the readable refusal with its code when the list cannot be read', async () => {
    setup([], { [`GET ${REFS_PATH}`]: refusal(403, 'FORBIDDEN', 'You do not have permission to do this.') }, [
      CRED_VIEW,
    ]);

    expect(await screen.findByTestId('governance-error')).toHaveTextContent('You do not have permission');
    expect(screen.getByTestId('governance-error-code')).toHaveTextContent('FORBIDDEN');
  });
});

describe('row actions per state and permission', () => {
  it.each([
    [
      'pending, no value yet',
      makeReference({ state: 'pending', generation: 0, validated: false }),
      ['import', 'retire'],
    ],
    [
      'pending, imported',
      makeReference({ state: 'pending', generation: 1, validated: false }),
      ['import', 'probe', 'retire'],
    ],
    ['pending personal', makePersonal({ state: 'pending' }), ['setValue', 'probe', 'retire']],
    [
      'validated, not approved',
      makeReference({ state: 'validated', approved_by: null }),
      ['import', 'approve', 'retire'],
    ],
    [
      'validated, approved',
      makeReference({ state: 'validated', approved_by: { id: 2, email: 'a@b.c' } }),
      ['import', 'activate', 'retire'],
    ],
    [
      'validated personal, not approved',
      makePersonal({ state: 'validated', approved_by: null, validated: true }),
      ['setValue', 'probe', 'approve', 'retire'],
    ],
    ['active', makeReference({ state: 'active' }), ['suspend', 'retire']],
    [
      'active personal',
      makePersonal({ state: 'active', approved_by: { id: 2, email: 'a@b.c' } }),
      ['probe', 'suspend', 'retire'],
    ],
    ['suspended', makeReference({ state: 'suspended' }), ['resume', 'retire']],
    [
      'suspended personal',
      makePersonal({ state: 'suspended', approved_by: { id: 2, email: 'a@b.c' } }),
      ['setValue', 'resume', 'retire'],
    ],
    ['retired', makeReference({ state: 'retired' }), []],
  ])('offers for %s the actions valid from it', async (_, row, expected) => {
    setup([row]);
    const user = userEvent.setup();

    await openMenu(user, row.id);

    expect(menuActions()).toEqual(expected);
    expect(screen.getByTestId('credential-action-details')).toBeInTheDocument();
  });

  it('offers only Details to an operator who can only view', async () => {
    setup([makeReference({ state: 'validated', approved_by: null })], {}, [CRED_VIEW]);
    const user = userEvent.setup();

    await openMenu(user, 'r1');

    expect(menuActions()).toEqual([]);
    expect(screen.getByTestId('credential-action-details')).toBeInTheDocument();
  });

  it.each([
    ['manage', [CRED_VIEW, CRED_MANAGE], ['import', 'retire']],
    ['probe', [CRED_VIEW, CRED_PROBE], ['probe']],
    ['approve', [CRED_VIEW, CRED_APPROVE], []],
  ])('with only the %s permission: pending, imported', async (_, permissions, expected) => {
    setup([makeReference({ state: 'pending', generation: 1, validated: false })], {}, permissions);
    const user = userEvent.setup();

    await openMenu(user, 'r1');

    expect(menuActions()).toEqual(expected);
  });

  it('keeps approval for the approve permission', async () => {
    setup([makeReference({ state: 'validated', approved_by: null })], {}, [CRED_VIEW, CRED_APPROVE]);
    const user = userEvent.setup();

    await openMenu(user, 'r1');

    expect(menuActions()).toEqual(['approve']);
  });

  it('disables approval, with the reason, for the operator who created the reference or wrote its value', async () => {
    setup(
      [
        makeReference({
          id: 'a',
          state: 'validated',
          approved_by: null,
          created_by: { id: OPERATOR_ID, email: 'me' },
        }),
        makeReference({
          id: 'b',
          state: 'validated',
          approved_by: null,
          written_by: { id: OPERATOR_ID, email: 'me' },
        }),
        makeReference({ id: 'c', state: 'validated', approved_by: null }),
      ],
      {},
      [CRED_VIEW, CRED_APPROVE],
    );
    const user = userEvent.setup();

    await openMenu(user, 'a');
    expect(screen.getByTestId('credential-action-approve')).toHaveAttribute('aria-disabled', 'true');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByTestId('credential-action-approve')).not.toBeInTheDocument());

    await openMenu(user, 'b');
    expect(screen.getByTestId('credential-action-approve')).toHaveAttribute('aria-disabled', 'true');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByTestId('credential-action-approve')).not.toBeInTheDocument());

    await openMenu(user, 'c');
    expect(screen.getByTestId('credential-action-approve')).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('shows the register button only with the manage permission', async () => {
    setup([], {}, [CRED_VIEW]);
    await screen.findByTestId('credentials-toolbar');
    expect(screen.queryByTestId('credentials-create')).not.toBeInTheDocument();
  });
});

describe('register dialog', () => {
  const handlers = (extra = {}) => ({
    [`GET ${CANDIDATES_PATH}`]: candidatesResponse(),
    [`POST ${REFS_PATH}`]: ok({ ok: true, id: 'new', state: 'pending' }),
    ...extra,
  });

  const pickConfiguration = async user => {
    await user.click(await screen.findByTestId('credentials-create'));
    await user.click(await screen.findByTestId('credential-create-configuration'));
    await user.click(await screen.findByText('github_config'));
  };

  it('registers a shared credential: no owner is sent', async () => {
    const calls = setup([], handlers());
    const user = userEvent.setup();

    await pickConfiguration(user);
    await user.click(screen.getByTestId('credential-create-submit'));

    await waitFor(() => expect(postCalls(calls)).toHaveLength(1));
    expect(postCalls(calls)[0].path).toBe(REFS_PATH);
    expect(postCalls(calls)[0].body).toEqual({
      configuration_uuid: 'becf88bf-0000-4000-8000-000000000001',
      store_kind: 'database',
      ownership_class: 'project_shared',
    });
    expect(await screen.findByTestId('credentials-snackbar')).toHaveTextContent(
      'Credential reference for github_config created as pending. Import its value next.',
    );
    await waitFor(() => expect(screen.queryByTestId('credential-create-dialog')).not.toBeInTheDocument());
  });

  it('registers a personal credential with its owner and the chosen store', async () => {
    const calls = setup([], handlers(), ALL);
    const user = userEvent.setup();

    await pickConfiguration(user);
    await user.click(screen.getByTestId('credential-create-class-personal'));
    expect(screen.getByTestId('credential-create-submit')).toBeDisabled();
    await user.click(screen.getByTestId('credential-create-owner-input'));
    await user.click(await screen.findByText('u1@epam.com'));
    await user.click(screen.getByTestId('credential-create-store-corporate_vault'));
    await user.click(screen.getByTestId('credential-create-submit'));

    await waitFor(() => expect(postCalls(calls)).toHaveLength(1));
    expect(postCalls(calls)[0].body).toEqual({
      configuration_uuid: 'becf88bf-0000-4000-8000-000000000001',
      store_kind: 'corporate_vault',
      ownership_class: 'personal',
      owner_user_id: 7,
    });
    expect(await screen.findByTestId('credentials-snackbar')).toHaveTextContent(
      'Set the personal value next.',
    );
  });

  it('does not offer a configuration without secret fields', async () => {
    setup([], handlers());
    const user = userEvent.setup();

    await user.click(await screen.findByTestId('credentials-create'));
    await user.click(await screen.findByTestId('credential-create-configuration'));

    expect((await screen.findByText('plain_config')).closest('li')).toHaveAttribute('aria-disabled', 'true');
  });

  it('names the admin task when personal credentials need the database update', async () => {
    setup(
      [],
      handlers({
        [`POST ${REFS_PATH}`]: refusal(
          409,
          'MIGRATION_REQUIRED',
          'Personal credential references need a database update.',
        ),
      }),
    );
    const user = userEvent.setup();

    await pickConfiguration(user);
    await user.click(screen.getByTestId('credential-create-class-personal'));
    await user.click(screen.getByTestId('credential-create-owner-input'));
    await user.click(await screen.findByText('u1@epam.com'));
    await user.click(screen.getByTestId('credential-create-submit'));

    expect(await screen.findByTestId('credential-migration-notice')).toHaveTextContent(
      'create_credential_governance_tables',
    );
    expect(screen.getByTestId('credential-create-dialog')).toBeInTheDocument();
  });

  it('shows other refusals with their code and keeps the dialog open', async () => {
    setup(
      [],
      handlers({
        [`POST ${REFS_PATH}`]: refusal(
          409,
          'REFERENCE_EXISTS',
          'A live credential reference already exists.',
        ),
      }),
    );
    const user = userEvent.setup();

    await pickConfiguration(user);
    await user.click(screen.getByTestId('credential-create-submit'));

    expect(await screen.findByTestId('governance-error')).toHaveTextContent('already exists');
    expect(screen.getByTestId('governance-error-code')).toHaveTextContent('REFERENCE_EXISTS');
  });

  it('disables Corporate Vault, with the reason, when the preflight says it is not configured', async () => {
    const settings = makeSettings();
    settings.preflight.checks = [
      ...settings.preflight.checks,
      { id: 'corporate_vault', status: 'warn', code: 'VAULT_MISSING', blocking: false, message: 'x' },
    ];
    setup([], handlers({ [`GET ${SETTINGS_PATH}`]: ok(settings) }), [...ALL, 'governance.settings.view']);
    const user = userEvent.setup();

    await user.click(await screen.findByTestId('credentials-create'));

    await waitFor(() => expect(screen.getByTestId('credential-create-store-corporate_vault')).toBeDisabled());
    expect(screen.getByTestId('credential-create-store-database')).not.toBeDisabled();
  });
});

describe('actions', () => {
  it.each([
    ['pending', 'import', { generation: 0, validated: false }],
    ['validated', 'activate', { approved_by: { id: 2, email: 'a@b.c' } }],
    ['active', 'suspend', {}],
    ['suspended', 'resume', {}],
    ['active', 'retire', {}],
  ])('confirms %s -> %s and sends only the action', async (state, action, extra) => {
    const calls = setup([makeReference({ state, ...extra })], {
      [`POST ${refActionPath('r1')}`]: ok({ ok: true, id: 'r1', action, state: 'x' }),
    });
    const user = userEvent.setup();

    await openMenu(user, 'r1');
    await user.click(screen.getByTestId(`credential-action-${action}`));
    await user.click(await screen.findByTestId('credential-confirm-submit'));

    await waitFor(() => expect(postCalls(calls)).toHaveLength(1));
    expect(postCalls(calls)[0].body).toEqual({ action });
  });

  it('explains suspend and names the reference', async () => {
    setup([makeReference()], { [`POST ${refActionPath('r1')}`]: ok({ ok: true }) });
    const user = userEvent.setup();

    await openMenu(user, 'r1');
    await user.click(screen.getByTestId('credential-action-suspend'));

    expect(screen.getByTestId('credential-confirm-dialog')).toHaveTextContent('Suspend: github_config?');
    expect(screen.getByTestId('credential-confirm-dialog')).toHaveTextContent(
      'Runs admitted earlier with it are stopped at their next check.',
    );
  });

  it('marks retire as destructive and says so in the success message', async () => {
    setup([makeReference()], { [`POST ${refActionPath('r1')}`]: ok({ ok: true }) });
    const user = userEvent.setup();

    await openMenu(user, 'r1');
    await user.click(screen.getByTestId('credential-action-retire'));
    expect(screen.getByTestId('credential-confirm-dialog')).toHaveTextContent('Retiring is permanent');
    await user.click(screen.getByTestId('credential-confirm-submit'));

    expect(await screen.findByTestId('credentials-snackbar')).toHaveTextContent('github_config retired.');
  });

  it('reads the list again after an action', async () => {
    const calls = setup([makeReference()], { [`POST ${refActionPath('r1')}`]: ok({ ok: true }) });
    const user = userEvent.setup();
    await screen.findByTestId('credential-open-r1');
    const before = listCalls(calls).length;

    await openMenu(user, 'r1');
    await user.click(screen.getByTestId('credential-action-suspend'));
    await user.click(screen.getByTestId('credential-confirm-submit'));

    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
  });

  it('renders a refusal with its message and code, and keeps the dialog open', async () => {
    setup([makeReference({ state: 'pending', generation: 1, validated: false })], {
      [`POST ${refActionPath('r1')}`]: refusal(409, 'IMPORT_IN_FLIGHT', 'An import is in flight.'),
    });
    const user = userEvent.setup();

    await openMenu(user, 'r1');
    await user.click(screen.getByTestId('credential-action-import'));
    await user.click(screen.getByTestId('credential-confirm-submit'));

    expect(await screen.findByTestId('governance-error')).toHaveTextContent('An import is in flight.');
    expect(screen.getByTestId('governance-error-code')).toHaveTextContent('IMPORT_IN_FLIGHT');
    expect(screen.getByTestId('credential-confirm-dialog')).toBeInTheDocument();
  });

  it('warns and reads the list again when the reference changed meanwhile', async () => {
    setup([makeReference()], {
      [`POST ${refActionPath('r1')}`]: refusal(
        409,
        'CONCURRENT_CHANGE',
        'The record changed while this ran.',
      ),
    });
    const user = userEvent.setup();

    await openMenu(user, 'r1');
    await user.click(screen.getByTestId('credential-action-suspend'));
    await user.click(screen.getByTestId('credential-confirm-submit'));

    expect(await screen.findByTestId('credentials-snackbar')).toHaveTextContent(
      'was changed by someone else',
    );
    await waitFor(() => expect(screen.queryByTestId('credential-confirm-dialog')).not.toBeInTheDocument());
  });
});

describe('approve dialog', () => {
  const row = makeReference({ state: 'validated', approved_by: null });

  const open = async (user, handlers = {}, permissions = ALL) => {
    const calls = setup(
      [row],
      { [`POST ${refActionPath('r1')}`]: ok({ ok: true }), ...handlers },
      permissions,
    );
    await openMenu(user, 'r1');
    await user.click(screen.getByTestId('credential-action-approve'));
    return calls;
  };

  it('explains the second-admin rule and needs both references before approving', async () => {
    const user = userEvent.setup();
    await open(user);

    expect(screen.getByTestId('credential-approve-dialog')).toHaveTextContent(
      'A second administrator must approve',
    );
    expect(screen.getByTestId('credential-approve-submit')).toBeDisabled();
    await user.type(screen.getByTestId('credential-approve-ref'), 'TICKET-9');
    expect(screen.getByTestId('credential-approve-submit')).toBeDisabled();
    await user.type(screen.getByTestId('credential-approve-policy'), 'CHG-2');
    expect(screen.getByTestId('credential-approve-submit')).toBeEnabled();
  });

  it('sends the approval reference and the policy revision', async () => {
    const user = userEvent.setup();
    const calls = await open(user);

    await user.type(screen.getByTestId('credential-approve-ref'), 'TICKET-9');
    await user.type(screen.getByTestId('credential-approve-policy'), 'CHG-2');
    await user.click(screen.getByTestId('credential-approve-submit'));

    await waitFor(() => expect(postCalls(calls)).toHaveLength(1));
    expect(postCalls(calls)[0].body).toEqual({
      action: 'approve',
      approval_ref: 'TICKET-9',
      policy_revision: 'CHG-2',
    });
    expect(await screen.findByTestId('credentials-snackbar')).toHaveTextContent('github_config approved');
  });

  it('refuses characters the backend would refuse', async () => {
    const user = userEvent.setup();
    await open(user);

    await user.type(screen.getByTestId('credential-approve-ref'), 'bad ref!');
    await user.type(screen.getByTestId('credential-approve-policy'), 'CHG-2');

    expect(screen.getByTestId('credential-approve-submit')).toBeDisabled();
  });

  it('prefills the effective policy revision when the operator can read the setting', async () => {
    const user = userEvent.setup();
    const settings = makeSettings();
    settings.effective.policy_revision = 'CHG-7';
    await open(user, { [`GET ${SETTINGS_PATH}`]: ok(settings) }, [...ALL, 'governance.settings.view']);

    await waitFor(() => expect(screen.getByTestId('credential-approve-policy')).toHaveValue('CHG-7'));
  });

  it('renders the self-approval refusal with its message and code', async () => {
    const user = userEvent.setup();
    await open(user, {
      [`POST ${refActionPath('r1')}`]: refusal(
        403,
        'SELF_APPROVAL',
        'The creator of a record, or whoever wrote its value, cannot approve it.',
      ),
    });

    await user.type(screen.getByTestId('credential-approve-ref'), 'TICKET-9');
    await user.type(screen.getByTestId('credential-approve-policy'), 'CHG-2');
    await user.click(screen.getByTestId('credential-approve-submit'));

    expect(await screen.findByTestId('governance-error')).toHaveTextContent('cannot approve it');
    expect(screen.getByTestId('governance-error-code')).toHaveTextContent('SELF_APPROVAL');
  });
});

describe('probe dialog', () => {
  const openProbe = async (row, handlers = {}) => {
    const calls = setup([row], { [`POST ${refActionPath(row.id)}`]: ok({ ok: true }), ...handlers });
    const user = userEvent.setup();
    await openMenu(user, row.id);
    await user.click(screen.getByTestId('credential-action-probe'));
    return { calls, user };
  };

  it('probes a shared credential with the action only and offers no connection check', async () => {
    const { calls, user } = await openProbe(
      makeReference({ state: 'pending', generation: 1, validated: false }),
    );

    expect(screen.queryByTestId('credential-probe-check')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('credential-probe-submit'));

    await waitFor(() => expect(postCalls(calls)).toHaveLength(1));
    expect(postCalls(calls)[0].body).toEqual({ action: 'probe' });
  });

  it('probes a pending personal credential without the check unless it is asked for', async () => {
    const { calls, user } = await openProbe(makePersonal());

    expect(screen.getByTestId('credential-probe-check')).not.toBeChecked();
    await user.click(screen.getByTestId('credential-probe-submit'));

    await waitFor(() => expect(postCalls(calls)).toHaveLength(1));
    expect(postCalls(calls)[0].body).toEqual({ action: 'probe' });
  });

  it('sends check_connection when the operator asks for the check', async () => {
    const { calls, user } = await openProbe(makePersonal());

    await user.click(screen.getByTestId('credential-probe-check'));
    await user.click(screen.getByTestId('credential-probe-submit'));

    await waitFor(() => expect(postCalls(calls)).toHaveLength(1));
    expect(postCalls(calls)[0].body).toEqual({ action: 'probe', check_connection: true });
  });

  it('always checks the connection of a personal credential that is past pending', async () => {
    const { calls, user } = await openProbe(
      makePersonal({ state: 'active', approved_by: { id: 2, email: 'a@b.c' } }),
    );

    expect(screen.getByTestId('credential-probe-check')).toBeChecked();
    expect(screen.getByTestId('credential-probe-check')).toBeDisabled();
    await user.click(screen.getByTestId('credential-probe-submit'));

    await waitFor(() => expect(postCalls(calls)).toHaveLength(1));
    expect(postCalls(calls)[0].body).toEqual({ action: 'probe', check_connection: true });
  });

  it('renders the provider refusal with its code', async () => {
    const { user } = await openProbe(makePersonal(), {
      [`POST ${refActionPath('p1')}`]: refusal(
        409,
        'CHECK_CONNECTION_FAILED',
        'The provider did not accept the stored credential.',
      ),
    });

    await user.click(screen.getByTestId('credential-probe-check'));
    await user.click(screen.getByTestId('credential-probe-submit'));

    expect(await screen.findByTestId('governance-error-code')).toHaveTextContent('CHECK_CONNECTION_FAILED');
  });
});

describe('personal value dialog', () => {
  const SECRET = 'test-value-one-123';
  const SECOND_SECRET = 'test-value-two-456';

  const openValue = async (row = makePersonal({ generation: 3 }), handlers = {}) => {
    const calls = setup([row], {
      [`GET ${TYPES_PATH}`]: ok(makeTypes()),
      [`PUT ${materialPath(row.id)}`]: ok({ ok: true, generation: row.generation + 1, state: 'pending' }),
      ...handlers,
    });
    const user = userEvent.setup();
    await openMenu(user, row.id);
    await user.click(screen.getByTestId('credential-action-setValue'));
    return { calls, user };
  };

  const openMenuAgain = async user => {
    await openMenu(user, 'p1');
    await user.click(await screen.findByTestId('credential-action-setValue'));
  };

  const putCalls = calls => calls.filter(call => call.method === 'PUT');

  it('asks for exactly the secret fields of the configuration type, as password inputs', async () => {
    await openValue();

    const token = await screen.findByTestId('credential-value-access_token');
    const key = screen.getByTestId('credential-value-app.private_key');
    expect(token).toHaveAttribute('type', 'password');
    expect(key).toHaveAttribute('type', 'password');
    expect(screen.queryByTestId('credential-value-base_url')).not.toBeInTheDocument();
    expect(screen.getByTestId('credential-value-dialog')).toHaveTextContent('u1@epam.com');
    expect(screen.getByTestId('credential-value-dialog')).toHaveTextContent('generation 3 → 4');
    expect(screen.getByTestId('credential-value-dialog')).toHaveTextContent('never shown again');
    expect(
      within(screen.getByTestId('credential-value-dialog')).getByTestId('credential-personal-notice'),
    ).toBeInTheDocument();
  });

  it('marks no field as required and says the fields are alternatives', async () => {
    await openValue();

    const token = await screen.findByTestId('credential-value-access_token');
    expect(token).not.toBeRequired();
    expect(screen.getByTestId('credential-value-app.private_key')).not.toBeRequired();
    expect(screen.getByTestId('credential-value-dialog').textContent).not.toContain('*');
    expect(screen.getByTestId('credential-value-hint')).toHaveTextContent(
      'Fill in the field(s) your authentication method uses; the others stay empty.',
    );
  });

  it('groups the fields by authentication method when the schema names them', async () => {
    await openValue();

    await screen.findByTestId('credential-value-access_token');
    expect(screen.getAllByTestId('credential-value-caption').map(caption => caption.textContent)).toEqual([
      'Token',
      'App private key',
    ]);
    const [tokenGroup, keyGroup] = screen.getAllByTestId('credential-value-group');
    expect(within(tokenGroup).getByTestId('credential-value-access_token')).toBeInTheDocument();
    expect(within(keyGroup).getByTestId('credential-value-app.private_key')).toBeInTheDocument();
  });

  it('shows a flat list, without captions, when the schema has no subsections', async () => {
    await openValue(makePersonal({ provider: 'openapi' }));

    await screen.findByTestId('credential-value-headers.*-add');
    expect(screen.queryByTestId('credential-value-caption')).not.toBeInTheDocument();
  });

  it('keeps Store value disabled while nothing is filled in and enables it with one field', async () => {
    const { user } = await openValue();

    const token = await screen.findByTestId('credential-value-access_token');
    expect(screen.getByTestId('credential-value-submit')).toBeDisabled();
    await user.type(token, SECRET);
    expect(screen.getByTestId('credential-value-submit')).toBeEnabled();
    await user.clear(token);
    expect(screen.getByTestId('credential-value-submit')).toBeDisabled();
  });

  it('sends only the fields that were filled in', async () => {
    const { calls, user } = await openValue();

    await user.type(await screen.findByTestId('credential-value-app.private_key'), SECOND_SECRET);
    await user.click(screen.getByTestId('credential-value-submit'));

    await waitFor(() => expect(putCalls(calls)).toHaveLength(1));
    expect(putCalls(calls)[0].body).toEqual({
      fields: { 'app.private_key': SECOND_SECRET },
      expected_generation: 3,
    });
  });

  it('writes the fields with the generation the operator saw and shows no value afterwards', async () => {
    const { calls, user } = await openValue();

    await user.type(await screen.findByTestId('credential-value-access_token'), SECRET);
    await user.type(screen.getByTestId('credential-value-app.private_key'), SECOND_SECRET);
    await user.click(screen.getByTestId('credential-value-submit'));

    await waitFor(() => expect(putCalls(calls)).toHaveLength(1));
    expect(putCalls(calls)[0].path).toBe(materialPath('p1'));
    expect(putCalls(calls)[0].body).toEqual({
      fields: { access_token: SECRET, 'app.private_key': SECOND_SECRET },
      expected_generation: 3,
    });
    expect(await screen.findByTestId('credentials-snackbar')).toHaveTextContent(
      'Personal value of jira_epam stored as generation 4. Probe it next.',
    );
    await waitFor(() => expect(screen.queryByTestId('credential-value-dialog')).not.toBeInTheDocument());

    // Nothing the operator typed is left in the page or in the store
    expect(document.body.innerHTML).not.toContain(SECRET);
    expect(document.body.innerHTML).not.toContain(SECOND_SECRET);
    expect(JSON.stringify(store.getState())).not.toContain(SECRET);
    expect(JSON.stringify(store.getState())).not.toContain(SECOND_SECRET);

    // A reopened dialog starts empty
    await openMenuAgain(user);
    expect(await screen.findByTestId('credential-value-access_token')).toHaveValue('');
  });

  it('clears what was typed when the dialog is cancelled, without sending anything', async () => {
    const { calls, user } = await openValue();

    await user.type(await screen.findByTestId('credential-value-access_token'), SECRET);
    await user.click(screen.getByText('Cancel'));
    await waitFor(() => expect(screen.queryByTestId('credential-value-dialog')).not.toBeInTheDocument());
    expect(putCalls(calls)).toHaveLength(0);
    expect(document.body.innerHTML).not.toContain(SECRET);

    await openMenuAgain(user);
    expect(await screen.findByTestId('credential-value-access_token')).toHaveValue('');
  });

  it('keeps the typed value out of the store after a refusal too', async () => {
    const { user } = await openValue(makePersonal({ generation: 3 }), {
      [`PUT ${materialPath('p1')}`]: refusal(400, 'INVALID_REQUEST', 'The request is not valid.'),
    });

    await user.type(await screen.findByTestId('credential-value-access_token'), SECRET);
    await user.type(screen.getByTestId('credential-value-app.private_key'), SECOND_SECRET);
    await user.click(screen.getByTestId('credential-value-submit'));

    expect(await screen.findByTestId('governance-error-code')).toHaveTextContent('INVALID_REQUEST');
    expect(JSON.stringify(store.getState())).not.toContain(SECRET);
    expect(screen.getByTestId('credential-value-dialog')).toBeInTheDocument();
  });

  it('warns and closes, with the typed value cleared, when the reference changed meanwhile', async () => {
    const { user } = await openValue(makePersonal({ generation: 3 }), {
      [`PUT ${materialPath('p1')}`]: refusal(409, 'CONCURRENT_CHANGE', 'The record changed while this ran.'),
    });

    await user.type(await screen.findByTestId('credential-value-access_token'), SECRET);
    await user.type(screen.getByTestId('credential-value-app.private_key'), SECOND_SECRET);
    await user.click(screen.getByTestId('credential-value-submit'));

    expect(await screen.findByTestId('credentials-snackbar')).toHaveTextContent(
      'was changed by someone else',
    );
    await waitFor(() => expect(screen.queryByTestId('credential-value-dialog')).not.toBeInTheDocument());
    expect(document.body.innerHTML).not.toContain(SECRET);
  });

  it('names the entries of a map of passwords and sends them as <field>.<name>', async () => {
    const row = makePersonal({ generation: 0, provider: 'openapi' });
    const { calls, user } = await openValue(row);

    await user.click(await screen.findByTestId('credential-value-headers.*-add'));
    expect(screen.getByTestId('credential-value-submit')).toBeDisabled();
    const keyInput = screen.getByTestId(/credential-value-headers\.\*-key-/);
    const valueInput = screen.getByTestId(/credential-value-headers\.\*-value-/);
    expect(valueInput).toHaveAttribute('type', 'password');
    await user.type(keyInput, 'X-Api-Key');
    await user.type(valueInput, SECRET);
    await user.click(screen.getByTestId('credential-value-submit'));

    await waitFor(() => expect(putCalls(calls)).toHaveLength(1));
    expect(putCalls(calls)[0].body).toEqual({
      fields: { 'headers.X-Api-Key': SECRET },
      expected_generation: 0,
    });
  });

  it('says so, and sends nothing, when the secret fields of the type cannot be read', async () => {
    const { calls } = await openValue(makePersonal({ provider: 'unknown_type' }));

    expect(await screen.findByTestId('credential-value-no-fields')).toBeInTheDocument();
    expect(screen.getByTestId('credential-value-submit')).toBeDisabled();
    expect(putCalls(calls)).toHaveLength(0);
  });

  it('is offered to an operator with the manage permission only', async () => {
    setup([makePersonal()], {}, [CRED_VIEW, CRED_PROBE, CRED_APPROVE]);
    const user = userEvent.setup();

    await openMenu(user, 'p1');

    expect(screen.queryByTestId('credential-action-setValue')).not.toBeInTheDocument();
  });
});

describe('detail drawer', () => {
  it('shows the reference, its lifecycle and the live grants without any value', async () => {
    setup([makeReference({ configuration_changed: true })], {
      [`GET ${refDetailPath('r1')}`]: ok({
        ...makeReference({ configuration_changed: true }),
        grants_count: 3,
        ledger_in_flight: false,
      }),
    });
    const user = userEvent.setup();

    await openMenu(user, 'r1');
    await user.click(screen.getByTestId('credential-action-details'));

    const drawer = await screen.findByTestId('credential-detail-drawer');
    expect(drawer).toHaveTextContent('github_config');
    await waitFor(() => expect(screen.getByTestId('credential-field-grants')).toHaveTextContent('3'));
    expect(screen.getByTestId('credential-field-in-flight')).toHaveTextContent('No');
    expect(screen.getByTestId('credential-field-changed')).toHaveTextContent('Yes');
    expect(screen.getByTestId('credential-field-approved-by')).toHaveTextContent('approver@example.com');
  });

  it('shows the owner and the personal-credential notice for a personal reference', async () => {
    setup([makePersonal()], {
      [`GET ${refDetailPath('p1')}`]: ok({ ...makePersonal(), grants_count: 0, ledger_in_flight: true }),
    });
    const user = userEvent.setup();

    await openMenu(user, 'p1');
    await user.click(screen.getByTestId('credential-action-details'));

    const drawer = await screen.findByTestId('credential-detail-drawer');
    expect(drawer.closest('.MuiDrawer-root')).toHaveTextContent('Recorded and checked for every run.');
    expect(screen.getByTestId('credential-field-owner')).toHaveTextContent('u1@epam.com');
    expect(screen.queryByTestId('credential-field-changed')).not.toBeInTheDocument();
  });

  it('shows the refusal when the reference cannot be read', async () => {
    setup([makeReference()], {
      [`GET ${refDetailPath('r1')}`]: refusal(
        404,
        'REFERENCE_NOT_FOUND',
        'No such credential reference in this project.',
      ),
    });
    const user = userEvent.setup();

    await openMenu(user, 'r1');
    await user.click(screen.getByTestId('credential-action-details'));

    expect(await screen.findByText('No such credential reference in this project.')).toBeInTheDocument();
  });
});

// The type list is only needed by the value dialog
describe('requests', () => {
  it('does not read the type list until a personal value is being set', async () => {
    const calls = setup([makeReference()], { [`GET ${TYPES_PATH}`]: ok(makeTypes()) }, [CRED_VIEW]);
    await screen.findByTestId('credential-open-r1');

    expect(calls.some(call => call.path === TYPES_PATH)).toBe(false);
  });
});
