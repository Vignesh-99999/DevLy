import React, { useEffect, useMemo, useState } from 'react';

export default function ProfessorsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  // Track row loading (edit/resign)
  const [loadingAction, setLoadingAction] = useState(null);

  const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

  // ---------------------------------------------------
  // FETCH PROFESSORS
  // ---------------------------------------------------
  async function fetchProfessors() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/professors`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to fetch");

      setItems(data.professors || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfessors();
  }, []);

  // Search filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q)
    );
  }, [items, query]);


  // ---------------------------------------------------
  // EDIT PROFESSOR
  // ---------------------------------------------------
  async function handleEdit(p) {
    try {
      let formHtml = `
        <div class="text-left">
          <div class="form-group"><label>Name</label>
            <input id="swal-name" class="form-control" value="${(p.name || '').replace(/"/g, '&quot;')}" />
          </div>
          <div class="form-group"><label>Email</label>
            <input id="swal-email" type="email" class="form-control" value="${(p.email || '').replace(/"/g, '&quot;')}" />
          </div>
          <div class="form-group"><label>Education</label>
            <input id="swal-education" class="form-control" value="${(p.education || '').replace(/"/g, '&quot;')}" />
          </div>
          <div class="form-group"><label>Subjects</label>
            <div class="d-flex flex-wrap" style="gap:8px;">
              ${['C', 'C++', 'Java', 'Python'].map(s => {
                const checked = Array.isArray(p.subjects) && p.subjects.includes(s);
                const id = `swal-sub-${s.replace('+', 'plus').toLowerCase()}`;
                return `
                  <div class="form-check form-check-inline">
                    <input id="${id}" class="form-check-input" type="checkbox" ${checked ? 'checked' : ''} />
                    <label class="form-check-label" for="${id}">${s}</label>
                  </div>`;
              }).join('')}
            </div>
          </div>
          <div class="form-group"><label>New Password (optional)</label>
            <input id="swal-password" type="password" class="form-control" placeholder="Leave blank to keep current" />
          </div>
        </div>
      `;

      const result = await window.Swal.fire({
        title: "Edit Professor",
        html: formHtml,
        focusConfirm: false,
        showCancelButton: true,
        preConfirm: () => {
          const name = document.getElementById("swal-name").value.trim();
          const email = document.getElementById("swal-email").value.trim();
          const education = document.getElementById("swal-education").value.trim();
          const password = document.getElementById("swal-password").value;

          const subjects = ['C','C++','Java','Python'].filter(s => {
            const id = `swal-sub-${s.replace('+','plus').toLowerCase()}`;
            return document.getElementById(id)?.checked;
          });

          if (!name || !email || !education) {
            window.Swal.showValidationMessage("Name, Email and Education are required");
            return false;
          }

          return { name, email, education, password, subjects };
        }
      });

      if (!result.isConfirmed) return;

      const payload = result.value;

      setLoadingAction({ id: p._id, type: "edit" });

      // Loader
      window.Swal.fire({
        title: "Updating...",
        text: "Please wait ⏳",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => window.Swal.showLoading(),
      });

      const res = await fetch(`${API}/api/professors/${p._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoadingAction(null);

      if (!res.ok) throw new Error(data.message || "Update failed");

      setItems(prev =>
        prev.map(x => x._id === p._id ? { ...x, ...payload, subjects: payload.subjects } : x)
      );

      window.Swal.fire({ icon: "success", title: "Updated", text: "Professor updated successfully" });

    } catch (err) {
      setLoadingAction(null);
      window.Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  }


  // ---------------------------------------------------
  // RESIGN PROFESSOR + EMAIL SUCCESS MESSAGE
  // ---------------------------------------------------
  async function handleResign(id) {
    const confirm = await window.Swal.fire({
      icon: "warning",
      title: "Resign Professor?",
      text: "This will remove the professor permanently.",
      showCancelButton: true,
      confirmButtonText: "Yes, resign",
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoadingAction({ id, type: "resign" });

      window.Swal.fire({
        title: "Removing...",
        text: "Please wait ⏳ (Sending Email)",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => window.Swal.showLoading(),
      });

      const res = await fetch(`${API}/api/professors/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      setLoadingAction(null);

      if (!res.ok) throw new Error(data.message || "Failed to remove");

      // UI update
      setItems(prev => prev.filter(p => p._id !== id));

      // Email status message
      let emailMessage = "";
      if (data.emailSent === true) {
        emailMessage = "Email sent successfully 🎉";
      } else if (data.emailSent === false) {
        emailMessage = "Professor removed, but email sending failed ❌";
      } else {
        emailMessage = "Professor resigned";
      }

      window.Swal.fire({
        icon: "success",
        title: "Professor Resigned",
        html: `
          <b>Professor removed successfully.</b><br>
          ${emailMessage}
        `,
      });

    } catch (err) {
      setLoadingAction(null);
      window.Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to remove",
      });
    }
  }



  // ---------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------
  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="card-title mb-0">Professors</h4>

          <div className="d-flex align-items-center">
            <input
              type="text"
              className="form-control form-control-sm mr-2"
              placeholder="Search name or email"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />

            <button
              className="btn btn-sm btn-outline-primary"
              onClick={fetchProfessors}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Education</th>
                <th>Subjects</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No professors found</td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.email}</td>
                    <td>{p.education}</td>
                    <td>{Array.isArray(p.subjects) ? p.subjects.join(", ") : ""}</td>

                    <td className="d-flex" style={{ gap: "6px" }}>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        disabled={loadingAction?.id === p._id}
                        onClick={() => handleEdit(p)}
                      >
                        {loadingAction?.id === p._id && loadingAction?.type === "edit"
                          ? <><span className="spinner-border spinner-border-sm"></span> Updating...</>
                          : "Edit"}
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        disabled={loadingAction?.id === p._id}
                        onClick={() => handleResign(p._id)}
                      >
                        {loadingAction?.id === p._id && loadingAction?.type === "resign"
                          ? <><span className="spinner-border spinner-border-sm"></span> Removing...</>
                          : "Resign"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}
