import React, { useMemo, useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiChevronDown, FiMoon, FiSun, FiDownload } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import Swal from "sweetalert2";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import EditProfileModal from "./student-pages/EditProfileModal";
import spinnerGif from "../images/Spinner.gif";
import "../Home.css";

// Hugging Face API
const HF_API_URL = "https://router.huggingface.co/v1/chat/completions";
const HF_API_KEY = process.env.REACT_APP_HF_API_KEY;

export default function ProfessorChat() {
  const [theme, setTheme] = useState("dark");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [language, setLanguage] = useState("python");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const [user, setUser] = useState({
    name: localStorage.getItem("name") || "Guest",
    email: localStorage.getItem("email") || "example@email.com",
    profilePic: localStorage.getItem("profilePic") || null,
  });

  useEffect(() => {
    const syncUser = () => {
      setUser({
        name: localStorage.getItem("name") || "Guest",
        email: localStorage.getItem("email") || "example@email.com",
        profilePic: localStorage.getItem("profilePic") || null,
      });
    };
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  const systemPrompt = useMemo(() => {
    return `You are an AI Professor who teaches programming concepts in ${language.toUpperCase()}.
Rules:
1. If the user greets you (hi, hello, hey, good morning, etc.), respond briefly and friendly — do NOT show any code or examples.
2. If the user asks a coding question, explain clearly and include small runnable examples.
3. Keep all answers short, focused, and educational.
4. Never assume the user wants a "Hello World" example unless they ask for it.`;
  }, [language]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(HF_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.2-1B-Instruct",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            { role: "user", content: trimmed },
          ],
        }),
      });

      if (!res.ok) throw new Error(`Hugging Face API error: ${res.statusText}`);
      const data = await res.json();
      const assistantText =
        data?.choices?.[0]?.message?.content || "No response from model.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantText },
      ]);

      // Auto-scroll
      queueMicrotask(() => {
        if (scrollRef.current)
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
    } catch (err) {
      console.error("API Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Could not reach Hugging Face API. Check your internet connection or API key.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (isLoading) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
        setUser({ name: "Guest", email: "", profilePic: null });
        Swal.fire("Logged out!", "You have been logged out.", "success");
        navigate("/auth");
      }
    });
  };

  // 🧩 DOWNLOAD CHAT FEATURE
  const handleDownload = () => {
    if (messages.length === 0) {
      Swal.fire("No conversation yet!", "Start chatting first.", "info");
      return;
    }

    const textData = messages
      .map(
        (m) =>
          `${m.role === "assistant" ? "Professor" : "You"}:\n${m.content}\n\n`
      )
      .join("");

    const blob = new Blob([textData], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `DevLy_Professor_Chat_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-")}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className={`app ${theme}`} style={{ minHeight: "100vh" }}>
      {/* Navbar */}
      <div className={`navbar ${theme}`}>
        <div className="logo-section">
          <div className="logo">DevLy</div>
          {user?.name && <span className="nav-username">Hello, {user.name}</span>}
        </div>
        <div className="right-section">
          <div
            className="nav-link-wrapper"
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <button className="nav-link dropdown-toggle">
              Tutorials <FiChevronDown />
            </button>
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  className="dropdown-menu"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="dropdown-title">Programming Languages</p>
                  <Link to="/tutorial/python" className="dropdown-item">Python</Link>
                  <Link to="/tutorial/java" className="dropdown-item">Java</Link>
                  <Link to="/tutorial/cpp" className="dropdown-item">C++</Link>
                  <Link to="/tutorial/c" className="dropdown-item">C</Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link to="/professor" className="nav-link">AI Professor</Link>
          <Link to="/tests" className="nav-link">Tests</Link>

          {user?.name !== "Guest" ? (
            <button className="nav-link" onClick={handleLogout}>Logout</button>
          ) : (
            <Link className="nav-link" to="/auth">Login</Link>
          )}

          {/* Show profile button only if not Guest */}
          {user?.name !== "Guest" && (
            <button
              className="profile-btn"
              onClick={() => setShowModal(true)}
              style={{
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #333",
                background: "#f5f5f5",
                cursor: "pointer",
                overflow: "hidden",
              }}
            >
              {user.profilePic ? (
                <img
                  src={user.profilePic}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                "👤"
              )}
            </button>
          )}

          <div className={`theme-toggle ${theme}`}>
            <button
              className={`toggle-btn ${theme === "light" ? "active" : ""}`}
              onClick={() => toggleTheme("light")}
            >
              <FiSun /> Light
            </button>
            <button
              className={`toggle-btn ${theme === "dark" ? "active" : ""}`}
              onClick={() => toggleTheme("dark")}
            >
              <FiMoon /> Dark
            </button>
            <motion.div
              layout
              transition={{ type: "spring", damping: 15, stiffness: 250 }}
              className={`toggle-indicator ${theme}`}
            />
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div style={{ display: "flex", flexDirection: "column", padding: "1rem", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ opacity: 0.85 }}>Language</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={selectStyle(theme)}>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
            </select>
          </label>

          <button onClick={handleDownload} className="cta-btn secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <FiDownload /> Download Chat
          </button>
        </div>

        <div
          ref={scrollRef}
          style={{
            flex: 1,
            height: "64vh",
            overflow: "auto",
            borderRadius: 12,
            padding: "1rem",
            background: theme === "dark" ? "#0f172a80" : "#ffffffcc",
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            border: theme === "dark" ? "1px solid rgba(51,65,85,0.6)" : "1px solid rgba(226,232,240,0.8)",
          }}
        >
          {messages.length === 0 && (
            <div style={{ opacity: 0.8 }}>
              Ask anything about algorithms, syntax, or debugging in your
              selected language. For example: "Explain recursion with a small {language.toUpperCase()} example."
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: "0.85rem", display: "flex", gap: "0.75rem" }}>
              <div style={{ fontWeight: 700, color: m.role === "assistant" ? "#22c55e" : "#60a5fa", minWidth: 86 }}>
                {m.role === "assistant" ? "Professor" : "You"}
              </div>
              <div style={{ lineHeight: 1.55 }}>
                <div className="markdown-output">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: 0.9 }}>
              <img src={spinnerGif} alt="Loading" style={{ width: 24, height: 24 }} />
              <span>Professor is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
          <textarea
            placeholder={isLoading ? "Waiting for professor..." : "Type your question and press Enter"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            disabled={isLoading}
            style={{ ...inputStyle(theme), width: "100%", resize: "vertical", minHeight: 48 }}
          />
          <button onClick={handleSend} disabled={isLoading} className="cta-btn primary" style={{ minWidth: 120 }}>
            {isLoading ? "Sending..." : "Send"}
          </button>
        </div>

        <EditProfileModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onProfileUpdate={(updatedUser) => {
            setUser(updatedUser);
            localStorage.setItem("name", updatedUser.name);
            localStorage.setItem("email", updatedUser.email);
            if (updatedUser.profilePic) {
              localStorage.setItem("profilePic", updatedUser.profilePic);
            } else {
              localStorage.removeItem("profilePic");
            }
          }}
        />
      </div>
    </div>
  );
}

function inputStyle(theme) {
  return {
    padding: "0.6rem 0.8rem",
    borderRadius: 8,
    border: theme === "dark" ? "1px solid rgba(51,65,85,0.6)" : "1px solid rgba(203,213,225,0.9)",
    background: theme === "dark" ? "#0b1220" : "#ffffff",
    color: theme === "dark" ? "#e2e8f0" : "#0f172a",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
  };
}

function selectStyle(theme) {
  return { ...inputStyle(theme), paddingRight: 28 };
}