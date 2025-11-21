import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../auth.css";

axios.defaults.baseURL = "https://devly-backend-r0xj.onrender.com";

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
    role: "student",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    number: "",
    password: "",
    confirmPassword: "",
    country: "",
  });

  const [loading, setLoading] = useState(false); // 🔥 Add loading state

  // Detect query param for mode switching (signin/signup)
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

    setLoading(true); // start loading
    try {
      const res = await axios.post("/api/auth/login", { email, password, role });
      const { token, role: userRole, user, professor } = res.data;

      localStorage.setItem("token", token);

      if (userRole === "admin") {
        localStorage.setItem("role", "admin");
        localStorage.setItem("email", email);
        Swal.fire("Success", "Admin login successful", "success").then(() => {
          navigate("/dashboard");
        });
      } else if (userRole === "professor") {
        localStorage.setItem("role", "professor");
        localStorage.setItem("email", professor.email);
        localStorage.setItem("name", professor.name);
        Swal.fire("Success", "Professor login successful", "success").then(() =>
          navigate("/professor-dashboard")
        );
      } else {
        localStorage.setItem("role", "user");
        localStorage.setItem("email", user.email);
        localStorage.setItem("name", user.name);
        if (user.profilePic) localStorage.setItem("profilePic", user.profilePic);
        else localStorage.removeItem("profilePic");

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
    } finally {
      setLoading(false); // stop loading
    }
  };

  // SIGNUP HANDLER
  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, email, number, password, confirmPassword, country } = signupData;

    if (!name || !email || !number || !password || !confirmPassword || !country) {
      return Swal.fire("Error", "Please fill all fields", "error");
    }

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

    setLoading(true); // start loading
    try {
      const res = await axios.post("/api/auth/signup", {
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
    } finally {
      setLoading(false); // stop loading
    }
  };

  return (
    <div className={`container1 ${isSignup ? "sign-up-mode" : ""}`}>
      <div className="forms-container">
        <div className="signin-signup">
          {/* LOGIN FORM */}
          <form className="sign-in-form" onSubmit={handleLogin}>
            <h2 className="title">Sign in</h2>

            <div className="input-field">
              <select
                value={loginData.role}
                onChange={(e) => setLoginData({ ...loginData, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="professor">Professor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="input-field">
              <input
                type="email"
                placeholder="Email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              />
            </div>

            <div className="input-field">
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

            <button type="submit" className="btn solid" disabled={loading}>
              {loading ? "Please wait..." : "Login"}
            </button>
          </form>

          {/* SIGNUP FORM */}
          <form className="sign-up-form" onSubmit={handleSignup}>
            <h2 className="title">Sign up</h2>
            {/* Add input fields similar to login */}
            <button type="submit" className="btn solid" disabled={loading}>
              {loading ? "Signing up..." : "Sign up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
