import { useState } from "react";
import { Navigate, useLocation } from "react-router";
import { FaLock, FaEnvelope } from "react-icons/fa";

import { useAuth } from "../context/useAuth";

const Login = () => {
  const {
    login,
    isAuthenticated,
    loading,
  } = useAuth();

  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in হলে login page দেখাবে না
  if (!loading && isAuthenticated) {
    const from =
      location.state?.from?.pathname ||
      "/dashboard";

    return (
      <Navigate
        to={from}
        replace
      />
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    // -----------------------------
    // Basic Validation
    // -----------------------------

    const cleanEmail =
      email.trim().toLowerCase();

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
      await login(
        cleanEmail,
        password
      );

      // Login successful হলে
      // AuthProvider নিজেই user/token set করবে.
      //
      // Navigate করার দরকার নেই।
      // এই component-এর authentication
      // state change হলে উপরের Navigate কাজ করবে।
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setError(
        error?.message ||
          "Login করা যায়নি। Email অথবা password সঠিক কিনা দেখুন।"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">
            বারাকাহ খামারি
          </h1>

          <p className="text-sm text-base-content/60 mt-2">
            ইনভেন্টরি ও POS
          </p>
        </div>

        {/* Login Card */}
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">
                লগইন করুন
              </h2>

              <p className="text-sm text-base-content/60 mt-1">
                আপনার account দিয়ে software-এ প্রবেশ করুন
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-error mb-2">
                <span className="text-sm">
                  {error}
                </span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Email */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Email
                  </span>
                </label>

                <label className="input input-bordered flex items-center gap-3">
                  <FaEnvelope className="text-base-content/40" />

                  <input
                    type="email"
                    placeholder="আপনার email"
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    autoComplete="email"
                    disabled={submitting}
                    className="grow"
                  />
                </label>
              </div>

              {/* Password */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Password
                  </span>
                </label>

                <label className="input input-bordered flex items-center gap-3">
                  <FaLock className="text-base-content/40" />

                  <input
                    type="password"
                    placeholder="আপনার password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    autoComplete="current-password"
                    disabled={submitting}
                    className="grow"
                  />
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full"
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