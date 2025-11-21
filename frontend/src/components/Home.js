// src/Home.js
import React, { useState, useEffect, useCallback } from "react";
import { FiChevronDown, FiMoon, FiSun } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Swal from "sweetalert2";
import BackgroundBeamsCollision from "./ui/background-beams-with-collision";
import Carousel from "./Carousel";
import EditProfileModal from "./student-pages/EditProfileModal";
import "../Home.css";

export default function Home() {
  // Theme state with localStorage persistence
  const storedTheme = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
  const [theme, setTheme] = useState(storedTheme || "dark");

  // Dropdown and modal state
  const [showDropdown, setShowDropdown] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  const navigate = useNavigate();

  // User state, default to guest
  const getUserFromStorage = useCallback(() => ({
    name: localStorage.getItem("name") || "Guest",
    email: localStorage.getItem("email") || "",
    profilePic: localStorage.getItem("profilePic") || null,
    suspended: localStorage.getItem("suspended") === "true",
  }), []);

  const [user, setUser] = useState(getUserFromStorage);

  // Learning highlights and resources
  const learningHighlights = [
    { value: "2K+", label: "Practice Problems", detail: "Curated MCQs and coding drills covering every topic." },
    { value: "40+", label: "Mini Projects", detail: "Apply concepts with guided builds for web & console apps." },
    { value: "24/7", label: "AI Professor", detail: "Clarify doubts instantly and rehearse interviews." },
    { value: "Weekly", label: "Test Cycles", detail: "Timed mock tests with auto evaluation and analytics." },
  ];

  const learningPlaybook = [
    {
      title: "Structured learning path",
      bullets: [
        "Language-specific playlists for Python, Java, C, and C++",
        "Visual checkpoints so you always know what's next",
        "Gamified streaks to keep you accountable",
      ],
      cta: { label: "Open Tutorials", link: "/tutorial/python" },
    },
    {
      title: "Assessment ready toolkit",
      bullets: [
        "Timed MCQ tests that mirror placement patterns",
        "Instant scorecards with weak-topic suggestions",
        "Professor chat to convert mistakes into lesson plans",
      ],
      cta: { label: "Go to Tests", link: "/tests" },
    },
  ];

  const weeklyUpdates = [
    {
      title: "Python placement sprint",
      description: "New test set with 30 MCQs + 2 debugging scenarios.",
      action: "Attempt from the Tests page → Python Sprint",
    },
    {
      title: "Live doubt room",
      description: "Prof. Meera hosts a 20-min Q&A on recursion and DP.",
      action: "Join via AI Professor > Live Sessions",
    },
    {
      title: "Project drop",
      description: "React + Express mini LMS starter kit added to projects.",
      action: "See it under Tutorials > Projects tab",
    },
  ];

  // Apply theme globally
  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  // Sync user state on localStorage change
  useEffect(() => {
    const handler = () => setUser(getUserFromStorage());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [getUserFromStorage]);

  // Safe theme toggle
  const toggleTheme = (newTheme) => setTheme(newTheme === "light" ? "light" : "dark");

  // Browse tutorials
  const handleBrowseClick = () => setShowLangModal(true);
  const handleLanguageSelect = (lang) => {
    setShowLangModal(false);
    if (lang) navigate(`/tutorial/${lang}`);
  };

  // Logout flow
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
        setUser({ name: "Guest", email: "", profilePic: null, suspended: false });
        Swal.fire("Logged out!", "You have been logged out.", "success").then(() => navigate("/auth"));
      }
    });
  };

  // Update profile callback
  const handleProfileUpdate = (updatedUser) => {
    if (!updatedUser) return;
    const merged = {
      name: updatedUser.name || "Guest",
      email: updatedUser.email || "",
      profilePic: updatedUser.profilePic || null,
      suspended: updatedUser.suspended === true,
    };

    if (merged.name) localStorage.setItem("name", merged.name);
    if (merged.email) localStorage.setItem("email", merged.email);
    if (merged.number) localStorage.setItem("email", merged.number);
    if (merged.country) localStorage.setItem("email", merged.country);
    if (merged.profilePic) localStorage.setItem("profilePic", merged.profilePic);
    else localStorage.removeItem("profilePic");

    setUser(merged);
  };

  // Access denied alert
  const showSuspendedMessage = (feature = "this feature") =>
    Swal.fire("Access Denied", `Your account is suspended. You cannot use ${feature}.`, "error");

  // Normalize profile image URL
  const profileImageSrc = (src) => {
    if (!src) return null;
    if (/^https?:\/\//i.test(src)) return src;
    if (src.startsWith("/")) return `${window.location.origin}${src}`;
    return src;
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
            <span className="nav-username">Hello, {user.name}</span>
          </div>

          <div className="right-section">
            {/* Tutorials Dropdown */}
            <div
              className="nav-link-wrapper"
              onMouseEnter={() => setShowDropdown(true)}
              onMouseLeave={() => setShowDropdown(false)}
            >
              <button className="nav-link dropdown-toggle" aria-haspopup="true" aria-expanded={showDropdown}>
                Tutorials <FiChevronDown />
              </button>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    className="dropdown-menu"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
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

          {/* AI Professor link - disabled if suspended */} {user?.suspended ? ( <button className="nav-link disabled-link" onClick={() => showSuspendedMessage("AI Professor")}>AI Professor</button> ) : ( <Link to="/professor" className="nav-link">AI Professor</Link> )}
            {/* Auth actions */}
            {user.name !== "Guest" ? (
              <button className="nav-link" onClick={handleLogout}>Logout</button>
            ) : (
              <Link className="nav-link" to="/auth">Login</Link>
            )}

            {/* Profile Button */}
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

            {/* Theme Toggle */}
            <div className={`theme-toggle ${theme}`} style={{ display: "inline-flex", alignItems: "center", marginLeft: 8 }}>
              <button onClick={() => toggleTheme("light")} className={`toggle-btn ${theme === "light" ? "active" : ""}`} title="Light mode"><FiSun /> Light</button>
              <button onClick={() => toggleTheme("dark")} className={`toggle-btn ${theme === "dark" ? "active" : ""}`} title="Dark mode"><FiMoon /> Dark</button>
              <motion.div layout transition={{ type: "spring", damping: 15, stiffness: 250 }} className={`toggle-indicator ${theme}`} />
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className={`carousel-section ${theme}`}>
          <h1 className="carousel-title">Popular Tracks</h1>
          <Carousel autoPlay autoPlayInterval={5000} />
        </div>

        {/* Main Content */}
        <div className="page-content">
          <div className={`content-text ${theme}`}>
            <h1>Welcome to DevLy</h1>
            <p>Interactive coding tutorials for Python, C, C++, and Java.</p>
            <div className="cta-buttons">
              <button className="cta-btn primary" onClick={handleBrowseClick}>Browse Tutorials</button>
            </div>
          </div>
        </div>

        {/* Highlights & Resources */}
        <section className="home-sections">
          <div className={`highlights-grid ${theme}`}>
            {learningHighlights.map((item) => (
              <div key={item.label} className={`highlight-card ${theme}`}>
                <span className="highlight-value">{item.value}</span>
                <h4>{item.label}</h4>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="home-section-grid">
            {learningPlaybook.map((section) => (
              <div key={section.title} className={`resource-card ${theme}`}>
                <h3>{section.title}</h3>
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <Link to={section.cta.link} className="cta-link">
                  {section.cta.label} →
                </Link>
              </div>
            ))}
          </div>

          <div className="home-section-grid stacked">
            <div className={`journey-panel ${theme}`}>
              <h3>Plan your week</h3>
              <p>Mix tutorials, tests, and project time to stay balanced.</p>
              <div className="journey-steps">
                <div>
                  <span className="journey-step">01</span>
                  <h5>Warm-up</h5>
                  <p>15 mins of spaced repetition quizzes to refresh syntax.</p>
                </div>
                <div>
                  <span className="journey-step">02</span>
                  <h5>Deep Work</h5>
                  <p>Pick one concept, follow the tutorial video, and note doubts.</p>
                </div>
                <div>
                  <span className="journey-step">03</span>
                  <h5>Assessment</h5>
                  <p>Attempt a module test, then review weak concepts with AI Professor.</p>
                </div>
              </div>
            </div>

            <div className={`updates-panel ${theme}`}>
              <h3>This week on DevLy</h3>
              <ul>
                {weeklyUpdates.map((update) => (
                  <li key={update.title}>
                    <h4>{update.title}</h4>
                    <p>{update.description}</p>
                    <span>{update.action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <footer style={{ textAlign: "center", padding: 16, opacity: 0.85 }}>
          <small>© {new Date().getFullYear()} DevLy • Learn. Build. Share.</small>
        </footer>
      </div>

      {/* Language Selection Modal */}
      {showLangModal && (
        <div className="modal-backdrop" onClick={() => setShowLangModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Select Language</h3>
            <ul>
              <li><button onClick={() => handleLanguageSelect("python")}>Python</button></li>
              <li><button onClick={() => handleLanguageSelect("java")}>Java</button></li>
              <li><button onClick={() => handleLanguageSelect("cpp")}>C++</button></li>
              <li><button onClick={() => handleLanguageSelect("c")}>C</button></li>
            </ul>
            <button className="modal-close" onClick={() => setShowLangModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {user.name !== "Guest" && (
        <EditProfileModal show={showModal} onClose={() => setShowModal(false)} onProfileUpdate={handleProfileUpdate} />
      )}
    </div>
  );
}

