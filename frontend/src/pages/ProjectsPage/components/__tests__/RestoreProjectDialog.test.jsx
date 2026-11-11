import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import getDesignTokens from '@/theme/main.theme';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import RestoreProjectDialog from '../RestoreProjectDialog';

const mocks = vi.hoisted(() => ({ restore: vi.fn() }));

vi.mock('@/api/projectBackup.api', () => ({
  useProjectRestoreMutation: () => [mocks.restore, { isLoading: false }],
}));
vi.mock('@/hooks/useCheckPermission.hooks', () => ({
  useCheckPermission: () => ({ hasPermission: () => true }),
}));

const theme = createTheme(getDesignTokens('dark'));

const answer = payload => ({ unwrap: () => Promise.resolve(payload) });
const refusal = payload => ({ unwrap: () => Promise.reject({ status: 409, data: payload }) });

const renderDialog = () =>
  render(
    <ThemeProvider theme={theme}>
      <RestoreProjectDialog
        open
        onClose={vi.fn()}
        project={{ id: 10, name: 'Team Project' }}
      />
    </ThemeProvider>,
  );

const fileInput = () => document.querySelector('input[type="file"]');

const pickAndSubmit = async () => {
  fireEvent.change(fileInput(), { target: { files: [new File(['x'], 'backup.zip')] } });
  fireEvent.click(screen.getByRole('button', { name: 'Run dry run' }));
  await waitFor(() => expect(mocks.restore).toHaveBeenCalled());
};

const truncateCheckbox = () => screen.getByLabelText('Empty target tables first (TRUNCATE ... CASCADE)');

beforeEach(() => vi.clearAllMocks());

describe('RestoreProjectDialog', () => {
  it('accepts zip backups, which carry the skill files', () => {
    renderDialog();

    expect(fileInput().getAttribute('accept').split(',')).toContain('.zip');
  });

  it('shows the skill files result of a restore', async () => {
    mocks.restore.mockReturnValue(
      answer({
        ok: true,
        artifact: { project_id: 10, kind: 'safe' },
        result: {
          dry_run: true,
          statements: 4,
          total_rows: 49,
          applied_tables: ['skill_version_files'],
          skill_files: {
            total: 22,
            present: 0,
            uploaded: 21,
            missing: 1,
            missing_paths: ['notes.txt'],
            unchecked: false,
          },
        },
      }),
    );
    renderDialog();

    await pickAndSubmit();

    expect(await screen.findByTestId('project-restore-skill-files-summary')).toHaveTextContent(
      'Skill files: 22 total, 0 present, 21 uploaded, 1 missing (notes.txt)',
    );
  });

  it('says when the skill files could not be checked', async () => {
    mocks.restore.mockReturnValue(
      answer({
        ok: true,
        result: { dry_run: true, statements: 1, total_rows: 1, skill_files: { total: 3, unchecked: true } },
      }),
    );
    renderDialog();

    await pickAndSubmit();

    expect(await screen.findByTestId('project-restore-skill-files-summary')).toHaveTextContent(
      'Skill files: 3 not checked (storage unavailable)',
    );
  });

  it('shows no skill files line when the restore wrote none', async () => {
    mocks.restore.mockReturnValue(
      answer({ ok: true, result: { dry_run: true, statements: 1, total_rows: 1 } }),
    );
    renderDialog();

    await pickAndSubmit();

    await screen.findByText('Dry run finished');
    expect(screen.queryByTestId('project-restore-skill-files-summary')).not.toBeInTheDocument();
  });

  it("warns that merging another project's backup can mix entities, until tables are emptied first", async () => {
    mocks.restore.mockReturnValue(
      refusal({
        ok: false,
        error: 'artifact belongs to project 7',
        artifact: { project_id: 7, kind: 'safe' },
      }),
    );
    renderDialog();

    await pickAndSubmit();

    expect(await screen.findByTestId('project-restore-merge-warning')).toHaveTextContent(
      'Restore it into a new project, or check "Empty target tables first".',
    );
    fireEvent.click(truncateCheckbox());
    expect(screen.queryByTestId('project-restore-merge-warning')).not.toBeInTheDocument();
  });

  it('does not warn about merging a backup of this project', async () => {
    mocks.restore.mockReturnValue(
      answer({
        ok: true,
        artifact: { project_id: 10, kind: 'safe' },
        result: { dry_run: true, statements: 1 },
      }),
    );
    renderDialog();

    await pickAndSubmit();

    await screen.findByText('Dry run finished');
    expect(screen.queryByTestId('project-restore-merge-warning')).not.toBeInTheDocument();
  });
});
