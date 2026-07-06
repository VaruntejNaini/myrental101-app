import { useState, useEffect } from "react";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";
import { CityStreetScene } from "../components/CityStreetScene";
import { AUTH_MODES, STORAGE_KEYS, MESSAGE_TYPES, API_ROUTES } from "../constants/auth";

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode; // AUTH_MODES.FORGOT or undefined

  const [email, setEmail] = useState(
  location.state?.email ?? localStorage.getItem(STORAGE_KEYS.PENDING_EMAIL) ?? ""
);
  const [emailOtp, setEmailOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);


  // const [mobileOtp, setMobileOtp] = useState("");

  // const [mobileVerified, setMobileVerified] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"

  // SEND MOBILE OTP
  // const sendMobileOtp = async () => {
  //   try {
  //     const res = await API.post("/auth/send-mobile-otp", {
  //       email,
  //       phone,
  //     });
  // 
  //     setMessage(res.data.msg);
  // 
  //   } catch (err) {
  //     setMessage(
  //       err.response?.data?.msg || "Failed to send mobile OTP"
  //     );
  //   }
  // };

  // SEND EMAIL OTP
  const sendEmailOtp = async () => {
    if (cooldown > 0 || isSending) return;
    setIsSending(true);
    setMessage("");

    try {
      const res = await API.post(API_ROUTES.SEND_EMAIL_OTP, { 
        email,
      });

      setMessage(res.data.msg);
      setMessageType(MESSAGE_TYPES.SUCCESS);
      setCooldown(60); // 60-second cooldown starts here

    } catch (err) {
      setMessage(
        err.response?.data?.msg || "Failed to send email OTP"
      );
      setMessageType(MESSAGE_TYPES.ERROR);
    } finally {
      setIsSending(false);
    }
  };

  // VERIFY EMAIL OTP
  const verifyEmailOtp = async (e) => {
    e?.preventDefault();
    if (!emailOtp.trim() || isVerifying) return;

    setIsVerifying(true);
    setMessage("");

    try {
      if (mode === AUTH_MODES.FORGOT) {
        await API.post(API_ROUTES.VERIFY_RESET_OTP, {
          email,
          otp: emailOtp,
        });
        navigate("/reset-password", { state: { email, otp: emailOtp } });
      } else {
        const res = await API.post(API_ROUTES.VERIFY_EMAIL_OTP, {
          email,
          otp: emailOtp,
        });
        if (res.data.token) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token);
        }
        if (res.data.user?.name) {
          localStorage.setItem("user_name", res.data.user.name);
        }
        navigate("/dashboard");
      }
    } catch (err) {
      setMessage(err.response?.data?.msg || "Invalid Email OTP");
      setMessageType(MESSAGE_TYPES.ERROR);
    } finally {
      setIsVerifying(false);
    }
  };

  // VERIFY MOBILE OTP
  // const verifyMobileOtp = async () => {
  //   try {
  //     const res = await API.post("/auth/verify-mobile-otp", {
  //       email,
  //       otp: mobileOtp,
  //     });
  // 
  //     setMobileVerified(true);
  // 
  //     setMessage(res.data.msg);
  // 
  //   } catch (err) {
  //     setMessage(
  //       err.response?.data?.msg || "Invalid mobile OTP"
  //     );
  //   }
  // };

  //

  return (
     <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{background:"#fdf6ee"}}>
            <CityStreetScene /> 
            <div className="relative z-10 bg-white/10 backdrop-blur-2xl p-8 rounded-3xl w-80 border border-white/35"
      style={{boxShadow:"0 8px 32px rgba(99,102,241,0.2), 0 1.5px 0 rgba(255,255,255,0.5) inset"}}>
        <h2 className="text-3xl font-bold text-center mb-6">
          Verify Account 🔐
        </h2>

        {/* MOBILE SECTION */}

        {/* <div className="mb-8">

          <label className="font-semibold text-gray-700">
            Mobile Number
          </label>

          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Enter mobile number"
              className="flex-1 border p-3 rounded-xl"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <button
              onClick={sendMobileOtp}
              className="bg-indigo-500 text-white px-4 rounded-xl"
            >
              Send OTP
            </button>
          </div>

          <input
            type="text"
            placeholder="Enter mobile OTP"
            className="w-full border p-3 rounded-xl mt-3"
            value={mobileOtp}
            onChange={(e) => setMobileOtp(e.target.value)}
          />

          <button
            onClick={verifyMobileOtp}
            className="w-full bg-green-500 text-white py-3 rounded-xl mt-3"
          >
            Verify Mobile OTP
          </button>

          {mobileVerified && (
            <p className="text-green-600 mt-2">
              Mobile Verified ✅
            </p>
          )}
        </div> */}

        {/* EMAIL SECTION */}

<form className="mt-6" onSubmit={verifyEmailOtp}>

  <label className="block font-semibold text-gray-700 mb-2">
    Registered Email
  </label>

  <input
    type="email"
    value={email}
    disabled={mode !== AUTH_MODES.FORGOT && !!email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="Enter email address"
    className={`
      w-full
      border
      border-gray-300
      p-3
      rounded-xl
      mt-2
      outline-none
      focus:ring-2
      focus:ring-indigo-400
      focus:border-indigo-400
      transition-all
      ${(mode !== AUTH_MODES.FORGOT && !!email) ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white text-gray-900"}
    `}
  />
   {/* OTP Input */}
  <input
    type="text"
    placeholder="Enter Email OTP"
    className="
      w-full
      border
      border-gray-300
      p-3
      rounded-xl
      mt-4
      outline-none
      focus:ring-2
      focus:ring-indigo-400
      focus:border-indigo-400
      transition-all
    "
    value={emailOtp}
    onChange={(e) => setEmailOtp(e.target.value)}
  />
 {/* Send OTP Button */}
  <button
    type="button"
    onClick={sendEmailOtp}
    disabled={cooldown > 0 || isSending}
    className="
      w-full
      bg-indigo-500
      text-white
      py-3
      rounded-xl
      mt-4
      font-semibold
      transition-all
      duration-200
      disabled:bg-gray-400
      disabled:text-gray-200
      disabled:cursor-not-allowed
      hover:bg-indigo-600
      hover:shadow-md
      active:scale-95
    "
  >
    {isSending ? "Sending..." : cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Send OTP"}
  </button>

  {/* Verify Button */}
  <button
    type="submit"
    disabled={isVerifying}
    className="
      w-full
      bg-indigo-500
      text-white
      py-3
      rounded-xl
      mt-4
      font-semibold
      transition-all
      duration-200
      hover:bg-indigo-600
      hover:shadow-md
      active:scale-95
    "
  >
    Verify Email OTP
  </button>
  {message && (
  <p className={`text-sm mt-3 text-center font-medium ${messageType === MESSAGE_TYPES.SUCCESS ? "text-green-500" : "text-red-500"}`}>
    {message}
  </p>
)}

 

</form>
        
      </div>
    </div>
    
    
  );
}

export default VerifyOtp;
