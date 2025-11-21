import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import axios from "axios";
import { FiClock, FiCheck, FiArrowLeft } from "react-icons/fi";
import BackgroundBeamsCollision from "../ui/background-beams-with-collision";
import "../../Home.css";

// Updated TakeTest component
// - Handles multiple backend answer shapes (correctAnswer / answer)
// - Safe null checks (no test.result access)
// - Local scoring with normalized comparison
// - Sends answers array (questionId, selectedAnswer|null)
// - Shows per-question Right/Wrong result modal (no crash)

export default function TakeTest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [theme] = useState("dark");
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({}); // { [questionId]: 'a' }
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");
  const autoSubmittedRef = useRef(false);

  // AUTOSCROLL REFS
  const questionStripRef = useRef(null);
  const questionBtnRefs = useRef([]);

  useEffect(() => {
    if (!token) {
      Swal.fire("Error", "Please login again", "error").then(() => navigate("/auth"));
      return;
    }
    fetchTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  useEffect(() => {
    if (!test || !startTime) return;

    const interval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      const totalAllowed = (test.duration || 0) * 60;
      const remainingSec = totalAllowed - elapsedSec;

      setTimeRemaining(Math.max(0, remainingSec));

      if (remainingSec <= 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [test, startTime]);

  useEffect(() => {
    const btn = questionBtnRefs.current[currentQuestion];
    if (btn && btn.scrollIntoView) {
      btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [currentQuestion]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/student-tests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Safe check for already attempted: only if result is non-null/defined
      if (res.data && res.data.result !== undefined && res.data.result !== null) {
        Swal.fire("Already Attempted", "You have already taken this test.", "info").then(() => navigate("/tests"));
        return;
      }

      const serverTest = res.data?.test;
      if (!serverTest) throw new Error("Test not found in response");

      // Normalize questions so each question has a string _id and a correctAnswer field (if backend used 'answer')
      serverTest.questions = (serverTest.questions || []).map((q) => ({
        ...q,
        _id: String(q._id),
        correctAnswer: (q.correctAnswer ?? q.answer ?? q.correct) ?? null,
      }));

      setTest(serverTest);

      const now = Date.now();
      setStartTime(now);
      setTimeRemaining((serverTest.duration || 0) * 60);
    } catch (err) {
      console.error("Error fetching test:", err?.response?.data || err.message || err);
      Swal.fire("Error", err.response?.data?.message || "Failed to load test", "error").then(() => navigate("/tests"));
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, selectedAnswer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedAnswer }));
  };

  const handleNext = () => {
    if (!test) return;
    setCurrentQuestion((prev) => Math.min(prev + 1, (test.questions || []).length - 1));
  };

  const handlePrevious = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentQuestion((prev) => Math.max(prev - 1, 0));
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    await Swal.fire({ title: "Time's Up!", text: "Your test will be automatically submitted.", icon: "warning", confirmButtonText: "OK" });
    await submitTest();
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const result = await Swal.fire({
      title: "Submit Test?",
      text: "Are you sure you want to submit? You cannot change your answers.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Submit",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      await submitTest();
    }
  };

  // Helper to normalize answer string (lowercase a/b/c/d)
  const normalizeAns = (val) => {
    if (val === null || val === undefined) return null;
    return String(val).trim().toLowerCase();
  };

  const submitTest = async () => {
    try {
      setSubmitting(true);
      if (!test) throw new Error("Test not loaded");

      const totalQuestions = (test.questions || []).length;

      // Build answersArray to send to backend (questionId, selectedAnswer|null)
      const answersArray = test.questions.map((q) => ({
        questionId: q._id,
        selectedAnswer: answers[q._id] ?? null,
      }));

      const timeTaken = Math.floor((Date.now() - startTime) / 1000 / 60);

      const response = await axios.post(
        `http://localhost:5000/api/student-tests/${id}/submit`,
        { answers: answersArray, timeTaken },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const serverResult = response.data?.result;
      const perQuestion =
        serverResult?.answers?.map((ans) => ({
          questionId: ans.questionId,
          isCorrect: !!ans.isCorrect,
        })) || [];

      let html;
      if (perQuestion.length) {
        html = '<div style="text-align:left; max-height: 50vh; overflow:auto;">';
        perQuestion.forEach((p, idx) => {
          html += `<div style="margin-bottom:6px; font-weight:600;">Q${idx + 1}: ${p.isCorrect ? "✔️ Right" : "❌ Wrong"}</div>`;
        });
        html += "</div>";
      } else {
        html = `<p style="text-align:left;">Score: ${serverResult?.score ?? 0}/${serverResult?.totalQuestions ?? totalQuestions}</p>`;
      }

      await Swal.fire({ title: "Test Submitted!", html, icon: "success", confirmButtonText: "View Results" });

      navigate("/tests");
    } catch (err) {
      console.error("Error submitting test:", err?.response?.data || err.message || err);
      Swal.fire("Error", err.response?.data?.message || err.message || "Failed to submit test", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (sec) => {
    const s = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className={`app ${theme}`}>
        <div className="main-content">
          <div className="page-background">
            <BackgroundBeamsCollision />
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: theme === "dark" ? "#fff" : "#333" }}>
            Loading test...
          </div>
        </div>
      </div>
    );
  }

  if (!test) return null;

  const currentQ = test.questions[currentQuestion] || { options: {} };
  const answeredCount = Object.values(answers).filter((v) => v !== null && v !== undefined).length;
  const totalQuestions = (test.questions || []).length;

  return (
    <div className={`app ${theme}`}>
      <div className="main-content">
        <div className="page-background">
          <BackgroundBeamsCollision />
        </div>

        {/* Header */}
        <div style={{ background: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(10px)", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}` }}>
          <div>
            <h2 style={{ margin: 0, color: theme === "dark" ? "#fff" : "#333" }}>{test.title}</h2>
            <p style={{ margin: "0.25rem 0 0 0", color: theme === "dark" ? "#aaa" : "#666" }}>Question {currentQuestion + 1} of {totalQuestions}</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: timeRemaining < 60 ? "#ef4444" : theme === "dark" ? "#fff" : "#333" }}>
                <FiClock />
                <strong>{formatTime(timeRemaining)}</strong>
              </div>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: theme === "dark" ? "#aaa" : "#666" }}>{answeredCount}/{totalQuestions} answered</p>
            </div>

            <button onClick={() => { if (!submitting) navigate("/tests"); }} style={{ padding: "0.5rem 1rem", background: "transparent", border: `1px solid ${theme === "dark" ? "#fff" : "#333"}`, color: theme === "dark" ? "#fff" : "#333", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FiArrowLeft /> Exit
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
          <motion.div key={currentQuestion} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ background: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(10px)", borderRadius: "20px", padding: "2rem", marginBottom: "2rem" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: theme === "dark" ? "#fff" : "#333" }}>{currentQ.question}</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              { ["a","b","c","d"].map((option) => (
                <label key={option} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "10px", background: answers[currentQ._id] === option ? (theme === "dark" ? "rgba(102, 126, 234, 0.2)" : "rgba(102, 126, 234, 0.1)") : (theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"), border: `2px solid ${answers[currentQ._id] === option ? "#667eea" : "transparent"}`, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { if (answers[currentQ._id] !== option) e.currentTarget.style.background = theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0,0,0,0.1)" }}
                  onMouseLeave={(e) => { if (answers[currentQ._id] !== option) e.currentTarget.style.background = theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0,0,0,0.05)" }}>
                  <input type="radio" name={`question-${currentQ._id}`} value={option} checked={answers[currentQ._id] === option} onChange={() => handleAnswerChange(currentQ._id, option)} style={{ width: "20px", height: "20px", cursor: "pointer" }} />
                  <span style={{ color: theme === "dark" ? "#fff" : "#333", flex: 1 }}><strong>{option.toUpperCase()}.</strong> {currentQ.options?.[option]}</span>
                  {answers[currentQ._id] === option && <FiCheck style={{ color: "#667eea" }} />}
                </label>
              )) }
            </div>
          </motion.div>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button onClick={handlePrevious} style={{ padding: "0.75rem 1.5rem", background: currentQuestion === 0 ? "#6b7280" : "#667eea", color: "#fff", border: "none", borderRadius: "10px", cursor: currentQuestion === 0 ? "not-allowed" : "pointer", opacity: currentQuestion === 0 ? 0.5 : 1, pointerEvents: currentQuestion === 0 ? "none" : "auto", zIndex: 10 }}>Previous</button>

            {/* Question number strip */}
            <div ref={questionStripRef} style={{ display: "flex", gap: "0.5rem", flex: "1", minWidth: "0", maxWidth: "100%", overflowX: "auto", overflowY: "hidden", padding: "0.5rem", justifyContent: "flex-start", scrollbarWidth: "thin", scrollbarColor: theme === "dark" ? "#667eea #2a2a2a" : "#667eea #f0f0f0", WebkitOverflowScrolling: "touch", zIndex: 10 }}>
              {test.questions.map((q, idx) => (
                <button key={q._id} ref={(el) => (questionBtnRefs.current[idx] = el)} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentQuestion(idx); }} style={{ width: "40px", height: "40px", minWidth: "40px", borderRadius: "8px", border: `2px solid ${answers[q._id] ? "#10b981" : currentQuestion === idx ? "#667eea" : theme === "dark" ? "#fff" : "#333"}`, background: currentQuestion === idx ? "#667eea" : answers[q._id] ? "rgba(16, 185, 129, 0.2)" : "transparent", color: currentQuestion === idx ? "#fff" : answers[q._id] ? "#10b981" : theme === "dark" ? "#fff" : "#333", cursor: "pointer", fontWeight: "600", flexShrink: 0, pointerEvents: "auto", zIndex: 10 }}>{idx + 1}</button>
              ))}
            </div>

            {currentQuestion === totalQuestions - 1 ? (
              <button onClick={handleSubmit} disabled={submitting} style={{ padding: "0.75rem 1.5rem", background: submitting ? "#6b7280" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", border: "none", borderRadius: "10px", cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 10 }}>{submitting ? "Submitting..." : (<><FiCheck /> Submit Test</>)}</button>
            ) : (
              <button onClick={handleNext} style={{ padding: "0.75rem 1.5rem", background: "#667eea", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", zIndex: 10 }}>Next</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
