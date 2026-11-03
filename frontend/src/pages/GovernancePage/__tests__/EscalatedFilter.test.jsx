import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { IdentitiesTab } from '@/pages/GovernancePage/components/IdentitiesTab';
import store, { setUser } from '@/store';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockApi, renderWithProviders } from './governanceTest.helpers';
import { BINDINGS_VIEW, LIST_PATH, listResponse, makeIdentity, rememberProject } from './identitiesTest.helpers';

// #7269: the platform operator's inbox is the existing list with escalated=true (items nobody in the project can approve)
beforeEach(() => {
  localStorage.clear();
  rememberProject();
  store.dispatch(setUser({ id: 99, name: 'Operator', email: 'operator@example.com' }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('needs a platform operator', () => {
  it('asks for the escalated items only when ticked, and for everything again when cleared', async () => {
    const user = userEvent.setup();
    const calls = mockApi({ [`GET ${LIST_PATH}`]: listResponse([makeIdentity({ state: 'pending_approval' })]) });
    renderWithProviders(<IdentitiesTab />, { permissions: [BINDINGS_VIEW] });

    await screen.findByTestId('identity-open-b1');
    const lists = () => calls.filter(call => call.method === 'GET' && call.path === LIST_PATH);
    expect(lists()[0].params.escalated).toBeUndefined();

    await user.click(screen.getByTestId('identities-escalated'));
    await waitFor(() => expect(lists().at(-1).params).toMatchObject({ escalated: 'true', offset: '0' }));

    await user.click(screen.getByTestId('identities-escalated'));
    await waitFor(() => expect(lists().at(-1).params.escalated).toBeUndefined());
  });
});
