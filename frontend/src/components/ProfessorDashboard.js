// src/components/ProfessorDashboard.js
import React, { useState, useEffect } from "react";
import {
  FiMoon,
  FiSun,
  FiUser,
  FiBook,
  FiMail,
  FiLogOut,
  FiEdit2,
} from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Swal from "sweetalert2";
import axios from "axios";
import BackgroundBeamsCollision from "./ui/background-beams-with-collision";
import "../Home.css";


axios.defaults.baseURL = "https://devly-backend-r0xj.onrender.com"


export default function ProfessorDashboard() {
  const [theme, setTheme] = useState("dark");
  const [showEditModal, setShowEditModal] = useState(false);
  const [professor, setProfessor] = useState({
    name: localStorage.getItem("name") || "Professor",
    email: localStorage.getItem("email") || "professor@email.com",
    education: "",
    subjects: [],
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    education: "",
    subjects: [],
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Fetch professor data on mount
  useEffect(() => {
    const fetchProfessorData = async () => {
      try {
        if (!token) {
          Swal.fire("Error", "Please login again", "error").then(() => {
            navigate("/auth");
          });
          return;
        }

        const res = await axios.get(`/api/professors/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data) {
          setProfessor({
            name: res.data.name,
            email: res.data.email,
            education: res.data.education,
            subjects: res.data.subjects || [],
          });
          setEditForm({
            name: res.data.name,
            email: res.data.email,
            education: res.data.education,
            subjects: res.data.subjects || [],
          });
          localStorage.setItem("name", res.data.name);
          localStorage.setItem("email", res.data.email);
        }
      } catch (err) {
        console.error("Error fetching professor data:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          Swal.fire("Error", "Please login again", "error").then(() => {
            localStorage.clear();
            navigate("/auth");
          });
        }
      }
    };

    fetchProfessorData();
  }, [navigate, token]);

  const toggleTheme = (newTheme) => setTheme(newTheme);

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        Swal.fire("Logged out!", "You have been logged out.", "success");
        navigate("/auth");
      }
    });
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      if (!token) {
        return Swal.fire("Error", "Please login again", "error");
      }

      const res = await axios.put(
        `/api/professors/profile`,
        {
          name: editForm.name,
          email: editForm.email,
          education: editForm.education,
          subjects: editForm.subjects,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.professor) {
        setProfessor({
          name: res.data.professor.name,
          email: res.data.professor.email,
          education: res.data.professor.education,
          subjects: res.data.professor.subjects || [],
        });
        localStorage.setItem("name", res.data.professor.name);
        localStorage.setItem("email", res.data.professor.email);
      }

      Swal.fire("Success", "Profile updated successfully", "success");
      setShowEditModal(false);
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Failed to update profile", "error");
    }
  };

  const toggleSubject = (subject) => {
    const subjects = editForm.subjects.includes(subject)
      ? editForm.subjects.filter((s) => s !== subject)
      : [...editForm.subjects, subject];
    setEditForm({ ...editForm, subjects });
  };

  return (
    <div className={`app ${theme}`}>
      <div className="main-content">
        <div className="page-background">
          <BackgroundBeamsCollision />
        </div>

        {/* Navbar */}
        <div className={`navbar ${theme}`}>
          <div className="logo-section">
            <div className="logo">DevLy</div>
            {professor?.name && <span className="nav-username">Hello, Prof. {professor.name}</span>}
          </div>

          <div className="right-section">
            <Link to="/test-management" className="nav-link">
              Manage Tests
            </Link>

            <button className="nav-link" onClick={handleEditProfile}>
              <FiEdit2 /> Edit Profile
            </button>

            <button
              className="theme-toggle"
              onClick={() => toggleTheme(theme === "dark" ? "light" : "dark")}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <FiSun /> : <FiMoon />}
            </button>

            <button className="nav-link logout-btn" onClick={handleLogout}>
              <FiLogOut /> Logout
            </button>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div
          className="dashboard-container"
          style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1
              style={{
                fontSize: "2.5rem",
                marginBottom: "2rem",
                color: theme === "dark" ? "#fff" : "#333",
              }}
            >
              Professor Dashboard
            </h1>

            {/* Profile Card */}
            <div
              className="profile-card"
              style={{
                background:
                  theme === "dark"
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)",
                borderRadius: "20px",
                padding: "2rem",
                marginBottom: "2rem",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                    color: "#fff",
                  }}
                >
                  <FiUser />
                </div>
                <div>
                  <h2 style={{ margin: 0, color: theme === "dark" ? "#fff" : "#333" }}>
                    Prof. {professor.name}
                  </h2>
                  <p style={{ margin: "0.5rem 0 0 0", color: theme === "dark" ? "#aaa" : "#666" }}>
                    Professor
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "1.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <FiMail style={{ fontSize: "1.5rem", color: "#667eea" }} />
                  <div>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: theme === "dark" ? "#aaa" : "#666" }}>
                      Email
                    </p>
                    <p
                      style={{
                        margin: "0.25rem 0 0 0",
                        color: theme === "dark" ? "#fff" : "#333",
                      }}
                    >
                      {professor.email}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <FaGraduationCap style={{ fontSize: "1.5rem", color: "#667eea" }} />
                  <div>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: theme === "dark" ? "#aaa" : "#666" }}>
                      Education
                    </p>
                    <p
                      style={{
                        margin: "0.25rem 0 0 0",
                        color: theme === "dark" ? "#fff" : "#333",
                      }}
                    >
                      {professor.education || "Not specified"}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                  <FiBook
                    style={{
                      fontSize: "1.5rem",
                      color: "#667eea",
                      marginTop: "0.25rem",
                    }}
                  />
                  <div>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: theme === "dark" ? "#aaa" : "#666" }}>
                      Subjects
                    </p>
                    <div
                      style={{
                        marginTop: "0.5rem",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      {professor.subjects && professor.subjects.length > 0 ? (
                        professor.subjects.map((subject, idx) => (
                          <span
                            key={idx}
                            style={{
                              background:
                                "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                              color: "#fff",
                              padding: "0.25rem 0.75rem",
                              borderRadius: "20px",
                              fontSize: "0.85rem",
                            }}
                          >
                            {subject}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: theme === "dark" ? "#aaa" : "#666" }}>
                          No subjects assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {showEditModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: theme === "dark" ? "#1a1a1a" : "#fff",
                  borderRadius: "20px",
                  padding: "1.5rem",
                  maxWidth: "400px",
                  width: "90%",
                  maxHeight: "85vh",
                  overflow: "auto",
                }}
              >
                <h2 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.5rem", color: theme === "dark" ? "#fff" : "#333" }}>
                  Edit Profile
                </h2>

                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem", color: theme === "dark" ? "#fff" : "#333" }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      background: theme === "dark" ? "#2a2a2a" : "#fff",
                      color: theme === "dark" ? "#fff" : "#333",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem", color: theme === "dark" ? "#fff" : "#333" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      background: theme === "dark" ? "#2a2a2a" : "#fff",
                      color: theme === "dark" ? "#fff" : "#333",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem", color: theme === "dark" ? "#fff" : "#333" }}>
                    Education
                  </label>
                  <input
                    type="text"
                    value={editForm.education}
                    onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      borderRadius: "8px",
                      border: "1px solid #ddd",
                      background: theme === "dark" ? "#2a2a2a" : "#fff",
                      color: theme === "dark" ? "#fff" : "#333",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.9rem", color: theme === "dark" ? "#fff" : "#333" }}>
                    Subjects
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {["C", "C++", "Java", "Python"].map((subject) => (
                      <button
                        key={subject}
                        onClick={() => toggleSubject(subject)}
                        style={{
                          padding: "0.4rem 0.8rem",
                          borderRadius: "20px",
                          border: "none",
                          background: editForm.subjects.includes(subject)
                            ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                            : theme === "dark"
                            ? "#2a2a2a"
                            : "#f0f0f0",
                          color: editForm.subjects.includes(subject)
                            ? "#fff"
                            : theme === "dark"
                            ? "#fff"
                            : "#333",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          fontSize: "0.85rem",
                        }}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setShowEditModal(false)}
                    style={{
                      padding: "0.6rem 1.2rem",
                      borderRadius: "8px",
                      border: "none",
                      background: theme === "dark" ? "#2a2a2a" : "#f0f0f0",
                      color: theme === "dark" ? "#fff" : "#333",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    style={{
                      padding: "0.6rem 1.2rem",
                      borderRadius: "8px",
                      border: "none",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}