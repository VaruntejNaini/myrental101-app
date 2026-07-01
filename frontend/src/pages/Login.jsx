import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import API from "../api";
import { CityStreetScene } from "../components/CityStreetScene";
import { AUTH_MODES, STORAGE_KEYS, API_ROUTES, REGEX_PATTERNS } from "../constants/auth";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [canRenderGoogle, setCanRenderGoogle] = useState(false);

  // Dynamic States
  const [isNight, setIsNight] = useState(() => localStorage.getItem("theme") === "night");
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const toggleTheme = () => {
    setIsNight(prev => {
      const next = !prev;
      localStorage.setItem("theme", next ? "night" : "day");
      return next;
    });
  };

  const handleTiltMove = (e) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    const rx = -(y / box.height) * 15;
    const ry = (x / box.width) * 15;
    setTilt({ rx, ry });
  };

  const handleTiltLeave = () => {
    setTilt({ rx: 0, ry: 0 });
  };

  const validate = () => {
    if (!form.email || !form.password) {
      return "All fields are required";
    }
    if (!REGEX_PATTERNS.EMAIL.test(form.email)) {
      return "Invalid email format";
    }
    if (form.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  const handleForgotPassword = () => {
    if (!form.email) {
      setError("Please fill in your email address to recover your password.");
      return;
    }
    if (!REGEX_PATTERNS.EMAIL.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    navigate("/verifyotp", { state: { email: form.email, mode: AUTH_MODES.FORGOT } });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);

    try {
      setLoading(true);
      setError("");

      const res = await API.post(API_ROUTES.LOGIN, form);

      localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
      if (res.data.user?.name) {
        localStorage.setItem("user_name", res.data.user.name);
      }
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.data?.msg === "ACCOUNT_BLOCKED") {
        navigate("/blocked");
        return;
      }
      setError(err.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
      if (res.data.user?.name) {
        localStorage.setItem("user_name", res.data.user.name);
      }
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.data?.msg === "ACCOUNT_BLOCKED") {
        navigate("/blocked");
        return;
      }
      setError(err.response?.data?.msg || "Google Authentication failed");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanRenderGoogle(true);
    }, 50); // A tiny 50ms delay is all it takes to clear the storm
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: isNight ? "#09090b" : "#fdf6ee", transition: "background 0.5s ease" }}>
      <CityStreetScene isNight={isNight} />
      
      {/* 🌓 Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-white/20 hover:bg-white/35 border border-white/20 transition-all text-lg cursor-pointer shadow-md backdrop-blur-md"
        title="Toggle Day/Night Mode"
      >
        {isNight ? "🌙" : "☀️"}
      </button>

      <div
        className="relative z-10 bg-white/10 backdrop-blur-2xl p-10 rounded-3xl w-full max-w-[450px] border border-white/35 transition-transform duration-100 ease-out"
        onMouseMove={handleTiltMove}
        onMouseLeave={handleTiltLeave}
        style={{
          boxShadow: "0 8px 32px rgba(99,102,241,0.2), 0 1.5px 0 rgba(255,255,255,0.5) inset",
          transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: "preserve-3d"
        }}
      >
        
        <h2 className="text-3xl font-black text-white text-center mb-6" style={{ transform: "translateZ(20px)" }}>
          Welcome Back 👋
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col" style={{ transform: "translateZ(10px)" }}>
  
          <input
            type="email"
            placeholder="Email"
            className="mb-4 p-3 rounded-xl bg-white/35 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-white transition"
            onChange={e => setForm({...form, email: e.target.value})}
          />

          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full p-3 pr-10 rounded-xl bg-white/35 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-white transition"
              onChange={e => setForm({ ...form, password: e.target.value })}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <div className="flex justify-end mb-4">
            <span
              onClick={handleForgotPassword}
              className="text-xs text-white underline cursor-pointer hover:text-gray-200 transition"
            >
              Forgot Password?
            </span>
          </div>
          <button type="submit" disabled={loading} className="bg-white text-indigo-700 font-bold py-3 rounded-xl hover:bg-gray-100 active:scale-95 transition cursor-pointer disabled:cursor-not-allowed shadow-md">
            {loading ? "Logging in..." : "Login"}
          </button>
          {error && (
            <div className="mt-2 text-center">
              <p className="text-red-200 text-sm mb-1">{error}</p>
              {error.toLowerCase().includes("verify") && (
                <button
                  type="button"
                  onClick={() => navigate("/verifyotp", { state: { email: form.email } })}
                  className="text-xs text-indigo-100 hover:text-white underline font-semibold transition cursor-pointer"
                >
                  Verify your account now ➔
                </button>
              )}
            </div>
          )}
        </form>

        <div className="flex flex-col items-center mt-6 mb-4 space-y-4" style={{ transform: "translateZ(15px)" }}>
          <div className="flex items-center w-full">
            <div className="flex-grow border-t border-white/20"></div>
            <span className="mx-4 text-xs font-semibold text-white/60 uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-white/20"></div>
          </div>
          
          <div className="w-full flex justify-center">
         {/* ✅ MODIFY THIS BLOCK: Wrap the GoogleLogin component in a conditional check */}
      {canRenderGoogle ? (
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Google Sign-In failed. Please try again.")}
          shape="pill"
          theme="filled_blue"
          size="large"
          text="continue_with"
        />
      ) : (
        // A clean, matching placeholder block so your layout doesn't jump
        <div className="h-[44px] w-[240px] bg-white/20 animate-pulse rounded-full" />
      )}
          </div>
        </div>

        <p className="text-sm text-white mt-5 text-center" style={{ transform: "translateZ(15px)" }}> 
          Don’t have an account?{" "}
          <Link to="/register" className="underline font-semibold hover:text-gray-200">
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;
