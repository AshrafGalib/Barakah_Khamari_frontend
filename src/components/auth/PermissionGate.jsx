import usePermission from "../../hooks/usePermission";

const PermissionGate = ({
  permission,
  permissions,
  mode = "any",
  children,
  fallback = null,
}) => {
  const {
    can,
    canAny,
    canAll,
  } = usePermission();

  let allowed = false;

  // Single permission
  if (permission) {
    allowed = can(permission);
  }

  // Multiple permissions
  if (
    Array.isArray(permissions) &&
    permissions.length > 0
  ) {
    if (mode === "all") {
      allowed = canAll(permissions);
    } else {
      allowed = canAny(permissions);
    }
  }

  if (!allowed) {
    return fallback;
  }

  return children;
};

export default PermissionGate;