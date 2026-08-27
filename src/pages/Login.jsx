import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { FaLock, FaEnvelope } from "react-icons/fa";

import { useAuth } from "../context/useAuth";

const Login = () => {
  const { login, isAuthenticated, loading } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, location]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Email দিন");
      return;
    }

    if (!password) {
      setError("Password দিন");
      return;
    }

    setSubmitting(true);

    try {
      await login(cleanEmail, password);
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err?.message ||
          "Login করা যায়নি। Email অথবা password সঠিক কিনা দেখুন।"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">
            বারাকাহ খামারি
          </h1>
          <p className="text-sm text-base-content/60 mt-2">
            ইনভেন্টরি ও POS
          </p>
        </div>

        {/* Card Container */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">লগইন করুন</h2>
              <p className="text-sm text-base-content/60 mt-1">
                আপনার account দিয়ে software-এ প্রবেশ করুন
              </p>
            </div>

            {error && (
              <div className="alert alert-error mb-2">
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input Box */}
              <div className="form-control">
                <label className="label" htmlFor="email-input">
                  <span className="label-text font-medium">Email</span>
                </label>
                <div className="input input-bordered flex items-center gap-3">
                  <FaEnvelope className="text-base-content/40" />
                  <input
                    id="email-input"
                    type="email"
                    placeholder="আপনার email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={submitting}
                    className="grow bg-transparent outline-none border-none focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Input Box */}
              <div className="form-control">
                <label className="label" htmlFor="password-input">
                  <span className="label-text font-medium">Password</span>
                </label>
                <div className="input input-bordered flex items-center gap-3">
                  <FaLock className="text-base-content/40" />
                  <input
                    id="password-input"
                    type="password"
                    placeholder="আপনার password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={submitting}
                    className="grow bg-transparent outline-none border-none focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full mt-2"
              >
                {submitting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    লগইন হচ্ছে...
                  </>
                ) : (
                  "লগইন"
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-base-content/40 mt-5">
          © ২০২৬ বারাকাহ খামারি
        </p>
      </div>
    </div>
  );
};

export default Login;