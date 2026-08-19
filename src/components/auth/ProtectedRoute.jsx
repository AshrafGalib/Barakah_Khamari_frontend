import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router";

import { useAuth } from "../../context/useAuth";

const ProtectedRoute = () => {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  const location = useLocation();

  // Authentication check শেষ না হওয়া পর্যন্ত
  // কিছু render করব না
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>

          <p className="mt-3 text-sm text-base-content/60">
            যাচাই করা হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  // Login করা না থাকলে → Login page
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

  // Login করা থাকলে → requested page
  return <Outlet />;
};

export default ProtectedRoute;