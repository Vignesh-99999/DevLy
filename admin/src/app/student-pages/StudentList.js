// src/app/student-pages/StudentList.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

axios.defaults.baseURL = "https://devly-backend-r0xj.onrender.com";

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUser, setLoadingUser] = useState(null);

  // FETCH STUDENTS
  const fetchStudents = async () => {
    try {
      const res = await axios.get(`/api/admin/users`);
      setStudents(res.data || []);
    } catch (err) {
      console.error(err);
      alert("❌ Could not load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // SUSPEND USER
  const handleSuspend = async (id) => {
    try {
      const res = await axios.patch(`/api/admin/users/${id}/toggle-suspend`);
      if (!res.data.success) return alert("Suspend failed");

      setStudents((prev) =>
        prev.map((s) =>
          s._id === id ? { ...s, isSuspended: res.data.isSuspended } : s
        )
      );
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  // BAN USER
  const handleBan = async (id) => {
    try {
      const res = await axios.patch(`/api/admin/users/${id}/toggle-ban`);
      if (!res.data.success) return alert("Ban failed");

      setStudents((prev) =>
        prev.map((s) => (s._id === id ? { ...s, isBanned: res.data.isBanned } : s))
      );
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  // PROMOTE USER
  const handlePromote = async (student) => {
    const { value: form } = await Swal.fire({
      title: "👨‍🏫 Promote to Professor",
      html: `
        <h6>Select Subjects</h6>
        <div style="text-align:left;margin-left:30px">
          <input type="checkbox" id="c" value="C"> <label for="c">C</label><br>
          <input type="checkbox" id="cpp" value="C++"> <label for="cpp">C++</label><br>
          <input type="checkbox" id="java" value="Java"> <label for="java">Java</label><br>
          <input type="checkbox" id="python" value="Python"> <label for="python">Python</label><br>
        </div>
        <br>
        <label>Education</label>
        <input id="edu" class="swal2-input" placeholder="Education (e.g. MCA, BCA)">
      `,
      confirmButtonText: "Promote 🚀",
      showCancelButton: true,
      preConfirm: () => {
        const subjects = [];
        if (document.getElementById("c").checked) subjects.push("C");
        if (document.getElementById("cpp").checked) subjects.push("C++");
        if (document.getElementById("java").checked) subjects.push("Java");
        if (document.getElementById("python").checked) subjects.push("Python");

        const education = document.getElementById("edu").value.trim();

        if (subjects.length === 0) {
          Swal.showValidationMessage("✔ Select at least one subject");
          return false;
        }
        if (!education) {
          Swal.showValidationMessage("✔ Education is required");
          return false;
        }

        return { subjects, education };
      },
    });

    if (!form) return;

    setLoadingUser(student._id);

    Swal.fire({
      title: "Sending Email...",
      text: "Please wait ⏳",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await axios.post(`/api/admin/users/${student._id}/promote`, form);

      setLoadingUser(null);

      if (!res.data.success)
        return Swal.fire({
          icon: "warning",
          title: "Already Promoted",
          text: res.data.message || "This student is already a Professor.",
        });

      setStudents((prev) =>
        prev.map((s) =>
          s._id === student._id ? { ...s, role: "professor", isProfessor: true } : s
        )
      );

      Swal.fire({
        icon: "success",
        title: "🎉 Promotion Successful!",
        html: `<b>${student.name}</b> has been promoted to Professor. <br><br>📧 <b>Email sent successfully!</b>`,
      });
    } catch (err) {
      setLoadingUser(null);

      const status = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 409) {
        return Swal.fire({
          icon: "info",
          title: "Already Promoted 👨‍🏫",
          text: message || "This student is already a Professor.",
        });
      }

      Swal.fire({
        icon: "error",
        title: "Promotion Failed ❌",
        text: "Server error or email failed.",
      });
    }
  };

  // UI
  if (loading) return <p className="text-center mt-5">⏳ Loading Students...</p>;

  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h4>📚 Student Management</h4>
          <button className="btn btn-light btn-sm" onClick={fetchStudents}>
            🔄 Refresh
          </button>
        </div>

        <div className="card-body">
          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th>👤 Name</th>
                <th>📧 Email</th>
                <th>📌 Status</th>
                <th>⛔ Suspend</th>
                <th>🚫 Ban</th>
                <th>⭐ Promote</th>
              </tr>
            </thead>

            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>
                    {s.role === "professor" || s.isProfessor ? (
                      <span className="badge bg-info text-dark">👨‍🏫 Professor</span>
                    ) : s.isSuspended ? (
                      <span className="badge bg-danger">❗ Suspended</span>
                    ) : s.isBanned ? (
                      <span className="badge bg-warning text-dark">⚠️ Banned</span>
                    ) : (
                      <span className="badge bg-success">✅ Active</span>
                    )}
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${s.isSuspended ? "btn-success" : "btn-danger"}`}
                      onClick={() => handleSuspend(s._id)}
                    >
                      {s.isSuspended ? "Unsuspend ✔" : "Suspend 🔒"}
                    </button>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${s.isBanned ? "btn-success" : "btn-warning"}`}
                      onClick={() => handleBan(s._id)}
                    >
                      {s.isBanned ? "Unban ✔" : "Ban 🚫"}
                    </button>
                  </td>
                  <td>
                    {s.role === "professor" || s.isProfessor ? (
                      <button className="btn btn-sm btn-secondary" disabled>
                        👨‍🏫 Promoted
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        disabled={loadingUser === s._id || s.isSuspended || s.isBanned}
                        onClick={() => handlePromote(s)}
                      >
                        {loadingUser === s._id
                          ? <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Promoting...
                            </>
                          : s.isSuspended
                          ? "Suspended ❌"
                          : s.isBanned
                          ? "Banned ❌"
                          : "Promote ⭐"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
