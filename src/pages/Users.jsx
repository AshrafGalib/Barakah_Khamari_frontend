import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router"; // react-router v7 অনুযায়ী

// আপনার ব্যাকএন্ড পোর্ট বা ENV ভেরিয়েবল অনুযায়ী Base URL সেট করুন
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE_URL = `${BACKEND_URL}/api/users`;

const Users = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
  });

  // LocalStorage থেকে barakah_token রিড করে Auth Headers তৈরি
  const getAuthHeaders = useCallback(() => {
    // আপনার প্রজেক্টের নির্দিষ্ট টোকেন নাম barakah_token চেক করা হচ্ছে
    const token =
      localStorage.getItem("barakah_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    if (!token) {
      throw new Error(
        "Authentication token পাওয়া যায়নি। অনুগ্রহ করে পুনরায় লগইন করুন।"
      );
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, []);

  // Safe fetch helper to handle HTML or invalid response formats
  const safeFetchJson = useCallback(async (url, options = {}) => {
    const res = await fetch(url, options);

    // যদি ৪০১ (Unauthorized) হয় তবে রিমুভ করে লগইন পেজে পাঠানোর ব্যবস্থা
    if (res.status === 401) {
      localStorage.removeItem("barakah_token");
      localStorage.removeItem("barakah_user");
      localStorage.removeItem("token");
      throw new Error(
        "আপনার সেশনের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে আবার লগইন করুন।"
      );
    }

    const contentType = res.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      const textData = await res.text();
      console.error("Non-JSON Response received:", textData);
      throw new Error(
        `সার্ভার থেকে সঠিক ডাটা পাওয়া যায়নি (Status: ${res.status})। API Endpoint চেক করুন।`
      );
    }

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "একটি সমস্যা দেখা দিয়েছে");
    }
    return data;
  }, []);

  // ----------------------------------------------------
  // Pure Fetch Functions
  // ----------------------------------------------------
  const fetchUsersData = useCallback(async () => {
    const headers = getAuthHeaders();
    const data = await safeFetchJson(`${API_BASE_URL}?includeInactive=true`, {
      headers,
    });
    return data.data?.users || data.users || [];
  }, [getAuthHeaders, safeFetchJson]);

  const fetchRolesData = useCallback(async () => {
    const headers = getAuthHeaders();
    const data = await safeFetchJson(`${API_BASE_URL}/available-roles`, {
      headers,
    });
    return data.data?.roles || data.roles || [];
  }, [getAuthHeaders, safeFetchJson]);

  // ----------------------------------------------------
  // Refetch Helper
  // ----------------------------------------------------
  const reloadUsers = useCallback(async () => {
    try {
      const usersData = await fetchUsersData();
      setUsers(usersData);
    } catch (err) {
      setErrorMessage(err.message || "ইউজার আপডেট করা সম্ভব হয়নি");
    }
  }, [fetchUsersData]);

  // ----------------------------------------------------
  // Initial Load
  // ----------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [usersData, rolesData] = await Promise.all([
          fetchUsersData(),
          fetchRolesData(),
        ]);

        if (isMounted) {
          setUsers(usersData);
          setRoles(rolesData);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMessage(err.message || "ডাটা লোড করতে সমস্যা হয়েছে");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [fetchUsersData, fetchRolesData]);

  // ----------------------------------------------------
  // Actions
  // ----------------------------------------------------
  const handleStatusToggle = async (user) => {
    if (user.role === "admin") {
      alert("Admin অ্যাকাউন্টের স্ট্যাটাস পরিবর্তন করা যাবে না");
      return;
    }

    try {
      const headers = getAuthHeaders();
      const data = await safeFetchJson(`${API_BASE_URL}/${user._id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      setSuccessMessage(data.message || "স্ট্যাটাস পরিবর্তিত হয়েছে");
      reloadUsers();
    } catch (err) {
      console.error("Status Toggle Error:", err);
      setErrorMessage(err.message || "স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে");
    }
  };

  // ----------------------------------------------------
  // Form Handling & Modal
  // ----------------------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (user = null) => {
    setErrorMessage("");
    setSuccessMessage("");
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        roleId: user.roleId || (user.roleDetails ? user.roleDetails._id : ""),
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        roleId: roles.length > 0 ? roles[0]._id : "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage("");

    try {
      const headers = getAuthHeaders();

      if (editingUser) {
        await safeFetchJson(`${API_BASE_URL}/${editingUser._id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
          }),
        });

        if (formData.roleId && formData.roleId !== editingUser.roleId) {
          await safeFetchJson(`${API_BASE_URL}/${editingUser._id}/role`, {
            method: "PATCH",
            headers,
            body: JSON.stringify({ roleId: formData.roleId }),
          });
        }

        setSuccessMessage("ইউজার সফলভাবে আপডেট করা হয়েছে");
      } else {
        await safeFetchJson(API_BASE_URL, {
          method: "POST",
          headers,
          body: JSON.stringify(formData),
        });

        setSuccessMessage("নতুন ইউজার সফলভাবে তৈরি হয়েছে");
      }

      setIsModalOpen(false);
      reloadUsers();
    } catch (err) {
      setErrorMessage(err.message || "অপারেশনটি সম্পন্ন করা সম্ভব হয়নি");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white min-h-screen">
      {/* Notifications */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-900/60 border border-red-700 text-red-200 rounded-lg flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <span>{errorMessage}</span>
            {errorMessage.includes("পাওয়া যায়নি") && (
              <button
                onClick={() => navigate("/login")}
                className="text-xs bg-red-800 hover:bg-red-700 underline px-2 py-1 rounded"
              >
                লগইন পেজে যান
              </button>
            )}
          </div>
          <button
            onClick={() => setErrorMessage("")}
            className="font-bold ml-4 text-red-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-900/60 border border-green-700 text-green-200 rounded-lg flex justify-between items-center shadow-md">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage("")}
            className="font-bold ml-4 text-green-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">ইউজার ব্যবস্থাপনা</h1>
          <p className="text-sm text-gray-400">
            সিস্টেমের সকল ইউজার ও তাদের রোল অ্যাকাউন্ট পরিচালনা করুন
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-lg flex items-center gap-2"
        >
          <span>+</span> নতুন ইউজার যোগ করুন
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-gray-400">ডাটা লোড হচ্ছে...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-700/50 text-gray-300 text-sm">
                  <th className="p-4 border-b border-slate-700">নাম</th>
                  <th className="p-4 border-b border-slate-700">ইমেইল</th>
                  <th className="p-4 border-b border-slate-700">রোল</th>
                  <th className="p-4 border-b border-slate-700">স্ট্যাটাস</th>
                  <th className="p-4 border-b border-slate-700 text-right">
                    অ্যাকশন
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 text-sm">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-gray-400">
                      কোনো ইউজার পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const roleName =
                      user.roleDetails?.displayName ||
                      user.roleDetails?.name ||
                      user.role;
                    return (
                      <tr
                        key={user._id}
                        className="hover:bg-slate-700/30 transition"
                      >
                        <td className="p-4 font-medium">{user.name}</td>
                        <td className="p-4 text-gray-300">{user.email}</td>
                        <td className="p-4">
                          <span className="bg-blue-900/40 text-blue-300 px-2.5 py-1 rounded-md text-xs border border-blue-700/50 font-semibold capitalize">
                            {roleName}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleStatusToggle(user)}
                            disabled={user.role === "admin"}
                            className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                              user.isActive
                                ? "bg-green-900/40 text-green-400 border border-green-700/50 hover:bg-green-800/60"
                                : "bg-red-900/40 text-red-400 border border-red-700/50 hover:bg-red-800/60"
                            } ${
                              user.role === "admin"
                                ? "opacity-60 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {user.isActive
                              ? "সক্রিয় (Active)"
                              : "নিষ্ক্রিয় (Inactive)"}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="text-blue-400 hover:text-blue-300 px-3 py-1 bg-slate-700 rounded-md hover:bg-slate-600 transition"
                          >
                            সম্পাদনা
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 border-b border-slate-700 pb-2">
              {editingUser ? "ইউজার তথ্য সম্পাদনা" : "নতুন ইউজার তৈরি করুন"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  পূর্ণ নাম *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="যেমন: রহিম আহমেদ"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  ইমেইল ঠিকানা *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="user@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    পাসওয়ার্ড * (কমপক্ষে ৬ অক্ষর)
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="******"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  রোল (Role) নির্বাচন করুন *
                </label>
                <select
                  name="roleId"
                  required
                  value={formData.roleId}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="" disabled>
                    -- সিলেক্ট করুন --
                  </option>
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.displayName || r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 transition"
                  disabled={actionLoading}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center min-w-[100px]"
                >
                  {actionLoading ? "সেভ হচ্ছে..." : "সংরক্ষণ করুন"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;