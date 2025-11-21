import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:5000/api/tests";

export default function TestManagement() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTest, setSelectedTest] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const token = localStorage.getItem("token");

  // ✅ Form data for creating test
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "c",
    difficulty: 1,
    scheduledDate: "",
    scheduledTime: "",
    duration: "",
    totalQuestions: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      subject: "c",
      difficulty: 1,
      scheduledDate: "",
      scheduledTime: "",
      duration: "",
      totalQuestions: "",
    });
  };

  // ✅ Fetch all tests
  const fetchTests = async () => {
    try {
      const res = await axios.get(API_BASE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTests(res.data.tests || []);
    } catch (err) {
      console.error("Error fetching tests:", err);
      Swal.fire("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  const filteredTests = tests.filter((test) => {
  const query = searchQuery.toLowerCase();
  return (
    test.title.toLowerCase().includes(query) ||
    (test.description?.toLowerCase().includes(query)) ||
    (test.subject?.toLowerCase().includes(query)) ||
    (test.status?.toLowerCase().includes(query))
  );
});

  useEffect(() => {
    fetchTests();
    const interval = setInterval(fetchTests, 60000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Create new test
  const handleCreateTest = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(API_BASE, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire("Success!", res.data.message || "Test created successfully!", "success");
      setShowCreateModal(false);
      resetForm();
      fetchTests();
    } catch (err) {
      console.error("Error creating test:", err);
      Swal.fire("Error", err.response?.data?.message || "Error creating test", "error");
    }
  };

  // ✅ Edit Test
  const handleEditTest = (test) => {
    setSelectedTest(test);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_BASE}/${selectedTest._id}`, selectedTest, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire("Success!", res.data.message || "Test updated successfully!", "success");
      setShowEditModal(false);
      fetchTests();
    } catch (err) {
      console.error("Update error:", err);
      Swal.fire("Error", err.response?.data?.message || "Error updating test", "error");
    }
  };

  // ✅ Delete Test
  const handleDeleteTest = async (id) => {
    if (!Swal.fire("Are you sure you want to delete test?")) return;
    try {
      const res = await axios.delete(`${API_BASE}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Swal.fire("Deleted!", res.data.message || "Test deleted successfully!", "success");
      fetchTests();
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire("Error", err.response?.data?.message || "Error deleting test", "error");
    }
  };

  // ✅ Status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" };
      case "Active":
        return { bg: "rgba(16,185,129,0.15)", color: "#10b981" };
      case "Completed":
        return { bg: "rgba(239,68,68,0.15)", color: "#ef4444" };
      default:
        return { bg: "rgba(107,114,128,0.15)", color: "#9ca3af" };
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", color: "#fff", paddingTop: "50px" }}>
        Loading tests...
      </div>
    );

  return (
    <div
      style={{
        background: "radial-gradient(circle at top, #0f172a, #020617)",
        minHeight: "100vh",
        padding: "3rem 2rem",
      }}
    >
      {/* ✅ Navbar */}
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    gap: "1rem",
    flexWrap: "wrap",
  }}
>
  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
    <a
      href="/professor-dashboard"
      style={{
        color: "#3b82f6",
        textDecoration: "none",
        fontWeight: "bold",
      }}
    >
      &larr; Back to Dashboard
    </a>
    <h1 style={{ color: "#fff", fontSize: "2rem", margin: 0 }}>Test Management</h1>
  </div>

  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
    <input
      type="text"
      placeholder="Search tests..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      style={{
        padding: "0.5rem 1rem",
        borderRadius: "10px",
        border: "1px solid #475569",
        background: "#0f172a",
        color: "#fff",
        outline: "none",
      }}
    />
    <button
      onClick={() => {
        resetForm();
        setShowCreateModal(true);
      }}
      style={{
        background: "#3b82f6",
        color: "#fff",
        padding: "0.6rem 1.2rem",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        border: "none",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      <FiPlus /> Schedule New Test
    </button>
  </div>
</div>


      {/* ✅ Test Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {filteredTests.map((test) => {
          const { bg, color } = getStatusColor(test.status);
          const canEditDelete = test.status === "Pending";

          return (
            <motion.div
              key={test._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "20px",
                padding: "1.5rem",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                color: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ color: "#fff", textTransform: "uppercase" }}>{test.title}</h3>
                {canEditDelete && (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleEditTest(test)}
                      style={iconButton}
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => handleDeleteTest(test._id)}
                      style={{ ...iconButton, color: "#ef4444" }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                )}
              </div>

              <p style={{ color: "#aaa" }}>{test.description}</p>
              <p style={{ color: "#aaa" }}>Subject: {test.subject?.toUpperCase()}</p>
              <p style={{ color: "#aaa" }}>Date: {new Date(test.scheduledDate).toDateString()}</p>
              <p style={{ color: "#aaa" }}>Time: {test.scheduledTime}</p>
              <p style={{ color: "#aaa" }}>Duration: {test.duration} min</p>
              <p style={{ color: "#aaa" }}>Total Questions: {test.totalQuestions}</p>

              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.5rem",
                  borderRadius: "8px",
                  background: bg,
                  color,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                {test.status}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 🧾 Create Test Modal */}
      {showCreateModal && (
        <ModalWrapper onClose={() => { setShowCreateModal(false); resetForm(); }}>
          <h2>Schedule New Test</h2>
          <form onSubmit={handleCreateTest}>
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              style={inputStyle}
            />
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <label>Subject *</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              style={inputStyle}
            >
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="py">Python</option>
            </select>
            <label>Difficulty *</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: Number(e.target.value) })}
                style={inputStyle}
                required>
                <option value={1}>Easy</option>
                <option value={2}>Medium</option>
                <option value={3}>Hard</option>
              </select>
            <label>Date *</label>
<input
  type="date"
  value={formData.scheduledDate}
  min={new Date().toISOString().split("T")[0]} // 🚫 Prevent past days
  onChange={(e) => {
    const newDate = e.target.value;
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // If today is selected, ensure time isn't past current time
    if (newDate === today && formData.scheduledTime) {
      const selectedDateTime = new Date(`${newDate}T${formData.scheduledTime}`);
      if (selectedDateTime < now) {
        const currentTime = now.toTimeString().slice(0, 5);
        setFormData({ ...formData, scheduledDate: newDate, scheduledTime: currentTime });
        return;
      }
    }
    setFormData({ ...formData, scheduledDate: newDate });
  }}
  required
  style={inputStyle}
/>

<label>Time *</label>
<input
  type="time"
  value={formData.scheduledTime}
  onChange={(e) => {
    const newTime = e.target.value;
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const selectedDate = formData.scheduledDate;

    if (selectedDate === today) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const selectedDateTime = new Date();
      selectedDateTime.setHours(hours, minutes, 0, 0);

      if (selectedDateTime < now) {
        const currentTime = now.toTimeString().slice(0, 5);
        alert("You cannot pick a past time today. Adjusted to current time.");
        setFormData({ ...formData, scheduledTime: currentTime });
        return;
      }
    }

    setFormData({ ...formData, scheduledTime: newTime });
  }}
  required
  style={inputStyle}
/>
            <label>Duration (minutes)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              style={inputStyle}
            />
            <label>Total Questions</label>
            <input
              type="number"
              value={formData.totalQuestions}
              onChange={(e) => setFormData({ ...formData, totalQuestions: e.target.value })}
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button type="button" onClick={() => setShowCreateModal(false)} style={cancelBtn}>
                Cancel
              </button>
              <button type="submit" style={saveBtn}>
                Create
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}

      {/* ✏️ Edit Modal */}
{showEditModal && selectedTest && (
  <ModalWrapper onClose={() => setShowEditModal(false)}>
    <h3>Edit Test</h3>
    <form onSubmit={handleEditSubmit}>
      <label>Title *</label>
      <input
        type="text"
        value={selectedTest.title}
        onChange={(e) =>
          setSelectedTest({ ...selectedTest, title: e.target.value })
        }
        placeholder="Title"
        style={inputStyle}
        required
      />

      <label>Description</label>
      <textarea
        value={selectedTest.description}
        onChange={(e) =>
          setSelectedTest({ ...selectedTest, description: e.target.value })
        }
        placeholder="Description"
        style={{ ...inputStyle, height: "80px" }}
      />

      <label>Difficulty *</label>
        <select
          value={selectedTest.difficulty}
          onChange={(e) =>
            setSelectedTest({ ...selectedTest, difficulty: Number(e.target.value) })
          }
          style={inputStyle}
          required
        >
          <option value={1}>Easy</option>
          <option value={2}>Medium</option>
          <option value={3}>Hard</option>
        </select>

      <label>Date *</label>
      <input
        type="date"
        value={selectedTest.scheduledDate?.split("T")[0]}
        onChange={(e) =>
          setSelectedTest({ ...selectedTest, scheduledDate: e.target.value })
        }
        style={inputStyle}
        required
      />

      <label>Time *</label>
      <input
        type="time"
        value={selectedTest.scheduledTime}
        onChange={(e) =>
          setSelectedTest({ ...selectedTest, scheduledTime: e.target.value })
        }
        style={inputStyle}
        required
      />

      <label>Duration (minutes)</label>
      <input
        type="number"
        value={selectedTest.duration}
        onChange={(e) =>
          setSelectedTest({ ...selectedTest, duration: e.target.value })
        }
        placeholder="Duration"
        style={inputStyle}
      />

      <label>Total Questions</label>
      <input
        type="number"
        value={selectedTest.totalQuestions}
        onChange={(e) =>
          setSelectedTest({ ...selectedTest, totalQuestions: e.target.value })
        }
        placeholder="Total Questions"
        style={inputStyle}
      />

      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="submit" style={saveBtn}>Save</button>
        <button
          type="button"
          onClick={() => setShowEditModal(false)}
          style={cancelBtn}
        >
          Cancel
        </button>
      </div>
    </form>
  </ModalWrapper>
)}
    </div>
  );
}

// 🔹 Reusable modal wrapper
const ModalWrapper = ({ children, onClose }) => (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}
    onClick={onClose}
  >
    <div
      style={{
        background: "#1e293b",
        padding: "2rem",
        borderRadius: "10px",
        width: "400px",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        color: "white",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

const inputStyle = {
  padding: "0.5rem",
  borderRadius: "5px",
  border: "1px solid #475569",
  background: "#0f172a",
  color: "#fff",
  width: "100%",
};

const iconButton = {
  background: "transparent",
  border: "none",
  color: "#fff",
  cursor: "pointer",
};

const saveBtn = {
  flex: 1,
  background: "#3b82f6",
  border: "none",
  padding: "0.5rem",
  color: "#fff",
  borderRadius: "5px",
  cursor: "pointer",
};

const cancelBtn = {
  flex: 1,
  background: "#ef4444",
  border: "none",
  padding: "0.5rem",
  color: "#fff",
  borderRadius: "5px",
  cursor: "pointer",
};
