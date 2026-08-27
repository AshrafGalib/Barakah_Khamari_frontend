import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../context/useAuth";
import usePermission from "../../hooks/usePermission";

const PermissionRoute = ({
  permission,
  permissions,
  mode = "any",
  redirectTo = "/unauthorized", // ❌ "/dashboard" এর পরিবর্তে নিরাপদ পেজে পাঠান
}) => {
  const { loading, isAuthenticated } = useAuth();
  const { can, canAny, canAll } = usePermission();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="mt-3 text-sm text-base-content/60">
            যাচাই করা হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // Check permissions
  let hasAccess = false;

  if (permission) {
    hasAccess = can(permission);
  } else if (Array.isArray(permissions) && permissions.length > 0) {
    hasAccess = mode === "all" ? canAll(permissions) : canAny(permissions);
  }

  // Prevent infinite loops: পারমিশন না থাকলে কখনো একই রুটে বা /dashboard এ লুপ করা যাবে না
  if (!hasAccess) {
    // location.pathname যদি নিজেই redirectTo হয়, তবে /login এ যাবে
    const currentPath = location.pathname;
    const targetPath = (currentPath === redirectTo || currentPath === "/dashboard") 
      ? "/login" 
      : redirectTo;

    return (
      <Navigate
        to={targetPath}
        replace
        state={{
          unauthorized: true,
          from: location,
        }}
      />
    );
  }

  return <Outlet />;
};

export default PermissionRoute;