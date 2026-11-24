import { describe, expect, it } from 'vitest';

import { DEFAULT_PYLON_CARD_ICON } from '@/pages/ConfigurationPage/components/PylonCardsSection/constants/pylonCards.constants';
import { buildPylonCards } from '@/pages/ConfigurationPage/components/PylonCardsSection/helpers/pylonCards.helpers';

const INDEXER = 'pylon_indexer_1a2b3c4d-1111-2222-3333-444444444444';
const MAIN = 'pylon_main_9f8e7d6c-1111-2222-3333-555555555555';

const setting = (title, pylonId, extra = {}) => ({
  key: title.toLowerCase().replace(/\W+/g, '_'),
  title,
  type: 'boolean',
  pylon_id: pylonId,
  ...extra,
});

const RUNTIME_LIKE = [
  { pylon: 'pylon_indexer', fieldOrder: ['SDK Hot Reload', 'Task Queue Debug', 'Indexer Tasks'] },
  { pylon: 'pylon_main', fieldOrder: [] },
];

describe('buildPylonCards', () => {
  it('orders listed settings first, in the declared order, and keeps the rest in backend order', () => {
    const fields = [
      setting('Indexer Tasks', INDEXER),
      setting('Unlisted A', INDEXER),
      setting('Task Queue Debug', INDEXER),
      setting('SDK Hot Reload', INDEXER),
      setting('Unlisted B', INDEXER),
    ];

    const [indexerCard] = buildPylonCards(fields, {}, RUNTIME_LIKE);

    expect(indexerCard.fields.map(field => field.title)).toEqual([
      'SDK Hot Reload',
      'Task Queue Debug',
      'Indexer Tasks',
      'Unlisted A',
      'Unlisted B',
    ]);
  });

  it('creates cards in declared order, titled from the pylon meta, and keeps the backend order for an undeclared pylon', () => {
    const fields = [
      setting('Show Analytics', MAIN),
      setting('Tracing', 'pylon_auth'),
      setting('Tracing', INDEXER),
    ];
    const observability = [
      { pylon: 'pylon_auth', fieldOrder: ['Tracing'] },
      { pylon: 'pylon_indexer', fieldOrder: ['Tracing'] },
      { pylon: 'pylon_main', fieldOrder: ['Show Analytics', 'Tracing'] },
    ];

    const cards = buildPylonCards(fields, {}, observability);

    expect(cards.map(card => card.title)).toEqual(['Pylon Auth', 'Pylon Indexer', 'Pylon Main']);
    expect(cards.map(card => card.fields.length)).toEqual([1, 1, 1]);
  });

  it('gives an undeclared pylon its own card after the declared ones, so no setting is dropped', () => {
    const fields = [
      setting('Mystery', 'pylon_predicts_00000000-1111-2222-3333-444444444444'),
      setting('SDK Hot Reload', INDEXER),
    ];

    const cards = buildPylonCards(fields, {}, RUNTIME_LIKE);

    expect(cards.map(card => card.title)).toEqual(['Pylon Indexer', 'pylon_predicts']);
    expect(cards[1].fields.map(field => field.title)).toEqual(['Mystery']);
  });

  it('leaves out hidden settings (visible_when), so the card count matches what the card shows', () => {
    const fields = [
      setting('SDK Hot Reload', INDEXER),
      setting('Tool Result Limit (characters)', INDEXER, {
        type: 'integer',
        visible_when: { field: 'sdk_dev_reload', value: true },
      }),
    ];

    const [indexerCard] = buildPylonCards(fields, { sdk_dev_reload: false }, RUNTIME_LIKE);
    const [shownCard] = buildPylonCards(fields, { sdk_dev_reload: true }, RUNTIME_LIKE);

    expect(indexerCard.fields.map(field => field.title)).toEqual(['SDK Hot Reload']);
    expect(shownCard.fields).toHaveLength(2);
  });

  it('gives each instance of one pylon its own card and marks it with the instance id', () => {
    const otherIndexer = 'pylon_indexer_aaaaaaaa-1111-2222-3333-444444444444';
    const fields = [setting('SDK Hot Reload', INDEXER), setting('SDK Hot Reload', otherIndexer)];

    const cards = buildPylonCards(fields, {}, RUNTIME_LIKE);

    expect(cards.map(card => card.title)).toEqual(['Pylon Indexer (1a2b3c4d)', 'Pylon Indexer (aaaaaaaa)']);
  });

  it('matches docker-compose pylon ids, which use hyphens, to the same cards and setting order', () => {
    const hyphenIndexer = 'pylon-indexer_1a2b3c4d-1111-2222-3333-444444444444';
    const hyphenMain = 'pylon-main_9f8e7d6c-1111-2222-3333-555555555555';
    const fields = [
      setting('Indexer Tasks', hyphenIndexer),
      setting('Show Analytics', hyphenMain),
      setting('Task Queue Debug', hyphenIndexer),
      setting('SDK Hot Reload', hyphenIndexer),
    ];

    const cards = buildPylonCards(fields, {}, RUNTIME_LIKE);

    expect(cards.map(card => card.title)).toEqual(['Pylon Indexer', 'Pylon Main']);
    expect(cards[0].fields.map(field => field.title)).toEqual([
      'SDK Hot Reload',
      'Task Queue Debug',
      'Indexer Tasks',
    ]);
    expect(cards[0].icon).not.toBe(DEFAULT_PYLON_CARD_ICON);
  });
});
