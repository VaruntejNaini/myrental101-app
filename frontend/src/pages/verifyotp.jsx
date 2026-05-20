import { useState } from "react";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../api";
import { CityStreetScene } from "../components/CityStreetScene";

function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode; // "forgot" or undefined

  const [email, setEmail] = useState(
    location.state?.email || localStorage.getItem("pendingEmail") || ""
  );
  const [emailOtp, setEmailOtp] = useState("");

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
    try {
      const res = await API.post("/auth/send-email-otp", { 
        email,
      });

      setMessage(res.data.msg);
      setMessageType("success");

    } catch (err) {
      setMessage(
        err.response?.data?.msg || "Failed to send email OTP"
      );
      setMessageType("error");
    }
  };

  // VERIFY EMAIL OTP
  const verifyEmailOtp = async () => {
    try {
      if (mode === "forgot") {
        await API.post("/auth/verify-reset-otp", {
          email,
          otp: emailOtp,
        });
        setMessage("");
        navigate("/reset-password", { state: { email, otp: emailOtp } });
      } else {
        const res = await API.post("/auth/verify-email-otp", {
          email,
          otp: emailOtp,
        });
        setMessage("");
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
        }
        navigate("/dashboard");
      }
    } catch (err) {
      setMessage(err.response?.data?.msg || "Invalid Email OTP");
      setMessageType("error");
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
{/* EMAIL SECTION */}

<div className="mt-6">

  <label className="block font-semibold text-gray-700 mb-2">
    Registered Email
  </label>
{/* Email + Send OTP */}
<div className="flex items-center gap-2 mt-2">

  <input
    type="email"
    value={email}
    disabled={mode !== "forgot"}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="Enter email address"
    className={`
      w-[78%]
      border
      border-gray-300
      px-4
      py-2.5
      rounded-xl
      text-sm
      outline-none
      transition-all
      ${mode === "forgot" ? "bg-white/20 text-white placeholder-gray-300 focus:ring-2 focus:ring-white border-white/35" : "bg-gray-100 text-gray-700"}
    `}
  />
  

  <button
    onClick={sendEmailOtp}
    className="
      w-[22%]
      bg-indigo-500
      text-white
      text-[11px]
      font-medium
      px-1
      py-2
      rounded-xl
      transition-all
      duration-200
      hover:bg-indigo-600
      hover:shadow-md
      active:scale-95
    "
  >
    Send OTP
  </button>

</div>

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

  {/* Verify Button */}
  <button
    onClick={verifyEmailOtp}
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
  <p className={`text-sm mt-3 text-center font-medium ${messageType === "success" ? "text-green-500" : "text-red-500"}`}>
    {message}
  </p>
)}

 

</div>
        
      </div>
    </div>
    
    
  );
}

export default VerifyOtp;
