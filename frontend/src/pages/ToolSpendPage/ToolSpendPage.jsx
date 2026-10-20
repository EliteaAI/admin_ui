import { memo } from 'react';

import { useParams } from 'react-router-dom';

import { useToolSpendFeaturesQuery } from '@/api/budgets.api';
import { BudgetsPage } from '@/pages/BudgetsPage';

// One limits page per Tool Spend feature; the list comes from toolkit metadata, so new features need no UI change
const ToolSpendPage = memo(() => {
  const { feature } = useParams();
  const { data: features } = useToolSpendFeaturesQuery();
  const label = features?.find(item => item.feature === feature)?.label || feature;

  return (
    <BudgetsPage
      key={feature}
      feature={feature}
      featureLabel={label}
    />
  );
});

ToolSpendPage.displayName = 'ToolSpendPage';

export default ToolSpendPage;
