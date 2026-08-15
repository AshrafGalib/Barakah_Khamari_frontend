import {
  FaHome,
  FaCashRegister,
  FaBoxOpen,
  FaTags,
  FaShoppingCart,
  FaTruck,
  FaWarehouse,
  FaReceipt,
  FaMoneyBillWave,
  FaUsers,
  FaChartBar,
  FaCog,
  FaTimes,
} from "react-icons/fa";

import { NavLink } from "react-router";

const menuItems = [
  {
    name: "ড্যাশবোর্ড",
    icon: FaHome,
    path: "/dashboard",
  },
  {
    name: "বিক্রয়",
    icon: FaCashRegister,
    path: "/pos",
  },
  {
    name: "পণ্যসমূহ",
    icon: FaBoxOpen,
    path: "/products",
  },
  {
    name: "ক্যাটাগরি",
    icon: FaTags,
    path: "/categories",
  },
  {
    name: "ক্রয়",
    icon: FaShoppingCart,
    path: "/purchases",
  },
  {
    name: "সরবরাহকারী",
    icon: FaTruck,
    path: "/suppliers",
  },
  {
    name: "মজুদ",
    icon: FaWarehouse,
    path: "/inventory",
  },
  {
    name: "বিক্রয়ের ইতিহাস",
    icon: FaReceipt,
    path: "/sales",
  },
  {
    name: "খরচ",
    icon: FaMoneyBillWave,
    path: "/expenses",
  },
  {
    name: "ক্রেতা",
    icon: FaUsers,
    path: "/customers",
  },
  {
    name: "রিপোর্ট",
    icon: FaChartBar,
    path: "/reports",
  },
  {
    name: "সেটিংস",
    icon: FaCog,
    path: "/settings",
  },
];

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const handleMenuClick = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <aside
      className={`
        fixed
        top-0
        left-0
        z-50
        h-screen
        w-64
        bg-base-100
        border-r
        border-base-300
        flex
        flex-col
        transition-transform
        duration-300
        ease-in-out

        lg:translate-x-0

        ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }
      `}
    >
      {/* Logo Header */}
      <div className="h-20 shrink-0 px-5 border-b border-base-300 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">
            বারাকাহ খামারি
          </h1>

          <p className="text-xs text-base-content/50 mt-1">
            ইনভেন্টরি ও POS
          </p>
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="btn btn-sm btn-circle btn-ghost lg:hidden"
          aria-label="Sidebar বন্ধ করুন"
        >
          <FaTimes />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <p className="px-3 pt-2 pb-3 text-xs font-semibold text-base-content/40 uppercase">
          মেনু
        </p>

        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={handleMenuClick}
                  className={({ isActive }) =>
                    `
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    rounded-xl
                    transition-all
                    duration-200
                    text-sm
                    font-medium

                    ${
                      isActive
                        ? "bg-primary text-primary-content shadow-sm"
                        : "text-base-content/70 hover:bg-primary/10 hover:text-primary"
                    }
                    `
                  }
                >
                  <Icon className="text-lg shrink-0" />

                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="shrink-0 p-4 border-t border-base-300">
        <div className="rounded-xl bg-base-200 p-3">
          <p className="text-xs text-base-content/50 text-center">
            বারাকাহ খামারি
          </p>

          <p className="text-[11px] text-base-content/40 text-center mt-1">
            © ২০২৬
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;