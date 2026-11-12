import { afterEach, describe, expect, it, vi } from 'vitest';

import DefaultDatasetSection from '@/pages/AgentEvaluationPage/components/DefaultDatasetSection';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  DATASET_PATH,
  EDIT,
  VIEW,
  fail,
  makeDataset,
  mockApi,
  ok,
  renderWithProviders,
} from './evalAutoTest.helpers';

const setup = async (dataset = makeDataset(), { permissions = [VIEW, EDIT], put, post } = {}) => {
  const calls = mockApi({
    [`GET ${DATASET_PATH}`]: ok(dataset),
    [`PUT ${DATASET_PATH}`]: put ?? (({ body }) => ok({ ...dataset, ...body, customized: true })),
    [`POST ${DATASET_PATH}`]: post ?? ok({ updated_datasets: 2, synced_projects: 3, failures: [] }),
  });
  const user = userEvent.setup();
  renderWithProviders(<DefaultDatasetSection />, { permissions });
  await screen.findByTestId('eval-auto-probe-0');
  return { calls, user };
};

const callsOf = (calls, method) => calls.filter(call => call.method === method && call.path === DATASET_PATH);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loading the probes', () => {
  it('shows one field per stored probe', async () => {
    await setup();

    expect(screen.getByTestId('eval-auto-probe-0')).toHaveValue('Who are you and what can you help with?');
    expect(screen.getByTestId('eval-auto-probe-1')).toHaveValue(
      'Summarize what you just told me in one sentence.',
    );
    expect(screen.queryByTestId('eval-auto-probe-2')).not.toBeInTheDocument();
  });

  it('is read-only without the edit permission', async () => {
    await setup(makeDataset(), { permissions: [VIEW] });

    expect(screen.getByTestId('eval-auto-probe-0')).toBeDisabled();
    expect(screen.queryByTestId('eval-auto-probes-save')).not.toBeInTheDocument();
    expect(screen.queryByTestId('eval-auto-probes-resync')).not.toBeInTheDocument();
    expect(screen.queryByTestId('eval-auto-probe-remove-0')).not.toBeInTheDocument();
  });

  it('reports a failed load', async () => {
    mockApi({ [`GET ${DATASET_PATH}`]: fail(500, { error: 'boom' }) });
    renderWithProviders(<DefaultDatasetSection />, { permissions: [VIEW, EDIT] });

    expect(await screen.findByText('Failed to load the default dataset.')).toBeInTheDocument();
  });
});

describe('editing', () => {
  it('saves the cleaned probes and says agents keep their copy until a resync', async () => {
    const { calls, user } = await setup();
    expect(screen.getByTestId('eval-auto-probes-save')).toBeDisabled();

    await user.clear(screen.getByTestId('eval-auto-probe-1'));
    await user.type(screen.getByTestId('eval-auto-probe-1'), '  What is your refund policy?  ');
    // Resync works on the saved probes, so it waits for the save
    expect(screen.getByTestId('eval-auto-probes-resync')).toBeDisabled();
    await user.click(screen.getByTestId('eval-auto-probes-save'));

    await waitFor(() => expect(callsOf(calls, 'PUT')).toHaveLength(1));
    expect(callsOf(calls, 'PUT')[0].body).toEqual({
      probes: ['Who are you and what can you help with?', 'What is your refund policy?'],
    });
    expect(await screen.findByTestId('eval-auto-dataset-notice')).toHaveTextContent(
      'Probes saved. Agents keep their current copy until you resync.',
    );
  });

  it('removes and adds probes', async () => {
    const { calls, user } = await setup();

    await user.click(screen.getByTestId('eval-auto-probe-remove-0'));
    expect(screen.getByTestId('eval-auto-probe-0')).toHaveValue(
      'Summarize what you just told me in one sentence.',
    );
    await user.click(screen.getByTestId('eval-auto-probe-add'));
    await user.type(screen.getByTestId('eval-auto-probe-1'), 'Which tools can you use?');
    await user.click(screen.getByTestId('eval-auto-probes-save'));

    await waitFor(() => expect(callsOf(calls, 'PUT')).toHaveLength(1));
    expect(callsOf(calls, 'PUT')[0].body).toEqual({
      probes: ['Summarize what you just told me in one sentence.', 'Which tools can you use?'],
    });
  });

  it('discards the edits', async () => {
    const { user } = await setup();

    await user.click(screen.getByTestId('eval-auto-probe-remove-0'));
    await user.click(screen.getByTestId('eval-auto-probes-reset'));

    expect(screen.getByTestId('eval-auto-probe-0')).toHaveValue('Who are you and what can you help with?');
    expect(screen.getByTestId('eval-auto-probes-save')).toBeDisabled();
  });

  it('cannot save an empty list', async () => {
    const { user } = await setup(makeDataset({ probes: ['Only one'] }));

    await user.click(screen.getByTestId('eval-auto-probe-remove-0'));

    expect(screen.getByTestId('eval-auto-probes-save')).toBeDisabled();
  });

  it('stops adding at the probe limit', async () => {
    await setup(makeDataset({ probes: Array.from({ length: 10 }, (_, at) => `Probe ${at}`) }));

    expect(screen.getByTestId('eval-auto-probe-add')).toBeDisabled();
  });

  it('shows the server refusal', async () => {
    const { user } = await setup(makeDataset(), {
      put: fail(400, { error: 'A probe is longer than 2000 characters.' }),
    });

    await user.click(screen.getByTestId('eval-auto-probe-remove-0'));
    await user.click(screen.getByTestId('eval-auto-probes-save'));

    expect(await screen.findByTestId('eval-auto-dataset-notice')).toHaveTextContent(
      'A probe is longer than 2000 characters.',
    );
  });
});

describe('resync', () => {
  it('rewrites the agent copies and reports how many changed', async () => {
    const { calls, user } = await setup();

    await user.click(screen.getByTestId('eval-auto-probes-resync'));

    await waitFor(() => expect(callsOf(calls, 'POST')).toHaveLength(1));
    expect(await screen.findByTestId('eval-auto-dataset-notice')).toHaveTextContent(
      'Updated 2 agent copies.',
    );
  });

  it('warns about the projects that failed', async () => {
    const { user } = await setup(makeDataset(), {
      post: ok({ updated_datasets: 0, synced_projects: 2, failures: [{ project_id: 9 }] }),
    });

    await user.click(screen.getByTestId('eval-auto-probes-resync'));

    expect(await screen.findByTestId('eval-auto-dataset-notice')).toHaveTextContent(
      'Every agent copy is up to date. 1 project(s) failed; see the server log.',
    );
  });
});
