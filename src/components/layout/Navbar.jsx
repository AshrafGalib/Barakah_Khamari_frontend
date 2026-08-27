import { useState } from "react";
import {
  FaBars,
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaUserEdit,
  FaLock,
} from "react-icons/fa";
import { useNavigate } from "react-router"; // react-router-dom ব্যবহার করলে সেই অনুযায়ী পরিবর্তন করুন

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Navbar({ onMenuClick }) {
  const navigate = useNavigate();

  // Lazy Initializer দিয়ে Initial State লোড করা (useEffect ছাড়া)
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("barakah_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return {
          name: parsedUser.name || "অ্যাডমিন",
          role: parsedUser.role || "ব্যবস্থাপক",
        };
      } catch (e) {
        console.error("Error parsing stored user data", e);
      }
    }
    return { name: "অ্যাডমিন", role: "ব্যবস্থাপক" };
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Profile Edit Form State
  const [formData, setFormData] = useState({
    name: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Sign Out Handler
  const handleSignOut = () => {
    localStorage.removeItem("barakah_token");
    localStorage.removeItem("barakah_user");
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  // Profile Modal Open Handler
  const handleOpenProfileModal = () => {
    setErrorMessage("");
    setSuccessMessage("");
    setFormData({
      name: user.name || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsProfileModalOpen(true);
  };

  // Form Input Change Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Profile Update & Password Change Submit
  const handleProfileUpdateSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // পাসওয়ার্ড ভ্যালিডেশন
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setErrorMessage("নতুন পাসওয়ার্ড দিতে হলে বর্তমান পাসওয়ার্ড আবশ্যক।");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMessage("নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!");
        return;
      }
      if (formData.newPassword.length < 6) {
        setErrorMessage("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
        return;
      }
    }

    setLoading(true);

    try {
      const token =
        localStorage.getItem("barakah_token") ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token পাওয়া যায়নি। আবার লগইন করুন।");
      }

      // ১. নাম আপডেট API কল (যদি নাম পরিবর্তন করা হয়)
      if (formData.name && formData.name !== user.name) {
        const nameRes = await fetch(`${BACKEND_URL}/api/users/profile`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: formData.name }),
        });

        const nameData = await nameRes.json();
        if (!nameRes.ok || !nameData.success) {
          throw new Error(nameData.message || "নাম আপডেট করা সম্ভব হয়নি");
        }

        // LocalStorage & State আপডেট
        const updatedUser = { ...user, name: formData.name };
        setUser(updatedUser);
        localStorage.setItem("barakah_user", JSON.stringify(updatedUser));
      }

      // ২. পাসওয়ার্ড পরিবর্তন API কল (যদি নতুন পাসওয়ার্ড দেওয়া হয়)
      if (formData.newPassword) {
        const passRes = await fetch(`${BACKEND_URL}/api/auth/change-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          }),
        });

        const passData = await passRes.json();
        if (!passRes.ok || !passData.success) {
          throw new Error(
            passData.message || "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে"
          );
        }
      }

      setSuccessMessage("প্রোফাইল সফলভাবে আপডেট করা হয়েছে!");
      setTimeout(() => {
        setIsProfileModalOpen(false);
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message || "আপডেট করার সময় সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
              <p className="text-sm text-base-content/50">স্বাগতম</p>
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

            {/* User Dropdown */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-sm btn-ghost gap-2 px-2 sm:px-3"
              >
                <FaUserCircle className="text-xl sm:text-2xl text-primary" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-[11px] text-base-content/50">
                    {user.role}
                  </p>
                </div>
              </div>

              {/* Dropdown Menu */}
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-52 mt-2 border border-base-200 z-50"
              >
                <li>
                  <button
                    onClick={handleOpenProfileModal}
                    className="flex items-center gap-2"
                  >
                    <FaUserEdit className="text-info" /> প্রোফাইল আপডেট
                  </button>
                </li>
                <div className="divider my-0"></div>
                <li>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-error hover:bg-error/10"
                  >
                    <FaSignOutAlt /> সাইন আউট
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* Profile & Password Change Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-base-100 p-6 rounded-xl border border-base-300 w-full max-w-md shadow-2xl relative text-base-content">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-base-300 pb-2">
              <FaUserEdit className="text-primary" /> প্রোফাইল ও নিরাপত্তা
            </h3>

            {/* Messages */}
            {errorMessage && (
              <div className="alert alert-error text-xs p-2 mb-3 rounded-lg">
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success text-xs p-2 mb-3 rounded-lg">
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleProfileUpdateSubmit} className="space-y-4">
              {/* Profile Name Edit */}
              <div>
                <label className="label text-xs font-semibold pb-1">
                  পূর্ণ নাম
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input input-sm input-bordered w-full"
                  placeholder="আপনার নাম লিখুন"
                />
              </div>

              <div className="divider text-xs text-base-content/50 my-2 flex items-center gap-1">
                <FaLock className="text-xs" /> পাসওয়ার্ড পরিবর্তন (ঐচ্ছিক)
              </div>

              {/* Current Password */}
              <div>
                <label className="label text-xs font-semibold pb-1">
                  বর্তমান পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="input input-sm input-bordered w-full"
                  placeholder="******"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="label text-xs font-semibold pb-1">
                  নতুন পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="input input-sm input-bordered w-full"
                  placeholder="কমপক্ষে ৬ অক্ষর"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label text-xs font-semibold pb-1">
                  নতুন পাসওয়ার্ড নিশ্চিত করুন
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="input input-sm input-bordered w-full"
                  placeholder="আবার পাসওয়ার্ডটি দিন"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-base-300">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="btn btn-sm btn-ghost"
                  disabled={loading}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-sm btn-primary"
                >
                  {loading ? "আপডেট হচ্ছে..." : "সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;