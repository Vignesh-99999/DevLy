import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import axios from "axios";
import { FiBook, FiCalendar, FiClock, FiCheckCircle, FiArrowLeft, FiPlay, FiSearch } from "react-icons/fi";
import BackgroundBeamsCollision from "../ui/background-beams-with-collision";
import "../../Home.css";


axios.defaults.baseURL = "https://devly-backend-r0xj.onrender.com"


export default function TestList() {
  const [theme, setTheme] = useState("dark");
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/student-tests/available", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTests(res.data.tests || []);
    } catch (err) {
      console.error(err);
      if ([401, 403].includes(err.response?.status)) {
        Swal.fire("Error", "Please login again", "error").then(() => {
          localStorage.clear();
          navigate("/auth");
        });
      } else {
        Swal.fire("Error", "Failed to fetch tests", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, token]);

  useEffect(() => {
    if (!token) {
      Swal.fire("Error", "Please login again", "error").then(() => navigate("/auth"));
      return;
    }
    fetchTests();
  }, [fetchTests, navigate, token]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(fetchTests, 30000);
    return () => clearInterval(interval);
  }, [fetchTests, token]);

  const canTakeTest = (test) => test.status === "Active" && !test.hasAttempted;
  const isNotAvailableYet = (test) => test.status === "Pending" && !test.hasAttempted;
  const isTimeUp = (test) => test.status === "Completed" && !test.hasAttempted;

  const formatDate = (test) => {
    if (test.startTimeIST) return test.startTimeIST;

    const [hours, minutes] = test.scheduledTime.split(":").map(Number);
    const date = new Date(test.scheduledDate);
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getSubjectLabel = (subject) => ({ c: "C", cpp: "C++", java: "Java", py: "Python" }[subject] || subject);
  const getDifficultyLabel = (difficulty) => ({ 1: "Easy", 2: "Medium", 3: "Hard" }[difficulty] || "Unknown");
  const getDifficultyColor = (difficulty) => ({ 1: "#10b981", 2: "#f59e0b", 3: "#ef4444" }[difficulty] || "#6b7280");

  const filteredTests = tests.filter((test) => {
    const query = searchQuery.toLowerCase();
    return test.title.toLowerCase().includes(query) || test.subject.toLowerCase().includes(query);
  });

  const sortedTests = [...filteredTests].sort((a, b) => {
    const statusOrder = (test) => canTakeTest(test) ? 0 : isNotAvailableYet(test) ? 1 : test.hasAttempted ? 2 : 3;
    return statusOrder(a) - statusOrder(b);
  });

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
            <span className="nav-username">Available Tests</span>
          </div>
          <div className="right-section" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ position: "relative" }}>
              <FiSearch style={{ position: "absolute", top: "50%", left: "10px", transform: "translateY(-50%)", color: "#888" }} />
              <input
                type="text"
                placeholder="Search by title or subject"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: "0.5rem 1rem 0.5rem 2.5rem", borderRadius: "10px", border: "1px solid #ccc", fontSize: "1rem" }}
              />
            </div>
            <Link to="/home" className="nav-link"><FiArrowLeft /> Back to Home</Link>
          </div>
        </div>

        <div className="dashboard-container" style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "3rem", color: theme === "dark" ? "#fff" : "#333" }}>Loading tests...</div>
            ) : sortedTests.length === 0 ? (
              <div style={{
                background: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(10px)", borderRadius: "20px", padding: "3rem", textAlign: "center", color: theme === "dark" ? "#aaa" : "#666"
              }}>
                <FiBook style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5 }} />
                <p>No tests match your search criteria.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}>
                {sortedTests.map((test) => {
                  const isAvailable = canTakeTest(test);
                  const isNotAvailable = isNotAvailableYet(test);
                  const timeUp = isTimeUp(test);
                  const isCompleted = test.hasAttempted;

                  return (
                    <motion.div
                      key={test._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        background: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)",
                        backdropFilter: "blur(10px)",
                        borderRadius: "20px",
                        padding: "1.5rem",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                        border: isCompleted ? "2px solid #10b981" : "2px solid transparent"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                        <h3 style={{ margin: 0, fontSize: "1.25rem", color: theme === "dark" ? "#fff" : "#333" }}>{test.title}</h3>
                        {isCompleted && <FiCheckCircle style={{ color: "#10b981", fontSize: "1.5rem" }} />}
                      </div>

                      {test.description && <p style={{ margin: "0 0 1rem 0", color: theme === "dark" ? "#aaa" : "#666", fontSize: "0.9rem" }}>{test.description}</p>}

                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <FiBook style={{ color: "#667eea" }} />
                          <span style={{ color: theme === "dark" ? "#aaa" : "#666" }}>Subject: <strong>{getSubjectLabel(test.subject)}</strong></span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "20px",
                            background: getDifficultyColor(test.difficulty),
                            color: "#fff",
                            fontSize: "0.85rem",
                            fontWeight: "500"
                          }}>{getDifficultyLabel(test.difficulty)}</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <FiCalendar style={{ color: "#667eea" }} />
                          <span style={{ color: theme === "dark" ? "#aaa" : "#666" }}>{formatDate(test)}</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <FiClock style={{ color: "#667eea" }} />
                          <span style={{ color: theme === "dark" ? "#aaa" : "#666" }}>Duration: {test.duration} minutes</span>
                        </div>

                          {isCompleted && test.result && (
                        <div
                          style={{
                            background: "#10b98133",
                            padding: "10px",
                            borderRadius: "10px",
                            marginTop: "10px",
                          }}
                        >
                          <b>Score:</b> {test.result.score} <br />
                          <b>Percentage:</b> {test.result.percentage}%
                        </div>
                      )}
                        
                        {!isCompleted && (
                          <button
                            onClick={() => {
                              if (isAvailable) navigate(`/take-test/${test._id}`);
                              else if (isNotAvailable)
                                Swal.fire("Test Not Available", `This test is scheduled for ${formatDate(test)}. Please wait.`, "info");
                              else if (timeUp) Swal.fire("Time Up", "The time for this test has expired.", "warning");
                            }}
                            disabled={!isAvailable}
                            style={{
                              marginTop: "1rem",
                              padding: "0.75rem 1.5rem",
                              background: isAvailable ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#6b7280",
                              color: "#fff",
                              border: "none",
                              borderRadius: "10px",
                              cursor: isAvailable ? "pointer" : "not-allowed",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.5rem",
                              fontSize: "1rem",
                              fontWeight: "500",
                              width: "100%"
                            }}
                          >
                            <FiPlay />
                            {isAvailable ? "Take Test" : timeUp ? "Time Up" : "Not Available"}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
