import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";
import { CityStreetScene } from "../components/CityStreetScene";
import { STORAGE_KEYS, API_ROUTES, REGEX_PATTERNS } from "../constants/auth";

function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    if (!form.name || !form.email || !form.password) {
      return "All fields required";
    }
    if (!REGEX_PATTERNS.EMAIL.test(form.email)) {
      return "Invalid email";
    }
    if (form.password.length < 6) {
      return "Password must be 6+ chars";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);

    try {
      setLoading(true);
      await API.post(API_ROUTES.REGISTER, form);
      localStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, form.email);
      navigate("/verifyotp");
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

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
        className="relative z-10 bg-white/10 backdrop-blur-2xl p-8 rounded-3xl w-80 border border-white/35 transition-transform duration-100 ease-out"
        onMouseMove={handleTiltMove}
        onMouseLeave={handleTiltLeave}
        style={{
          boxShadow: "0 8px 32px rgba(99,102,241,0.2), 0 1.5px 0 rgba(255,255,255,0.5) inset",
          transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: "preserve-3d"
        }}
      >

        <h2 className="text-2xl font-bold text-white text-center mb-6" style={{ transform: "translateZ(20px)" }}>
          Create Account ✨
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col" style={{ transform: "translateZ(10px)" }}>
          <input
            placeholder="Name"
            className="mb-3 p-2 rounded-lg bg-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            placeholder="Email"
            className="mb-3 p-2 rounded-lg bg-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <div className="relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full p-2 pr-10 rounded-lg bg-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {error && (
            <p className="text-red-200 text-sm mb-2">{error}</p>
          )}

          <button type="submit" disabled={loading} className="bg-white text-purple-600 font-semibold py-2 rounded-lg hover:bg-gray-200 transition cursor-pointer disabled:cursor-not-allowed">
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-sm text-white mt-4 text-center" style={{ transform: "translateZ(15px)" }}>
          Already have an account?{" "}
          <Link to="/login" className="underline font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;