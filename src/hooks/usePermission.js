import { useMemo, useCallback } from "react";
import { useAuth } from "../context/useAuth";

const usePermission = () => {
  const { user } = useAuth();

  // O(1) Time Complexity Lookup using JavaScript Set
  const permissionSet = useMemo(() => {
    if (!user) return new Set();

    // Check permissions array inside user or role object
    const permissions = user.permissions || user.roleId?.permissions || [];

    // Check for Super Admin wildcard ("*") or admin roles
    const roleName = (typeof user.role === "string" ? user.role : user.role?.name || "").toLowerCase();
    
    if (roleName === "super admin" || roleName === "admin" || permissions.includes("*")) {
      return new Set(["*"]);
    }

    return Array.isArray(permissions) ? new Set(permissions) : new Set();
  }, [user]);

  // Check single permission
  const can = useCallback(
    (permission) => {
      if (!permission) return false;
      if (permissionSet.has("*")) return true;

      return permissionSet.has(permission);
    },
    [permissionSet]
  );

  // Check if user has ANY of the permissions in the list
  const canAny = useCallback(
    (permissionList) => {
      if (!Array.isArray(permissionList) || permissionList.length === 0) {
        return false;
      }
      if (permissionSet.has("*")) return true;

      return permissionList.some((permission) => permissionSet.has(permission));
    },
    [permissionSet]
  );

  // Check if user has ALL of the permissions in the list
  const canAll = useCallback(
    (permissionList) => {
      if (!Array.isArray(permissionList) || permissionList.length === 0) {
        return false;
      }
      if (permissionSet.has("*")) return true;

      return permissionList.every((permission) => permissionSet.has(permission));
    },
    [permissionSet]
  );

  return {
    permissions: Array.from(permissionSet),
    can,
    canAny,
    canAll,
  };
};

export default usePermission;