import { memo } from 'react';

import { Navigate } from 'react-router-dom';

import { Box } from '@mui/material';

import { ROUTE_PERMISSIONS, SIDEBAR_PERMISSIONS } from '@/constants/permissions.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';

const ProtectedRoute = memo(props => {
  const { children, path } = props;
  const { hasAnyPermission } = useCheckPermission();

  const styles = protectedRouteStyles();

  const requiredPerms = ROUTE_PERMISSIONS[path];

  if (!requiredPerms || hasAnyPermission(requiredPerms)) return children;

  const sidebarKeys = Object.keys(SIDEBAR_PERMISSIONS);
  const firstAllowed = sidebarKeys.find(key => hasAnyPermission(SIDEBAR_PERMISSIONS[key]));

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
