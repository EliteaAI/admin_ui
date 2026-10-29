import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GovernancePage } from '@/pages/GovernancePage';
import store, { setUser } from '@/store';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  SETTINGS_PATH,
  VIEW,
  makeSettings,
  mockApi,
  ok,
  renderWithProviders,
} from './governanceTest.helpers';
import {
  BINDINGS_APPROVE,
  BINDINGS_MANAGE,
  BINDINGS_VIEW,
  PROJECT,
  rememberProject,
} from './identitiesTest.helpers';

const OWNER_ID = 5;
const OPERATOR_ID = 11;
const LIST_PATH = `/elitea_core/autonomous_mandates/administration/${PROJECT.id}`;
const actionPath = id => `/elitea_core/autonomous_mandate_action/administration/${PROJECT.id}/${id}`;

const makeMandate = (overrides = {}) => ({
  id: 'm1',
  application: { id: 5, name: 'SharePoint reader' },
  version: { id: 51, name: 'v1' },
  owner: { id: OWNER_ID, email: 'owner@example.com' },
  state: 'active',
  revision: 1,
  operations: ['run:schedule'],
  max_runtime_s: 600,
  valid_until: '2026-11-30T23:59:00+00:00',
  created_by: { id: 3, email: 'creator@example.com' },
  approved_by: { id: 4, email: 'approver@example.com' },
  approval_ref: 'CHG-1',
  policy_revision: 'rev-1',
  identity_source: 'owner_delegated',
  consented: false,
  consented_at: null,
  ...overrides,
});

const list = (rows, sources = ['owner_delegated']) =>
  ok({ total: rows.length, rows, identity_sources: sources });

const setup = (
  rows,
  { userId = OWNER_ID, permissions = [BINDINGS_VIEW, BINDINGS_MANAGE], extra = {} } = {},
) => {
  store.dispatch(setUser({ id: userId, name: 'User', email: 'user@example.com' }));
  const calls = mockApi({
    [`GET ${LIST_PATH}`]: list(rows),
    [`GET ${SETTINGS_PATH}`]: ok(makeSettings()),
    ...extra,
  });
  renderWithProviders(<GovernancePage />, {
    permissions: [VIEW, ...permissions],
    route: '/governance?tab=mandates',
  });
  return calls;
};

const openActions = async (user, id = 'm1') => {
  await user.click(await screen.findByTestId(`mandate-actions-${id}`));
};

beforeEach(() => rememberProject());
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('Mandates tab', () => {
  it('lists the mandates of the project with the identity their runs act with and the consent state', async () => {
    setup([
      makeMandate(),
      makeMandate({ id: 'm2', identity_source: null, owner: { id: 9, email: 'b@example.com' } }),
    ]);

    const table = await screen.findByTestId('governance-mandates');
    await waitFor(() => expect(within(table).getAllByTestId('mandate-state-chip')).toHaveLength(2));
    expect(table).toHaveTextContent('SharePoint reader');
    expect(table).toHaveTextContent('owner@example.com');
    expect(table).toHaveTextContent("Owner's Microsoft sign-in");
    expect(table).toHaveTextContent('Consent needed');
    expect(table).toHaveTextContent('None');
  });

  it('offers the owner, and only the owner, to give consent, and sends the consent action', async () => {
    const calls = setup([makeMandate()], {
      extra: { [`POST ${actionPath('m1')}`]: ok({ ok: true, id: 'm1' }) },
    });
    const user = userEvent.setup();

    await openActions(user);
    await user.click(screen.getByTestId('mandate-action-consent'));
    const dialog = await screen.findByTestId('mandate-confirm-dialog');
    expect(dialog).toHaveTextContent('Signing out does not end it');
    await user.click(within(dialog).getByTestId('mandate-confirm-submit'));

    await waitFor(() => expect(calls.some(call => call.method === 'POST')).toBe(true));
    expect(calls.find(call => call.method === 'POST').body).toEqual({ action: 'consent' });
    expect(await screen.findByTestId('mandates-snackbar')).toHaveTextContent('consented');
  });

  it('does not offer consent to an operator who is not the owner', async () => {
    setup([makeMandate()], { userId: OPERATOR_ID });
    const user = userEvent.setup();

    await openActions(user);
    expect(screen.queryByTestId('mandate-action-consent')).not.toBeInTheDocument();
    expect(screen.getByTestId('mandate-action-revoke')).toBeInTheDocument();
  });

  it('lets an operator withdraw a consent, and shows a refusal readably', async () => {
    const calls = setup([makeMandate({ consented: true, consented_at: '2026-10-29T10:00:00+00:00' })], {
      userId: OPERATOR_ID,
      extra: {
        [`POST ${actionPath('m1')}`]: {
          status: 409,
          body: { error: 'The mandate has no consent to withdraw.', code: 'CONSENT_NOT_GIVEN' },
        },
      },
    });
    const user = userEvent.setup();

    await openActions(user);
    await user.click(screen.getByTestId('mandate-action-withdraw_consent'));
    const dialog = await screen.findByTestId('mandate-confirm-dialog');
    await user.click(within(dialog).getByTestId('mandate-confirm-submit'));

    expect(await within(dialog).findByText('The mandate has no consent to withdraw.')).toBeInTheDocument();
    expect(calls.find(call => call.method === 'POST').body).toEqual({ action: 'withdraw_consent' });
  });

  it('disables approval for the owner and sends approval references for another approver', async () => {
    const pending = makeMandate({ state: 'pending_approval', approved_by: null });
    const calls = setup([pending], {
      userId: OPERATOR_ID,
      permissions: [BINDINGS_VIEW, BINDINGS_APPROVE],
      extra: { [`POST ${actionPath('m1')}`]: ok({ ok: true, id: 'm1', state: 'active' }) },
    });
    const user = userEvent.setup();

    await openActions(user);
    await user.click(screen.getByTestId('mandate-action-approve'));
    const dialog = await screen.findByTestId('mandate-approve-dialog');
    await user.type(within(dialog).getByTestId('mandate-approve-ref'), 'CHG-7');
    await user.clear(within(dialog).getByTestId('mandate-approve-policy'));
    await user.type(within(dialog).getByTestId('mandate-approve-policy'), 'rev-9');
    await user.click(within(dialog).getByTestId('mandate-approve-submit'));

    await waitFor(() => expect(calls.some(call => call.method === 'POST')).toBe(true));
    expect(calls.find(call => call.method === 'POST').body).toMatchObject({
      action: 'approve',
      approval_ref: 'CHG-7',
    });
  });

  it('hides the create button from operators who cannot manage', async () => {
    setup([], { permissions: [BINDINGS_VIEW] });

    expect(await screen.findByTestId('governance-mandates')).toBeInTheDocument();
    expect(screen.queryByTestId('mandates-create')).not.toBeInTheDocument();
  });
});
