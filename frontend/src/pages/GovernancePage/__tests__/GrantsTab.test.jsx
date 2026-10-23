import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GrantsTab } from '@/pages/GovernancePage/components/GrantsTab';
import store, { setUser } from '@/store';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  CRED_APPROVE,
  CRED_MANAGE,
  CRED_VIEW,
  GRANTS_PATH,
  OPERATOR_ID,
  REFS_PATH,
  USERS_PATH,
  grantActionPath,
  listOf,
  makeGrant,
  makePersonal,
  makeReference,
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
import {
  LIST_PATH as BINDINGS_PATH,
  PROJECTS_PATH,
  detailPath,
  makeDetail,
  makeIdentity,
  rememberProject,
} from './identitiesTest.helpers';

const ALL = [CRED_VIEW, CRED_MANAGE, CRED_APPROVE];

const listCalls = calls => calls.filter(call => call.method === 'GET' && call.path === GRANTS_PATH);
const postCalls = calls => calls.filter(call => call.method === 'POST');

const openMenu = async (user, id) => {
  await user.click(await screen.findByTestId(`grant-actions-${id}`));
};

const menuActions = () =>
  screen
    .queryAllByTestId(/^grant-action-/)
    .map(item => item.dataset.testid.replace('grant-action-', ''))
    .filter(name => name !== 'details');

const refusal = (status, code, message) => fail(status, { error: message, code });

const setup = (rows, handlers = {}, permissions = ALL) => {
  const calls = mockApi({
    [`GET ${GRANTS_PATH}`]: listOf(rows),
    [`GET ${USERS_PATH}`]: usersResponse(),
    ...handlers,
  });
  renderWithProviders(<GrantsTab />, { permissions });
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
    renderWithProviders(<GrantsTab />, { permissions: [CRED_VIEW] });

    expect(await screen.findByText('Choose a project to see its grants.')).toBeInTheDocument();
    expect(calls.some(call => call.path === GRANTS_PATH)).toBe(false);
  });

  it('shows agent, toolkit, credential, user, state, validity and approver', async () => {
    setup(
      [
        makeGrant(),
        makeGrant({
          id: 'g2',
          binding: { id: 'b2', application_name: 'Triage bot', version_name: 'v14' },
          credential: {
            id: 'r2',
            provider: 'github',
            configuration_title: 'github_config',
            ownership_class: 'service',
          },
          state: 'active',
          valid_until: '2027-01-01T00:00:00+00:00',
          approved_by: { id: 2, email: 'approver@example.com' },
        }),
      ],
      {},
      [CRED_VIEW],
    );

    expect(await screen.findByTestId('grant-open-g1')).toHaveTextContent('Jira helper v47');
    expect(screen.getByTestId('grant-open-g2')).toHaveTextContent('Triage bot v14');
    expect(screen.getAllByTestId('grant-state-chip').map(chip => chip.textContent)).toEqual([
      'Pending approval',
      'Active',
    ]);
    expect(screen.getAllByText('jira_epam')).toHaveLength(1);
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getAllByTestId('grant-subject')[0]).toHaveTextContent('u1@epam.com');
    expect(screen.getByText('No end date')).toBeInTheDocument();
    expect(screen.getByText('approver@example.com')).toBeInTheDocument();
  });

  it('shows the raw reference with a "Not a member" chip for a subject that is no member', async () => {
    setup([makeGrant({ subject: { ref: 'idp:tenant:gone', user: null } })], {}, [CRED_VIEW]);

    expect(await screen.findByTestId('grant-subject')).toHaveTextContent('idp:tenant:gone');
    expect(screen.getByTestId('grant-not-member-chip')).toBeInTheDocument();
  });

  it('sends the project, the default sort and the page size of 20', async () => {
    const calls = setup([makeGrant()], {}, [CRED_VIEW]);
    await screen.findByTestId('grant-open-g1');

    expect(listCalls(calls)[0].params).toEqual({
      limit: '20',
      offset: '0',
      sort_by: 'updated_at',
      sort_order: 'desc',
    });
  });

  it('builds the query from the user and state filters, the sort and the page', async () => {
    const rows = Array.from({ length: 20 }, (_, index) => makeGrant({ id: `g${index}` }));
    const calls = setup(rows, { [`GET ${GRANTS_PATH}`]: ok({ total: 45, rows }) }, [CRED_VIEW]);
    const user = userEvent.setup();
    await screen.findByTestId('grant-open-g0');

    await user.click(screen.getByTestId('grants-user-filter-input'));
    await user.click(await screen.findByRole('option', { name: 'u1@epam.com' }));
    await waitFor(() => expect(listCalls(calls).at(-1).params.subject_user_id).toBe('7'));

    await user.click(screen.getByTestId('grants-state-filter'));
    await user.click(await screen.findByTestId('grants-state-suspended'));
    await waitFor(() => expect(listCalls(calls).at(-1).params.state).toBe('suspended'));

    const stateHeader = screen
      .getAllByText('State')
      .find(element => !element.closest('[data-testid="grants-toolbar"]'));
    await user.click(stateHeader);
    await waitFor(() => expect(listCalls(calls).at(-1).params.sort_by).toBe('state'));

    const pageInfo = screen.getByText('1 - 20 of 45');
    await user.click(pageInfo.parentElement.querySelectorAll('button')[1]);
    await waitFor(() =>
      expect(listCalls(calls).at(-1).params).toMatchObject({
        subject_user_id: '7',
        state: 'suspended',
        sort_by: 'state',
        sort_order: 'asc',
        limit: '20',
        offset: '20',
      }),
    );
  });

  it('says so when the project has no grants and when filters match nothing', async () => {
    setup([], {}, [CRED_VIEW, CRED_MANAGE]);
    const user = userEvent.setup();

    expect(
      await screen.findByText('No grants in Team Alpha yet. Use Create grant to add one.'),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId('grants-state-filter'));
    await user.click(await screen.findByTestId('grants-state-revoked'));
    expect(await screen.findByText('No grants match the filters.')).toBeInTheDocument();
  });

  it('shows the readable refusal with its code when the list cannot be read', async () => {
    setup(
      [],
      { [`GET ${GRANTS_PATH}`]: refusal(403, 'FORBIDDEN', 'You do not have permission to do this.') },
      [CRED_VIEW],
    );

    expect(await screen.findByTestId('governance-error')).toHaveTextContent('You do not have permission');
    expect(screen.getByTestId('governance-error-code')).toHaveTextContent('FORBIDDEN');
  });
});

describe('row actions per state and permission', () => {
  it.each([
    ['pending_approval', ['approve', 'revoke']],
    ['active', ['suspend', 'revoke']],
    ['suspended', ['resume', 'revoke']],
    ['revoked', []],
  ])('offers for %s the actions valid from it', async (state, expected) => {
    setup([makeGrant({ state })]);
    const user = userEvent.setup();

    await openMenu(user, 'g1');

    expect(menuActions()).toEqual(expected);
    expect(screen.getByTestId('grant-action-details')).toBeInTheDocument();
  });

  it.each([
    ['view', [CRED_VIEW], []],
    ['manage', [CRED_VIEW, CRED_MANAGE], ['revoke']],
    ['approve', [CRED_VIEW, CRED_APPROVE], ['approve']],
  ])('with only the %s permission: pending approval', async (_, permissions, expected) => {
    setup([makeGrant()], {}, permissions);
    const user = userEvent.setup();

    await openMenu(user, 'g1');

    expect(menuActions()).toEqual(expected);
  });

  it('disables approval, with the reason, for the operator who created the grant', async () => {
    setup(
      [makeGrant({ id: 'own', created_by: { id: OPERATOR_ID, email: 'me' } }), makeGrant({ id: 'other' })],
      {},
      [CRED_VIEW, CRED_APPROVE],
    );
    const user = userEvent.setup();

    await openMenu(user, 'own');
    expect(screen.getByTestId('grant-action-approve')).toHaveAttribute('aria-disabled', 'true');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByTestId('grant-action-approve')).not.toBeInTheDocument());

    await openMenu(user, 'other');
    expect(screen.getByTestId('grant-action-approve')).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('shows the create button only with the manage permission', async () => {
    setup([], {}, [CRED_VIEW]);
    await screen.findByTestId('grants-toolbar');
    expect(screen.queryByTestId('grants-create')).not.toBeInTheDocument();
  });
});

describe('actions', () => {
  it.each([
    ['active', 'suspend'],
    ['suspended', 'resume'],
    ['active', 'revoke'],
  ])('confirms %s -> %s and sends only the action', async (state, action) => {
    const calls = setup([makeGrant({ state })], {
      [`POST ${grantActionPath('g1')}`]: ok({ ok: true, id: 'g1', state: 'x' }),
    });
    const user = userEvent.setup();

    await openMenu(user, 'g1');
    await user.click(screen.getByTestId(`grant-action-${action}`));
    await user.click(await screen.findByTestId('grant-confirm-submit'));

    await waitFor(() => expect(postCalls(calls)).toHaveLength(1));
    expect(postCalls(calls)[0].body).toEqual({ action });
    expect(await screen.findByTestId('grants-snackbar')).toHaveTextContent('Jira helper v47 · jira');
  });

  it('says what revoking does before it is confirmed', async () => {
    setup([makeGrant({ state: 'active' })]);
    const user = userEvent.setup();

    await openMenu(user, 'g1');
    await user.click(screen.getByTestId('grant-action-revoke'));

    expect(screen.getByTestId('grant-confirm-dialog')).toHaveTextContent('Revoking is permanent');
  });

  it('renders a refusal with its message and code, and keeps the dialog open', async () => {
    setup([makeGrant({ state: 'active' })], {
      [`POST ${grantActionPath('g1')}`]: refusal(
        409,
        'INVALID_TRANSITION',
        'This change is not allowed from the current state.',
      ),
    });
    const user = userEvent.setup();

    await openMenu(user, 'g1');
    await user.click(screen.getByTestId('grant-action-suspend'));
    await user.click(screen.getByTestId('grant-confirm-submit'));

    expect(await screen.findByTestId('governance-error')).toHaveTextContent('not allowed');
    expect(screen.getByTestId('governance-error-code')).toHaveTextContent('INVALID_TRANSITION');
    expect(screen.getByTestId('grant-confirm-dialog')).toBeInTheDocument();
  });

  it('warns and reads the list again when the grant changed meanwhile', async () => {
    const calls = setup([makeGrant({ state: 'active' })], {
      [`POST ${grantActionPath('g1')}`]: refusal(
        409,
        'CONCURRENT_CHANGE',
        'The record changed while this ran.',
      ),
    });
    const user = userEvent.setup();
    await screen.findByTestId('grant-open-g1');
    const before = listCalls(calls).length;

    await openMenu(user, 'g1');
    await user.click(screen.getByTestId('grant-action-suspend'));
    await user.click(screen.getByTestId('grant-confirm-submit'));

    expect(await screen.findByTestId('grants-snackbar')).toHaveTextContent('was changed by someone else');
    await waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
  });
});

describe('approve dialog', () => {
  const open = async (user, handlers = {}, permissions = ALL) => {
    const calls = setup(
      [makeGrant()],
      { [`POST ${grantActionPath('g1')}`]: ok({ ok: true }), ...handlers },
      permissions,
    );
    await openMenu(user, 'g1');
    await user.click(screen.getByTestId('grant-action-approve'));
    return calls;
  };

  it('explains the second-admin rule and needs both references', async () => {
    const user = userEvent.setup();
    await open(user);

    expect(screen.getByTestId('grant-approve-dialog')).toHaveTextContent(
      'A second administrator must approve',
    );
    expect(screen.getByTestId('grant-approve-submit')).toBeDisabled();
    await user.type(screen.getByTestId('grant-approve-ref'), 'TICKET-9');
    expect(screen.getByTestId('grant-approve-submit')).toBeDisabled();
    await user.type(screen.getByTestId('grant-approve-policy'), 'CHG-2');
    expect(screen.getByTestId('grant-approve-submit')).toBeEnabled();
  });

  it('sends the approval reference and the policy revision', async () => {
    const user = userEvent.setup();
    const calls = await open(user);

    await user.type(screen.getByTestId('grant-approve-ref'), 'TICKET-9');
    await user.type(screen.getByTestId('grant-approve-policy'), 'CHG-2');
    await user.click(screen.getByTestId('grant-approve-submit'));

    await waitFor(() => expect(postCalls(calls)).toHaveLength(1));
    expect(postCalls(calls)[0].body).toEqual({
      action: 'approve',
      approval_ref: 'TICKET-9',
      policy_revision: 'CHG-2',
    });
    expect(await screen.findByTestId('grants-snackbar')).toHaveTextContent('approved');
  });

  it('prefills the effective policy revision when the operator can read the setting', async () => {
    const user = userEvent.setup();
    const settings = makeSettings();
    settings.effective.policy_revision = 'CHG-7';
    await open(user, { [`GET ${SETTINGS_PATH}`]: ok(settings) }, [...ALL, 'governance.settings.view']);

    await waitFor(() => expect(screen.getByTestId('grant-approve-policy')).toHaveValue('CHG-7'));
  });

  it('renders the self-approval refusal with its message and code', async () => {
    const user = userEvent.setup();
    await open(user, {
      [`POST ${grantActionPath('g1')}`]: refusal(
        403,
        'SELF_APPROVAL',
        'The creator of a record cannot approve it.',
      ),
    });

    await user.type(screen.getByTestId('grant-approve-ref'), 'TICKET-9');
    await user.type(screen.getByTestId('grant-approve-policy'), 'CHG-2');
    await user.click(screen.getByTestId('grant-approve-submit'));

    expect(await screen.findByTestId('governance-error')).toHaveTextContent('cannot approve it');
    expect(screen.getByTestId('governance-error-code')).toHaveTextContent('SELF_APPROVAL');
  });
});

describe('create dialog', () => {
  const REF = makeReference({ id: 'r1' });
  const PERSONAL = makePersonal({
    id: 'p1',
    configuration: { uuid: 'becf88bf-0000-4000-8000-000000000001', title: 'github_personal' },
    state: 'active',
  });
  const OTHER = makeReference({
    id: 'r9',
    configuration: { uuid: 'becf88bf-0000-4000-8000-000000000077', title: 'unrelated_config' },
  });
  const RETIRED = makeReference({ id: 'r8', state: 'retired', configuration: REF.configuration });

  const handlers = (extra = {}) => ({
    [`GET ${BINDINGS_PATH}`]: listOf([
      makeIdentity(),
      makeIdentity({ id: 'b2', application: { id: 6, name: 'Retired bot' }, state: 'retired' }),
    ]),
    [`GET ${detailPath('b1')}`]: ok(makeDetail()),
    [`GET ${REFS_PATH}`]: listOf([REF, PERSONAL, OTHER, RETIRED]),
    [`POST ${GRANTS_PATH}`]: ok({ ok: true, id: 'new', state: 'pending_approval' }),
    ...extra,
  });

  const pickBindingAndToolkit = async user => {
    await user.click(await screen.findByTestId('grants-create'));
    await user.click(await screen.findByTestId('grant-create-binding'));
    await user.click(await screen.findByText('Jira helper v47'));
    await user.click(screen.getByTestId('grant-create-toolkit'));
    await user.click(await screen.findByTestId('grant-create-toolkit-41'));
  };

  const pickCredential = async (user, id) => {
    await user.click(screen.getByTestId('grant-create-credential'));
    await user.click(await screen.findByTestId(`grant-create-credential-${id}`));
  };

  it('offers only active and pending identities, then the toolkits of the one chosen', async () => {
    setup([], handlers());
    const user = userEvent.setup();

    await user.click(await screen.findByTestId('grants-create'));
    await user.click(await screen.findByTestId('grant-create-binding'));
    expect(await screen.findByText('Jira helper v47')).toBeInTheDocument();
    expect(screen.queryByText('Retired bot v47')).not.toBeInTheDocument();
    expect(screen.getByTestId('grant-create-toolkit').closest('.MuiInputBase-root')).toHaveClass(
      'Mui-disabled',
    );
  });

  it('offers the credentials of the toolkit’s configuration only, without retired ones', async () => {
    setup([], handlers());
    const user = userEvent.setup();

    await pickBindingAndToolkit(user);
    await user.click(screen.getByTestId('grant-create-credential'));

    expect(await screen.findByTestId('grant-create-credential-r1')).toBeInTheDocument();
    expect(screen.getByTestId('grant-create-credential-p1')).toBeInTheDocument();
    expect(screen.queryByTestId('grant-create-credential-r9')).not.toBeInTheDocument();
    expect(screen.queryByTestId('grant-create-credential-r8')).not.toBeInTheDocument();
  });

  it('creates the grant for the chosen binding, toolkit, credential and user', async () => {
    const calls = setup([], handlers());
    const user = userEvent.setup();

    await pickBindingAndToolkit(user);
    expect(screen.getByTestId('grant-create-submit')).toBeDisabled();
    await pickCredential(user, 'r1');
    await user.click(screen.getByTestId('grant-create-user-input'));
    await user.click(await screen.findByText('u2@epam.com'));
    await user.click(screen.getByTestId('grant-create-submit'));

    await waitFor(() => expect(postCalls(calls)).toHaveLength(1));
    expect(postCalls(calls)[0].path).toBe(GRANTS_PATH);
    expect(postCalls(calls)[0].body).toEqual({
      agent_binding_ref: 'b1',
      toolkit_id: 41,
      credential_ref: 'r1',
      subject_user_id: 8,
    });
    expect(await screen.findByTestId('grants-snackbar')).toHaveTextContent('It is pending approval.');
    await waitFor(() => expect(screen.queryByTestId('grant-create-dialog')).not.toBeInTheDocument());
  });

  it('fills in the owner of a personal credential and does not let the operator change it', async () => {
    const calls = setup([], handlers());
    const user = userEvent.setup();

    await pickBindingAndToolkit(user);
    await pickCredential(user, 'p1');

    expect(screen.getByTestId('grant-create-user-input')).toHaveValue('u1@epam.com');
    expect(screen.getByTestId('grant-create-user-input')).toBeDisabled();
    expect(screen.getByTestId('grant-create-dialog')).toHaveTextContent(
      'A personal credential can be granted only to its owner.',
    );
    await user.click(screen.getByTestId('grant-create-submit'));

    await waitFor(() => expect(postCalls(calls)).toHaveLength(1));
    expect(postCalls(calls)[0].body).toMatchObject({ credential_ref: 'p1', subject_user_id: 7 });
  });

  it('sends the end date as an ISO time with an offset, and refuses a date in the past or too far ahead', async () => {
    const calls = setup([], handlers());
    const user = userEvent.setup();

    await pickBindingAndToolkit(user);
    await pickCredential(user, 'r1');
    await user.click(screen.getByTestId('grant-create-user-input'));
    await user.click(await screen.findByText('u2@epam.com'));

    const field = screen.getByTestId('grant-create-valid-until');
    fireEvent.change(field, { target: { value: '2001-01-01T10:00' } });
    expect(screen.getByTestId('grant-create-dialog')).toHaveTextContent(
      'The end date must be in the future.',
    );
    expect(screen.getByTestId('grant-create-submit')).toBeDisabled();

    fireEvent.change(field, { target: { value: '2099-01-01T10:00' } });
    expect(screen.getByTestId('grant-create-dialog')).toHaveTextContent('at most 365 days');
    expect(screen.getByTestId('grant-create-submit')).toBeDisabled();

    const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const pad = value => String(value).padStart(2, '0');
    const local = `${soon.getFullYear()}-${pad(soon.getMonth() + 1)}-${pad(soon.getDate())}T${pad(soon.getHours())}:${pad(soon.getMinutes())}`;
    fireEvent.change(field, { target: { value: local } });
    expect(screen.getByTestId('grant-create-submit')).toBeEnabled();
    await user.click(screen.getByTestId('grant-create-submit'));

    await waitFor(() => expect(postCalls(calls)).toHaveLength(1));
    const { valid_until: validUntil } = postCalls(calls)[0].body;
    expect(validUntil).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\+00:00$/);
    expect(new Date(validUntil).getTime()).toBe(new Date(local).getTime());
  });

  it('shows the refusal with its code and keeps the dialog open', async () => {
    setup(
      [],
      handlers({
        [`POST ${GRANTS_PATH}`]: refusal(409, 'GRANT_EXISTS', 'This credential use grant already exists.'),
      }),
    );
    const user = userEvent.setup();

    await pickBindingAndToolkit(user);
    await pickCredential(user, 'r1');
    await user.click(screen.getByTestId('grant-create-user-input'));
    await user.click(await screen.findByText('u2@epam.com'));
    await user.click(screen.getByTestId('grant-create-submit'));

    expect(await screen.findByTestId('governance-error')).toHaveTextContent('already exists');
    expect(screen.getByTestId('governance-error-code')).toHaveTextContent('GRANT_EXISTS');
    expect(screen.getByTestId('grant-create-dialog')).toBeInTheDocument();
  });

  it('says so when no credential is registered for the toolkit’s configuration', async () => {
    setup([], handlers({ [`GET ${REFS_PATH}`]: listOf([OTHER]) }));
    const user = userEvent.setup();

    await pickBindingAndToolkit(user);

    expect(await screen.findByTestId('grant-create-no-credentials')).toBeInTheDocument();
  });
});

describe('detail drawer', () => {
  it('shows the grant, its validity, approval and epoch', async () => {
    setup([
      makeGrant({
        state: 'active',
        valid_until: '2027-01-01T00:00:00+00:00',
        approval_ref: 'TICKET-5',
        approved_by: { id: 2, email: 'approver@example.com' },
        revocation_epoch: 2,
      }),
    ]);
    const user = userEvent.setup();

    await openMenu(user, 'g1');
    await user.click(screen.getByTestId('grant-action-details'));

    expect(await screen.findByTestId('grant-detail-drawer')).toHaveTextContent('Jira helper v47');
    expect(screen.getByTestId('grant-field-user')).toHaveTextContent('u1@epam.com');
    expect(screen.getByTestId('grant-field-approval')).toHaveTextContent('TICKET-5');
    expect(screen.getByTestId('grant-field-approved-by')).toHaveTextContent('approver@example.com');
    expect(screen.getByTestId('grant-field-epoch')).toHaveTextContent('2');
  });
});
