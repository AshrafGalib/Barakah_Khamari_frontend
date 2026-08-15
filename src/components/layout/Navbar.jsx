import {
  FaBars,
  FaBell,
  FaUserCircle,
} from "react-icons/fa";

function Navbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 h-16 sm:h-20 bg-base-100 border-b border-base-300">
      <div className="h-full px-3 sm:px-5 lg:px-6 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={onMenuClick}
            className="btn btn-sm btn-square btn-ghost lg:hidden"
            aria-label="মেনু খুলুন"
          >
            <FaBars className="text-lg" />
          </button>

          {/* Mobile Logo */}
          <div className="lg:hidden">
            <h1 className="font-bold text-primary text-base sm:text-lg">
              বারাকাহ খামারি
            </h1>
          </div>

          {/* Desktop Title */}
          <div className="hidden lg:block">
            <p className="text-sm text-base-content/50">
              স্বাগতম
            </p>

            <h2 className="font-semibold text-base">
              আজকের ব্যবসার সারসংক্ষেপ
            </h2>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notification */}
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost relative"
            aria-label="নোটিফিকেশন"
          >
            <FaBell className="text-base sm:text-lg" />

            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full border-2 border-base-100" />
          </button>

          {/* User */}
          <button
            type="button"
            className="btn btn-sm btn-ghost gap-2 px-2 sm:px-3"
          >
            <FaUserCircle className="text-xl sm:text-2xl text-primary" />

            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold">
                অ্যাডমিন
              </p>

              <p className="text-[11px] text-base-content/50">
                ব্যবস্থাপক
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;