import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";

// Toastify Import
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PermissionRoute from "./components/auth/PermissionRoute";

import { PERMISSIONS } from "./constants/permissions";

// ======================================================
// Lazy Loaded Pages for Performance Optimization
// ======================================================
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const POS = lazy(() => import("./pages/POS"));
const Products = lazy(() => import("./pages/Products"));
const Categories = lazy(() => import("./pages/Categories"));
const Purchases = lazy(() => import("./pages/Purchases"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Sales = lazy(() => import("./pages/Sales"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Customers = lazy(() => import("./pages/Customers"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Users = lazy(() => import("./pages/Users"));
const RoleManagement = lazy(() => import("./pages/RoleManagement"));

// Full-screen Loading Fallback component for Code Splitting
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-base-200">
    <div className="text-center">
      <span className="loading loading-spinner loading-lg text-primary" />
      <p className="mt-3 text-sm font-medium text-base-content/60">
        লোডিং হচ্ছে...
      </p>
    </div>
  </div>
);

function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ==================================================
              PUBLIC ROUTE
              ================================================== */}
          <Route path="/login" element={<Login />} />

          {/* ==================================================
              AUTHENTICATED & PROTECTED ROUTES
              ================================================== */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              
              {/* Dashboard */}
              <Route
                element={
                  <PermissionRoute
                    permission={PERMISSIONS.DASHBOARD_VIEW}
                  />
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
              </Route>

              {/* POS */}
              <Route
                element={
                  <PermissionRoute
                    permission={PERMISSIONS.POS_ACCESS}
                  />
                }
              >
                <Route path="pos" element={<POS />} />
              </Route>

              {/* Products */}
              <Route
                element={
                  <PermissionRoute
                    permission={PERMISSIONS.PRODUCTS_VIEW}
                  />
                }
              >
                <Route path="products" element={<Products />} />
              </Route>

              {/* Categories */}
              <Route
                element={
                  <PermissionRoute
                    permission={PERMISSIONS.CATEGORIES_VIEW}
                  />
                }
              >
                <Route path="categories" element={<Categories />} />
              </Route>

              {/* Purchases */}
              <Route
                element={
                  <PermissionRoute
                    permission={PERMISSIONS.PURCHASES_VIEW}
                  />
                }
              >
                <Route path="purchases" element={<Purchases />} />
              </Route>

              {/* Suppliers */}
              <Route
                element={
                  <PermissionRoute
                    permission={PERMISSIONS.SUPPLIERS_VIEW}
                  />
                }
              >
                <Route path="suppliers" element={<Suppliers />} />
              </Route>

              {/* Inventory */}
              <Route
                element={
                  <PermissionRoute
                    permission={PERMISSIONS.INVENTORY_VIEW}
                  />
                }
              >
                <Route path="inventory" element={<Inventory />} />
              </Route>

              {/* Sales */}
              <Route
                element={
                  <PermissionRoute
                    permission={PERMISSIONS.SALES_VIEW}
                  />
                }
              >
                <Route path="sales" element={<Sales />} />
              </Route>

              {/* Expenses */}
              <Route
                element={
                  <PermissionRoute
                    permission={PERMISSIONS.EXPENSES_VIEW}
                  />
                }
              >
                <Route path="expenses" element={<Expenses />} />
              </Route>

              {/* Customers */}
              <Route
                element={
                  <PermissionRoute
                    permission={PERMISSIONS.CUSTOMERS_VIEW}
                  />
                }
              >
                <Route path="customers" element={<Customers />} />
              </Route>

              {/* Reports */}
              <Route
                element={
                  <PermissionRoute
                    permission={PERMISSIONS.REPORTS_VIEW}
                  />
                }
              >
                <Route path="reports" element={<Reports />} />
              </Route>

              {/* Users Management */}
              <Route
                element={
                  <PermissionRoute
                    permission={PERMISSIONS.USERS_VIEW}
                  />
                }
              >
                <Route path="users" element={<Users />} />
              </Route>

              {/* Role Management */}
              <Route
                element={
                  <PermissionRoute
                    permission={PERMISSIONS.ROLES_VIEW}
                  />
                }
              >
                <Route path="role-management" element={<RoleManagement />} />
              </Route>

              {/* General Settings */}
              <Route path="settings" element={<Settings />} />

              {/* Default Route */}
              <Route
                index
                element={<Navigate to="/dashboard" replace />}
              />
            </Route>
          </Route>

          {/* ==================================================
              FALLBACK ROUTE
              ================================================== */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>

      {/* টোস্ট নোটিফিকেশন রেন্ডার করার জন্য ToastContainer */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App;