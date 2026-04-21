import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";

import { ADMIN_ROLES } from "@/constants/permissions";

export const useCheckPermission = () => {
  const permissions = useSelector((state) => state.user.permissions);
  const roles = useSelector((state) => state.user.roles);

  const hasPermission = useCallback(
    (permission) => {
      if (!permission) return true;
      return permissions.includes(permission);
    },
    [permissions],
  );

  const hasAnyPermission = useCallback(
    (permissionsToCheck = []) => {
      if (!permissionsToCheck.length) return true;
      return permissionsToCheck.some((permission) =>
        permissions.includes(permission),
      );
    },
    [permissions],
  );

  const hasAllPermissions = useCallback(
    (permissionsToCheck = []) => {
      if (!permissionsToCheck.length) return true;
      return permissionsToCheck.every((permission) =>
        permissions.includes(permission),
      );
    },
    [permissions],
  );

  const hasRole = useCallback(
    (role) => {
      if (!role) return true;
      return roles.includes(role);
    },
    [roles],
  );

  const hasAnyRole = useCallback(
    (rolesToCheck = []) => {
      if (!rolesToCheck.length) return true;
      return rolesToCheck.some((role) => roles.includes(role));
    },
    [roles],
  );

  const isSuperAdmin = useMemo(
    () => hasRole(ADMIN_ROLES.SUPER_ADMIN),
    [hasRole],
  );

  const isAdmin = useMemo(
    () => hasAnyRole([ADMIN_ROLES.ADMIN, ADMIN_ROLES.SUPER_ADMIN]),
    [hasAnyRole],
  );

  const isEditor = useMemo(
    () =>
      hasAnyRole([
        ADMIN_ROLES.EDITOR,
        ADMIN_ROLES.ADMIN,
        ADMIN_ROLES.SUPER_ADMIN,
      ]),
    [hasAnyRole],
  );

  const isViewer = useMemo(
    () =>
      hasAnyRole([
        ADMIN_ROLES.VIEWER,
        ADMIN_ROLES.EDITOR,
        ADMIN_ROLES.ADMIN,
        ADMIN_ROLES.SUPER_ADMIN,
      ]),
    [hasAnyRole],
  );

  return {
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isSuperAdmin,
    isAdmin,
    isEditor,
    isViewer,
  };
};
