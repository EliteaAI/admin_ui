import { useCallback, useState } from 'react';

/**
 * Expanded state for a grouped Features page. Every block starts collapsed, except the one a
 * deep link points at. Several blocks can be open at once.
 */
export const useExpandedBlocks = initialBlock => {
  const [expanded, setExpanded] = useState(() => (initialBlock ? { [initialBlock]: true } : {}));

  const toggle = useCallback(blockId => {
    setExpanded(prev => ({ ...prev, [blockId]: !prev[blockId] }));
  }, []);

  return { expanded, toggle };
};
