import { memo } from 'react';

import { Navigate } from 'react-router-dom';

import { SIDEBAR_PERMISSIONS } from '@/constants/permissions.constants';
import { RouteDefinitions } from '@/constants/routes.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';

const DefaultRedirect = memo(() => {
  const { hasAnyPermission } = useCheckPermission();

  const sidebarKeys = Object.keys(SIDEBAR_PERMISSIONS);
  const firstAllowed = sidebarKeys.find(key => hasAnyPermission(SIDEBAR_PERMISSIONS[key]));

  return (
    <Navigate
      to={firstAllowed ? `/${firstAllowed}` : RouteDefinitions.Users}
      replace
    />
  );
});

DefaultRedirect.displayName = 'DefaultRedirect';

export default DefaultRedirect;
