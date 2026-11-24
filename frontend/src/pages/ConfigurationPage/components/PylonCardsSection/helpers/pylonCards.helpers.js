import { buildPylonLabels, isFieldVisible, pylonBaseName } from '@/helpers/schemaForm.helpers';
import {
  DEFAULT_PYLON_CARD_ICON,
  PYLON_CARD_META,
} from '@/pages/ConfigurationPage/components/PylonCardsSection/constants/pylonCards.constants';

// Listed titles sort first in fieldOrder; the rest keep their backend order (Array.sort is stable)
const orderFields = (fields, fieldOrder) => {
  const rank = field => {
    const index = fieldOrder.indexOf(field.title);
    return index === -1 ? fieldOrder.length : index;
  };
  return [...fields].sort((a, b) => rank(a) - rank(b));
};

/**
 * Splits the visible fields of a section into one card per pylon instance. Cards follow `cardDefinitions`. A pylon
 * with no definition still gets a card, after the defined ones, so no setting is dropped.
 * Hidden fields (visible_when) are left out, so each card's setting count matches what it shows.
 */
export const buildPylonCards = (fields, values, cardDefinitions) => {
  const visibleFields = fields.filter(field => isFieldVisible(field, values));
  const pylonIds = [...new Set(visibleFields.map(field => field.pylon_id))];
  const labels = buildPylonLabels(pylonIds);

  const groups = pylonIds.map(pylonId => {
    const baseName = pylonBaseName(pylonId);
    return {
      pylonId,
      baseName,
      // Docker-compose deployments name pylons with hyphens (pylon-indexer), the constants use underscores
      pylonType: baseName.replaceAll('-', '_'),
      fields: visibleFields.filter(field => field.pylon_id === pylonId),
    };
  });

  const toCard = (group, fieldOrder = []) => {
    const meta = PYLON_CARD_META[group.pylonType];
    // Two instances of one pylon get their UUID prefix as a suffix, e.g. "Pylon Indexer (1a2b3c4d)"
    const suffix = (labels[group.pylonId] ?? group.baseName).slice(group.baseName.length);
    return {
      id: group.pylonId,
      title: `${meta?.title ?? group.baseName}${suffix}`,
      icon: meta?.icon ?? DEFAULT_PYLON_CARD_ICON,
      fields: orderFields(group.fields, fieldOrder),
    };
  };

  const declaredCards = cardDefinitions.flatMap(definition =>
    groups
      .filter(group => group.pylonType === definition.pylon)
      .map(group => toCard(group, definition.fieldOrder)),
  );
  const undeclaredCards = groups
    .filter(group => !cardDefinitions.some(definition => definition.pylon === group.pylonType))
    .map(group => toCard(group));

  return [...declaredCards, ...undeclaredCards];
};
