import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import "./VerifyOtp.css";

axios.defaults.baseURL = "https://devly-backend-r0xj.onrender.com"


const useQuery = () => new URLSearchParams(useLocation().search);

export default function VerifyOtp() {
  const query = useQuery();
  const email = query.get("email") || "your email";
  const navigate = useNavigate();

  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputs = useRef([]);
  const [timeLeft, setTimeLeft] = useState(180);
  const [expired, setExpired] = useState(false);

  /* --------------------------- TIMER --------------------------- */
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setExpired(true);
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format = (sec) =>
    `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  /* ---------------------- OTP INPUT CHANGE --------------------- */
  const handleChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 1);

    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < 5) inputs.current[index + 1].focus();
  };

  const handleBackspace = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  /* ------------------------- VERIFY OTP ------------------------- */
  const verifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join("");

    if (code.length !== 6) {
      return Swal.fire("Error", "Please enter all 6 digits", "error");
    }

    if (expired) {
      return Swal.fire("Expired", "OTP has expired, resend.", "warning");
    }

    try {
      const res = await axios.post("/api/auth/verify-otp", {
        email,
        otp: code,
      });

      Swal.fire("Success", res.data.message || "Verified!", "success").then(() =>
        navigate("/auth?mode=signin")
      );
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Invalid OTP", "error");
    }
  };

  /* ------------------------ RESEND OTP -------------------------- */
  const resendOtp = async () => {
    try {
      // await axios.post("/api/auth/resend-otp", { email });
      Swal.fire("Sent", "New OTP sent to your email", "success");

      setOtp(Array(6).fill(""));
      setTimeLeft(180);
      setExpired(false);
      inputs.current[0].focus();
    } catch {
      Swal.fire("Error", "Unable to resend OTP", "error");
    }
  };

  return (
    <div className="otp-page">
      <div className="otp-card">

        {/* LEFT SIDE */}
        <div className="verify-left">
          <h1>Verify your email</h1>
          <p>
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="verify-right">

          {/* TIMER */}
          <div className={`timer ${expired ? "expired" : ""}`}>
            {expired ? "OTP expired" : `Time remaining: ${format(timeLeft)}`}
          </div>

          {/* OTP FORM */}
          <form onSubmit={verifyOtp}>
            <div className="otp-input-box">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  type="text"
                  value={digit}
                  maxLength={1}
                  inputMode="numeric"
                  disabled={expired}
                  ref={(el) => (inputs.current[i] = el)}
                  onChange={(e) => handleChange(e, i)}
                  onKeyDown={(e) => handleBackspace(e, i)}
                />
              ))}
            </div>

            <button type="submit" className="otp-submit-btn">
              Verify
            </button>
          </form>

          {/* RESEND BUTTON */}
          <button className="resendBtn" disabled={!expired} onClick={resendOtp}>
            Resend Code
          </button>

          {/* LOGIN LINK */}
          <p className="login-text">
            Already verified?{" "}
            <span onClick={() => navigate("/auth")}>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
}
