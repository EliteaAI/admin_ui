/**
 * Banners are shown one at a time in list order, and a non-dismissible banner can't be closed,
 * so every enabled banner after the first enabled non-dismissible one is never shown.
 */
export const getBlockedBanners = banners => {
  const enabled = banners.filter(banner => banner.enabled);
  const blockerIndex = enabled.findIndex(banner => !banner.dismissible);

  if (blockerIndex === -1) return { blocker: null, blocked: [] };

  return { blocker: enabled[blockerIndex], blocked: enabled.slice(blockerIndex + 1) };
};
