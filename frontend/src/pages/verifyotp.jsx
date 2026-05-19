import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { CityStreetScene } from "../components/CityStreetScene";

function VerifyOtp() {
  const navigate = useNavigate();

  const email = localStorage.getItem("pendingEmail");

  // const [phone, setPhone] = useState("");

  const [emailOtp, setEmailOtp] = useState("");
  // const [mobileOtp, setMobileOtp] = useState("");

  const [emailVerified, setEmailVerified] = useState(false);
  // const [mobileVerified, setMobileVerified] = useState(false);

  const [message, setMessage] = useState("");

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

    } catch (err) {
      setMessage(
        err.response?.data?.msg || "Failed to send email OTP"
      );
    }
  };

  // VERIFY EMAIL OTP
  const verifyEmailOtp = async () => {
    try {
      const res = await API.post("/auth/verify-email-otp", {
        email,
        otp: emailOtp,
        
      });

      setEmailVerified(true);

      setMessage(res.data.msg);

    } catch (err) {
      setMessage(
        err.response?.data?.msg || "Invalid email OTP"
      );
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

  // FINAL CONTINUE
  const handleContinue = () => {
    if (emailVerified) {
      navigate("/");
    } else {
      setMessage("Please verify your email to continue");
    }
  };

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

        <div>

          <label className="font-semibold text-gray-700">
            Registered Email
          </label>

          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={email}
              disabled
              className="flex-1 border p-3 rounded-xl bg-gray-100"
            />

            <button
              onClick={sendEmailOtp}
              className="bg-indigo-500 text-white px-4 rounded-xl"
            >
              Send OTP
            </button>
          </div>

          <input
            type="text"
            placeholder="Enter email OTP"
            className="w-full border p-3 rounded-xl mt-3"
            value={emailOtp}
            onChange={(e) => setEmailOtp(e.target.value)}
          />

          <button
            onClick={verifyEmailOtp}
            className="w-full bg-green-500 text-white py-3 rounded-xl mt-3"
          >
            Verify Email OTP
          </button>

          {emailVerified && (
            <p className="text-green-600 mt-2">
              Email Verified ✅
            </p>
          )}
        </div>

        {/* MESSAGE */}

        {message && (
          <p className="text-center mt-5 text-sm text-gray-700">
            {message}
          </p>
        )}

        {/* CONTINUE BUTTON */}

        <button
          onClick={handleContinue}
          className="w-full bg-black text-white py-3 rounded-xl mt-6"
        >
          Continue
        </button>

      </div>
    </div>
    
  );
}

export default VerifyOtp;
