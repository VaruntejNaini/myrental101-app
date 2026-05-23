import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import { CityStreetScene } from "../components/CityStreetScene";
import { AUTH_MODES, STORAGE_KEYS, API_ROUTES, REGEX_PATTERNS } from "../constants/auth";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
  const addScript = document.createElement("script");
  addScript.src =
    "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  addScript.async = true;
  document.body.appendChild(addScript);

  window.googleTranslateElementInit = () => {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        includedLanguages: "en,hi,te",
      },
      "google_translate_element"
    );
  };
}, []);

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
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  return (
   <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{background:"#fdf6ee"}}>
      <CityStreetScene />
      {/* 🌐 Translator button */}
     <div id="google_translate_element" className="fixed top-4 right-4 z-50"></div>

    
      
      
      <div className="relative z-10 bg-white/10 backdrop-blur-2xl p-8 rounded-3xl w-80 border border-white/35"
  style={{boxShadow:"0 8px 32px rgba(99,102,241,0.2), 0 1.5px 0 rgba(255,255,255,0.5) inset"}}>
        
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Welcome Back 👋
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col">
  
          <input
            type="email"
            placeholder="Email"
            className="mb-4 p-2 rounded-lg bg-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
            onChange={e => setForm({...form, email: e.target.value})}
          />

          <div className="relative mb-4">
  <input
    type={showPassword ? "text" : "password"}
    placeholder="Password"
    className="w-full p-2 pr-10 rounded-lg bg-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
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
          <button type="submit" disabled={loading} className="bg-white text-purple-600 font-semibold py-2 rounded-lg hover:bg-gray-200 transition cursor-pointer disabled:cursor-not-allowed">
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

        <p className="text-sm text-white mt-4 text-center"> 
            Don’t have an account?{" "}
          <Link to="/register" className="underline font-semibold">
            Register
          </Link>
        </p>

      </div>
    </div>
    
  );
}

export default Login;
