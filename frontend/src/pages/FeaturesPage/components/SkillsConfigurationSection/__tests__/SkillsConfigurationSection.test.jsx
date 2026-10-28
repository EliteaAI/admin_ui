import { useCallback, useMemo, useState } from 'react';

import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider, createTheme } from '@mui/material/styles';

import { FEATURES_SECTIONS } from '@/pages/FeaturesPage/constants/features.constants';
import store from '@/store';
import getDesignTokens from '@/theme/main.theme';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SkillsConfigurationSection } from '..';

const theme = createTheme(getDesignTokens('dark'));

const integerField = (key, title, path, maximum) => ({
  key,
  title,
  path,
  description: `${title} description. Allowed range: 1–${maximum}.`,
  type: 'integer',
  section: 'skills',
  minimum: 1,
  maximum,
});

// The schema order differs from the display order on purpose
const SKILLS_FIELDS = [
  {
    key: 'project_skills_in_chat_available',
    title: 'Allow project skills without chat participation',
    path: 'skills.project_skills_in_chat.available',
    type: 'boolean',
    section: 'skills',
  },
  integerField(
    'max_instructions_length',
    'Skill Content Max Length',
    'skills.max_instructions_length',
    200000,
  ),
  integerField('max_skills_per_agent', 'Max Skills Per Agent', 'skills.max_skills_per_agent', 200),
  integerField(
    'max_invoked_skills_per_turn',
    'Max ~Skill Invocations Per Message',
    'skills.max_invoked_skills_per_turn',
    50,
  ),
];

const SAVED_VALUES = {
  max_skills_per_agent: 40,
  max_invoked_skills_per_turn: 3,
  max_instructions_length: 12000,
  project_skills_in_chat_available: false,
};

const Harness = ({ initialValues, onChange }) => {
  const [values, setValues] = useState(initialValues);
  const change = useCallback(
    (key, value) => {
      onChange(key, value);
      setValues(prev => ({ ...prev, [key]: value }));
    },
    [onChange],
  );
  const skillsDraft = useMemo(() => ({ values, onChange: change }), [values, change]);
  return (
    <SkillsConfigurationSection
      skillsDraft={skillsDraft}
      skillsFields={SKILLS_FIELDS}
    />
  );
};

const setup = (initialValues = SAVED_VALUES) => {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Harness
          initialValues={initialValues}
          onChange={onChange}
        />
      </ThemeProvider>
    </Provider>,
  );
  return { onChange, user };
};

const blockHeader = title => screen.getByText(title).closest('[role="button"]');

describe('Skills Configuration page', () => {
  it('sits directly after Chat Configuration in the Features navigation', () => {
    const ids = FEATURES_SECTIONS.map(section => section.id);
    const skills = FEATURES_SECTIONS.find(section => section.id === 'skills');

    expect(ids.indexOf('skills')).toBe(ids.indexOf('chat_configuration') + 1);
    expect(skills.title).toBe('Skills Configuration');
    expect(skills.backendSectionIds).toEqual(['skills']);
  });

  it('shows two collapsed blocks with their setting counts', () => {
    setup();

    const limits = blockHeader('Skill Limits');
    const access = blockHeader('Project Skill Access');

    expect(within(limits).getByText('3 settings')).toBeInTheDocument();
    expect(within(access).getByText('1 setting')).toBeInTheDocument();
    expect(limits).toHaveAttribute('aria-expanded', 'false');
    expect(access).toHaveAttribute('aria-expanded', 'false');
  });

  it('expands and collapses each block on its own', async () => {
    const { user } = setup();

    await user.click(blockHeader('Skill Limits'));

    expect(blockHeader('Skill Limits')).toHaveAttribute('aria-expanded', 'true');
    expect(blockHeader('Project Skill Access')).toHaveAttribute('aria-expanded', 'false');

    await user.click(blockHeader('Project Skill Access'));
    await user.click(blockHeader('Skill Limits'));

    expect(blockHeader('Skill Limits')).toHaveAttribute('aria-expanded', 'false');
    expect(blockHeader('Project Skill Access')).toHaveAttribute('aria-expanded', 'true');
  });

  it('lists the three limits in order with their saved values, helper text and range', async () => {
    const { user } = setup();
    await user.click(blockHeader('Skill Limits'));

    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs.map(input => input.value)).toEqual(['40', '3', '12000']);
    expect(inputs.map(input => [input.min, input.max])).toEqual([
      ['1', '200'],
      ['1', '50'],
      ['1', '200000'],
    ]);
    expect(screen.getByText('Max Skills Per Agent description. Allowed range: 1–200.')).toBeInTheDocument();
    expect(screen.queryAllByText('Allow project skills without chat participation')).toHaveLength(1);
  });

  it('edits a limit through the skills draft', async () => {
    const { onChange, user } = setup();
    await user.click(blockHeader('Skill Limits'));

    const [maxSkills] = screen.getAllByRole('spinbutton');
    await user.clear(maxSkills);
    await user.type(maxSkills, '25');

    expect(onChange).toHaveBeenLastCalledWith('max_skills_per_agent', 25);
  });

  it('shows the project skill toggle off with its helper text and tooltip, and turns it on', async () => {
    const { onChange, user } = setup();
    await user.click(blockHeader('Project Skill Access'));

    const toggle = screen.getByRole('switch', { name: 'Allow project skills without chat participation' });
    expect(toggle).not.toBeChecked();
    expect(
      screen.getByText(
        'Allow chats to load and invoke accessible skills from their project without adding those skills as chat participants.',
      ),
    ).toBeInTheDocument();

    await user.hover(screen.getByLabelText('About project skills without chat participation'));
    expect(
      await screen.findByText(
        'When enabled, project skills can be resolved and used on demand without being added as chat participants. Existing access permissions and applicable skill limits still apply. This does not automatically load every project skill into a chat.',
      ),
    ).toBeInTheDocument();

    await user.click(toggle);

    expect(onChange).toHaveBeenCalledWith('project_skills_in_chat_available', true);
    expect(toggle).toBeChecked();
  });

  it('shows the toggle off when the platform has never saved it', async () => {
    const neverSaved = { ...SAVED_VALUES };
    delete neverSaved.project_skills_in_chat_available;
    const { user } = setup(neverSaved);
    await user.click(blockHeader('Project Skill Access'));

    expect(
      screen.getByRole('switch', { name: 'Allow project skills without chat participation' }),
    ).not.toBeChecked();
  });
});
