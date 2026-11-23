import { memo } from 'react';

import { Navigate } from 'react-router-dom';

import { Box } from '@mui/material';

import {
  ROUTE_PERMISSIONS,
  SIDEBAR_PERMISSIONS,
  SIDEBAR_REQUIRE_ALL_PERMISSIONS,
} from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';

const ProtectedRoute = memo(props => {
  const { children, path } = props;
  const { hasAnyPermission, hasAllPermissions, hasSidebarAccess } = useCheckPermission();

  const styles = protectedRouteStyles();

  const requiredPerms = ROUTE_PERMISSIONS[path];

  // A route key is its path without the leading slash, like the sidebar keys
  const requiredAll = SIDEBAR_REQUIRE_ALL_PERMISSIONS[path.slice(1)];
  const allowed = !requiredPerms || (hasAnyPermission(requiredPerms) && hasAllPermissions(requiredAll));

  if (allowed) return children;

  const sidebarKeys = Object.keys(SIDEBAR_PERMISSIONS);
  const firstAllowed = sidebarKeys.find(hasSidebarAccess);

  if (firstAllowed)
    return (
      <Navigate
        to={`/${firstAllowed}`}
        replace
      />
    );

  // No routes accessible at all — should not happen in practice
  return (
    <Box sx={styles.root}>
      <Box
        component="span"
        sx={styles.message}
      >
        Not Authorized
      </Box>
    </Box>
  );
});

ProtectedRoute.displayName = 'ProtectedRoute';

/** @type {MuiSx} */
const protectedRouteStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '3rem',
  },
  message: ({ palette }) => ({
    fontSize: '1.25rem',
    color: palette.text.muted,
  }),
});

export default ProtectedRoute;
