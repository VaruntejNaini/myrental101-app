import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";
import { CityStreetScene } from "../components/CityStreetScene";
import { API_ROUTES } from "../constants/auth";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const otp = location.state?.otp;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Security route protection
  useEffect(() => {
    if (!email || !otp) {
      navigate("/login");
    }
  }, [email, otp, navigate]);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      return setError("All fields are required");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);
      setError("");

      const res = await API.post(API_ROUTES.RESET_PASSWORD, {
        email,
        otp,
        newPassword: password,
      });

      setSuccess(res.data.msg || "Password reset successfully!");
      
      // Delay redirection so the user can see the success state
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#fdf6ee" }}>
      <CityStreetScene />
      
      <div className="relative z-10 bg-white/10 backdrop-blur-2xl p-8 rounded-3xl w-80 border border-white/35"
        style={{ boxShadow: "0 8px 32px rgba(99,102,241,0.2), 0 1.5px 0 rgba(255,255,255,0.5) inset" }}>
        
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Reset Password 🔐
        </h2>

        <form onSubmit={handleReset} className="flex flex-col">
          
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              className="w-full p-2 pr-10 rounded-lg bg-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              className="w-full p-2 pr-10 rounded-lg bg-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-200 text-sm mb-3 text-center">{error}</p>}
          {success && <p className="text-green-200 text-sm mb-3 text-center">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-white text-purple-600 font-semibold py-2 rounded-lg hover:bg-gray-200 transition cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? "Resetting..." : "Confirm"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;