import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import getDesignTokens from '@/theme/main.theme';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { PylonCardsSection } from '../index';

const INDEXER = 'pylon_indexer_1a2b3c4d-1111-2222-3333-444444444444';
const MAIN = 'pylon_main_9f8e7d6c-1111-2222-3333-555555555555';

const toggle = (key, title, pylonId) => ({ key, title, type: 'boolean', pylon_id: pylonId });

const FIELDS = [
  toggle('tracing_enabled::pylon_main', 'Tracing', MAIN),
  toggle('show_analytics', 'Show Analytics', MAIN),
  toggle('task_queue_debug', 'Task Queue Debug', INDEXER),
  toggle('sdk_dev_reload', 'SDK Hot Reload', INDEXER),
];

const renderSection = (props = {}) =>
  render(
    <ThemeProvider theme={createTheme(getDesignTokens('dark'))}>
      <PylonCardsSection
        sectionId="runtime"
        fields={FIELDS}
        values={{ sdk_dev_reload: true, task_queue_debug: false }}
        onChange={vi.fn()}
        {...props}
      />
    </ThemeProvider>,
  );

const cardHeader = title => screen.getByRole('button', { name: new RegExp(title) });

describe('PylonCardsSection', () => {
  it('shows one card per pylon in the configured order, each with its setting count', () => {
    renderSection();

    const headers = screen.getAllByRole('button');
    expect(headers.map(header => header.textContent)).toEqual([
      expect.stringContaining('Pylon Indexer2 settings'),
      expect.stringContaining('Pylon Main2 settings'),
    ]);
  });

  it('starts every card collapsed and expands each one on its own', () => {
    renderSection();

    expect(cardHeader('Pylon Indexer')).toHaveAttribute('aria-expanded', 'false');
    expect(cardHeader('Pylon Main')).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(cardHeader('Pylon Indexer'));

    expect(cardHeader('Pylon Indexer')).toHaveAttribute('aria-expanded', 'true');
    expect(cardHeader('Pylon Main')).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the settings mounted while collapsed, and expanding or collapsing never changes a value', () => {
    const onChange = vi.fn();
    renderSection({ onChange });

    const indexerHeader = cardHeader('Pylon Indexer');
    const indexerContent = indexerHeader.parentElement;

    fireEvent.click(indexerHeader);
    expect(within(indexerContent).getByText('SDK Hot Reload')).toBeInTheDocument();

    fireEvent.click(indexerHeader);
    expect(within(indexerContent).getByText('SDK Hot Reload')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows the section description once, above the cards', () => {
    renderSection({ sectionDescription: 'Configure indexer runtime behavior.' });

    expect(screen.getByText('Configure indexer runtime behavior.')).toBeInTheDocument();
  });

  it('shows the empty-state message when no setting is visible', () => {
    renderSection({ fields: [] });

    expect(screen.getByText('No configurable fields available for this section.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
