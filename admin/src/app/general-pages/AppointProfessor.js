import React, { useState } from 'react';
import './AppointProfessor.css';


const SUBJECTS = [
  { key: 'C', label: 'C' },
  { key: 'C++', label: 'C++' },
  { key: 'Java', label: 'Java' },
  { key: 'Python', label: 'Python' },
];

export default function AppointProfessor() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    education: '',
    subjects: [],
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  // function toggleSubject(subject) {
  //   setForm(prev => {
  //     const exists = prev.subjects.includes(subject);
  //     return {
  //       ...prev,
  //       subjects: exists ? prev.subjects.filter(s => s !== subject) : [...prev.subjects, subject],
  //     };
  //   });
  // }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(process.env.REACT_APP_API_BASE ? `${process.env.REACT_APP_API_BASE}/api/professors` : `http://localhost:5000/api/professors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

        const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to create professor');

      // Compose SweetAlert message
      let swalText = 'Professor appointed successfully.';
      if (data.emailStatus === 'success') {
        swalText += '\n✅ Appointment email sent successfully.';
      } else {
        swalText += '\n⚠️ Appointment email could not be sent.';
      }

      if (window.Swal) {
        window.Swal.fire({ icon: 'success', title: 'Success', text: swalText });
      }

      // Reset form
      setForm({ name: '', email: '', password: '', education: '', subjects: [] });
    } catch (err) {
      if (window.Swal) {
        window.Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Something went wrong' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card appoint-professor">
      <div className="card-body">
        <h4 className="card-title">Appoint Professor</h4>
        <form className="forms-sample" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" className="form-control" value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="Enter name" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-control" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="Enter email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" value={form.password} onChange={e => updateField('password', e.target.value)} placeholder="Enter password" required />
          </div>
          <div className="form-group">
            <label>Education</label>
            <input type="text" className="form-control" value={form.education} onChange={e => updateField('education', e.target.value)} placeholder="e.g., M.Tech, PhD" required />
          </div>
          <div className="form-group">
  <label>Subjects</label>
  <div className="subject-group d-flex flex-wrap">
    {SUBJECTS.map((s) => {
      const id = `subject-${s.key.replace(/\+/g, "plus").toLowerCase()}`;
      const checked = form.subjects.includes(s.key);
      return (
        <div className="form-check mr-3 mb-2" key={s.key}>
          <input
            id={id}
            type="checkbox"
            className="form-check-input"
            checked={checked}
            onChange={(e) => {
              const isChecked = e.target.checked;
              setForm((prev) => ({
                ...prev,
                subjects: isChecked
                  ? [...prev.subjects, s.key]
                  : prev.subjects.filter((x) => x !== s.key),
              }));
            }}
          />
          <label htmlFor={id} className="form-check-label ml-2">
            {s.label}
          </label>
        </div>
      );
    })}
  </div>
</div>
          <button type="submit" className="btn btn-primary mr-2" disabled={loading}>{loading ? 'Saving...' : 'Appoint'}</button>
        </form>
        {message ? <p className="mt-3">{message}</p> : null}
      </div>
    </div>
  );
}


