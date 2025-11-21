// Auth.js - frontend React component (User frontend running on port 3000)
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../auth.css";

axios.defaults.baseURL = "https://devly-backend-r0xj.onrender.com"


const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSignup, setIsSignup] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    role: "student", // Default to student
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    number: "",
    password: "",
    confirmPassword: "",
    country: "",
  });

  // 🔥 Detect query param for mode switching (signin/signup)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    setIsSignup(mode === "signup");
  }, [location.search]);

  // LOGIN HANDLER
 const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password, role } = loginData;

    if (!email || !password) {
      return Swal.fire("Error", "Please fill all fields", "error");
    }

    try {
      const res = await axios.post("/api/auth/login", {
        email,
        password,
        role,
      });

      // save token
      localStorage.setItem("token", res.data.token);
      console.log(res.data); // should include { token: "..." }


      if (res.data.role === "admin") {
        localStorage.setItem("role", "admin");
        localStorage.setItem("email", loginData.email);

        Swal.fire("Success", "Admin login successful", "success").then(() => {
          window.location.href = `http://localhost:3001/dashboard?token=${res.data.token}`;
        });
      } else if (res.data.role === "professor") {
        localStorage.setItem("role", "professor");
        localStorage.setItem("email", res.data.professor.email);
        localStorage.setItem("name", res.data.professor.name);

        Swal.fire("Success", "Professor login successful", "success").then(() =>
          navigate("/professor-dashboard")
        );
      } else {
        localStorage.setItem("role", "user");
        localStorage.setItem("email", res.data.user.email);
        localStorage.setItem("name", res.data.user.name);

        if (res.data.user.profilePic) {
          const fullUrl = `${res.data.user.profilePic}`;
          localStorage.setItem("profilePic", fullUrl);
        } else {
          localStorage.removeItem("profilePic");
        }

        Swal.fire("Success", "Login successful", "success").then(() =>
          navigate("/Home")
        );
      }
    } catch (err) {
      Swal.fire(
        "Login Failed",
        err.response?.data?.message || "An error occurred",
        "error"
      );
    }
  };

  // SIGNUP HANDLER
  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, email, number, password, confirmPassword, country } = signupData;

    if (!name || !email || !number || !password || !confirmPassword || !country) {
      return Swal.fire("Error", "Please fill all fields", "error");
    }

    // ✅ Phone number validation by country
    let phoneRegex;
    switch (country) {
      case "IN":
        phoneRegex = /^[6-9]\d{9}$/;
        break;
      case "US":
        phoneRegex = /^[2-9]\d{9}$/;
        break;
      case "UK":
        phoneRegex = /^07\d{9,10}$/;
        break;
      default:
        phoneRegex = /^\d{10}$/;
    }
    if (!phoneRegex.test(number)) {
      return Swal.fire("Invalid Number", "Enter a valid phone number", "warning");
    }

    if (password.length < 6) {
      return Swal.fire("Weak Password", "Password must be at least 6 characters", "warning");
    }

    if (password !== confirmPassword) {
      return Swal.fire("Mismatch", "Passwords do not match", "error");
    }

    try {
      const res = await axios.post("http://127.0.0.1:5000/api/auth/signup", {
        name,
        email,
        number,
        password,
        country,
      });

      Swal.fire("Success", res.data.message, "success").then(() => {
        navigate(`/verify-email?email=${email}`);
      });
    } catch (err) {
      Swal.fire(
        "Signup Failed",
        err.response?.data?.message || "An error occurred",
        "error"
      );
    }
  };

  return (
    <div className={`container1 ${isSignup ? "sign-up-mode" : ""}`}>
      <div className="forms-container">
        <div className="signin-signup">
          {/* LOGIN FORM */}
          <form className="sign-in-form" onSubmit={handleLogin}>
            <h2 className="title">Sign in</h2>
            <button
              type="button"
              className="btn transparent"
              style={{ position: "absolute", top: "20px", left: "20px", fontSize: "1.2rem", padding: "10px 20px" }}
              onClick={() => navigate("/")}
            >
              ← Back
            </button>

            <div className="input-field">
              <i className="fas fa-user-tag" />
              <select
                value={loginData.role}
                onChange={(e) => setLoginData({ ...loginData, role: e.target.value })}
                style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "1rem", color: "#333" }}
              >
                <option value="student">Student</option>
                <option value="professor">Professor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="input-field">
              <i className="fas fa-user" />
              <input
                type="email"
                placeholder="Email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              />
            </div>

            <div className="input-field">
              <i className="fas fa-lock" />
              <input
                type={showLoginPassword ? "text" : "password"}
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              />
              <i
                className={`fas ${showLoginPassword ? "fa-eye-slash" : "fa-eye"} eye-toggle`}
                onClick={() => setShowLoginPassword(!showLoginPassword)}
              />
            </div>

            <input type="submit" value="Login" className="btn solid" />

            <p style={{ textAlign: "center", marginTop: "1rem" }}>
              Don't have an account?
              <button
                type="button"
                onClick={() => navigate("/auth?mode=signup")}
                style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", textDecoration: "underline", marginLeft: "0.5rem" }}
              >
                Sign up here
              </button>
            </p>
          </form>

          {/* SIGNUP FORM */}
          <form className="sign-up-form" onSubmit={handleSignup}>
            <h2 className="title">Sign up</h2>

            <div className="input-field">
              <i className="fas fa-user" />
              <input
                type="text"
                placeholder="Name"
                value={signupData.name}
                onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
              />
            </div>

            <div className="input-field">
              <i className="fas fa-envelope" />
              <input
                type="email"
                placeholder="Email"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
              />
            </div>

            <div className="input-field">
              <i className="fas fa-globe" />
              <select
                value={signupData.country}
                onChange={(e) => setSignupData({ ...signupData, country: e.target.value })}
              >
                <option value="">Select Country</option>
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
              </select>
            </div>

            <div className="input-field">
              <i className="fas fa-phone" />
              <input
                type="text"
                placeholder="Phone Number"
                value={signupData.number}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val)) {
                    setSignupData({ ...signupData, number: val });
                  }
                }}
              />
            </div>

            <div className="input-field">
              <i className="fas fa-lock" />
              <input
                type={showSignupPassword ? "text" : "password"}
                placeholder="Password"
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
              />
              <i
                className={`fas ${showSignupPassword ? "fa-eye-slash" : "fa-eye"} eye-toggle`}
                onClick={() => setShowSignupPassword(!showSignupPassword)}
              />
            </div>

            <div className="input-field">
              <i className="fas fa-lock" />
              <input
                type={showSignupConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={signupData.confirmPassword}
                onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
              />
              <i
                className={`fas ${showSignupConfirmPassword ? "fa-eye-slash" : "fa-eye"} eye-toggle`}
                onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
              />
            </div>

            <input type="submit" value="Sign up" className="btn solid" />

            <p style={{ textAlign: "center", marginTop: "1rem" }}>
              Already have an account?
              <button
                type="button"
                onClick={() => navigate("/auth?mode=signin")}
                style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", textDecoration: "underline", marginLeft: "0.5rem" }}
              >
                Login here
              </button>
            </p>
          </form>
        </div>
      </div>

      {/* PANELS */}
      <div className="panels-container">
        <div className="panel left-panel">
          <div className="content">
            <h3>New here?</h3>
            <p>Sign up and start your journey!</p>
            <button className="btn transparent" onClick={() => navigate("/auth?mode=signup")}>
              Sign up
            </button>
          </div>
          <img src="/log.svg" className="image" alt="Login" />
        </div>

        <div className="panel right-panel">
          <div className="content">
            <h3>One of us?</h3>
            <p>Then sign in and get started!</p>
            <button className="btn transparent" onClick={() => navigate("/auth?mode=signin")}>
              Sign in
            </button>
          </div>
          <img src="/register.svg" className="image" alt="Register" />
        </div>
      </div>
    </div>
  );
};

export default Auth;