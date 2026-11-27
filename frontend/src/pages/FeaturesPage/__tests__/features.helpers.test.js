import { describe, expect, it } from 'vitest';

import {
  FEATURES_SECTIONS,
  LEGACY_SECTION_REDIRECTS,
  MOVED_TO_CONFIGURATION,
} from '../constants/features.constants';
import { resolveMovedSection, resolveSectionFromHash } from '../helpers/features.helpers';

const resolve = hash => resolveSectionFromHash(hash, FEATURES_SECTIONS, LEGACY_SECTION_REDIRECTS);

describe('Features sub-menu', () => {
  it('lists the eight sections in the new order under their new titles', () => {
    expect(FEATURES_SECTIONS.map(section => [section.id, section.title])).toEqual([
      ['chat_configuration', 'Chat'],
      ['skills', 'Skills'],
      ['publishing', 'Publishing'],
      ['mcp_configuration', 'MCPs'],
      ['cost_budgets', 'Cost & Usage'],
      ['schedules', 'Schedules'],
      ['webhooks', 'Webhooks'],
      ['notifications', 'Notifications'],
    ]);
  });

  it('no longer lists the four sections that moved to Configuration', () => {
    const ids = FEATURES_SECTIONS.map(section => section.id);

    ['support_assistant', 'help_center', 'surveys', 'custom_theme'].forEach(id =>
      expect(ids).not.toContain(id),
    );
  });

  it('saves Cost & Usage through the budget, tool and Usage sections', () => {
    const costUsage = FEATURES_SECTIONS.find(section => section.id === 'cost_budgets');

    expect(costUsage.backendSectionIds).toEqual(['cost_budgets', 'tool_spend', 'tool_pricing', 'Usage']);
  });
});

describe('Old Features links', () => {
  it.each(['chat_configuration', 'skills', 'mcp_configuration', 'cost_budgets'])(
    'keeps #%s on its page',
    hash => {
      expect(resolve(hash)).toEqual({ page: hash, block: null });
    },
  );

  it.each([
    ['auto_routing', 'chat_configuration'],
    ['tool_spend', 'cost_budgets'],
    ['model_prices_source', 'cost_budgets'],
  ])('opens the block for #%s', (hash, page) => {
    expect(resolve(hash)).toEqual({ page, block: hash });
  });

  it.each(['usage_settings', 'complexity_settings'])('opens Cost & Usage with %s expanded', hash => {
    expect(resolve(hash)).toEqual({ page: 'cost_budgets', block: hash });
  });

  it('opens Agent Schedules for the old #agent_evaluation link', () => {
    expect(resolve('agent_evaluation')).toEqual({ page: 'schedules', block: 'agent_schedules' });
  });

  it.each([
    ['support_assistant', 'support_assistant'],
    ['help_center', 'resources'],
    ['surveys', 'surveys'],
    ['custom_theme', 'custom_theme'],
  ])('sends #%s to the Configuration section %s', (hash, section) => {
    expect(resolveMovedSection(hash, MOVED_TO_CONFIGURATION)).toBe(section);
  });

  it('does not treat sections that stayed on Features as moved', () => {
    expect(resolveMovedSection('chat_configuration', MOVED_TO_CONFIGURATION)).toBeNull();
    expect(resolveMovedSection('', MOVED_TO_CONFIGURATION)).toBeNull();
  });
});
