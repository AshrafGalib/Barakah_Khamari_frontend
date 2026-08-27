import { useState } from "react";
import { useNavigate } from "react-router";

const ChangePassword = () => {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // পাসওয়ার্ড পরিবর্তনের API কল এখানে করুন
    alert("Password updated successfully!");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl p-6">
        <h2 className="card-title text-center mb-4">পাসওয়ার্ড পরিবর্তন করুন</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">নতুন পাসওয়ার্ড</span>
            </label>
            <input
              type="password"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            পাসওয়ার্ড আপডেট করুন
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;