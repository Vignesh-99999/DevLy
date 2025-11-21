// src/student-pages/EditProfileModal.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "./EditProfile.css";

axios.defaults.baseURL = "https://devly-backend-r0xj.onrender.com"


export default function EditProfileModal({ show, onClose, onProfileUpdate }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    number: "",
    country: "",
    password: "",
    profilePic: null,
  });

  const [previewPic, setPreviewPic] = useState(null);

  useEffect(() => {
    if (!show) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    axios
      .get("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const u = res.data;
        setFormData({
          name: u.name || "",
          email: u.email || "",
          number: u.number || "",
          country: u.country || "",
          password: "",
          profilePic: u.profilePic || null,
        });
        setPreviewPic(u.profilePic ? `${u.profilePic}` : null);
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
        if (err.response?.status === 401) {
          Swal.fire("Session expired", "Please login again", "warning").then(() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          });
        }
      });
  }, [show]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFormData({ ...formData, profilePic: file });
    setPreviewPic(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      Swal.fire("Unauthorized", "Please login first", "error");
      return;
    }

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("number", formData.number);
      data.append("country", formData.country);

      // if (formData.password && formData.password.trim() !== "") {
      //   data.append("password", formData.password);
      // }

      if (formData.profilePic instanceof File) {
        data.append("profilePic", formData.profilePic);
      }

      const res = await axios.put("/api/users/profile", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      Swal.fire("Success", "Profile updated", "success").then(() => {
        if (onProfileUpdate) {
          onProfileUpdate({
            name: formData.name,
            email: formData.email,
            profilePic: previewPic || null,
          });
        }
        onClose();
      });
    } catch (err) {
      console.error("Update failed:", err);
      Swal.fire(
        "Update Failed",
        err.response?.data?.message || "Something went wrong",
        "error"
      );
    }
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content animate-modal">
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="profile-pic-container">
            <label className="profile-pic-upload">
              {previewPic ? (
                <img src={previewPic} alt="Profile" className="profile-pic" />
              ) : (
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "#eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "36px",
                  }}
                >
                  👤
                </div>
              )}
              <input type="file" accept="image/*" onChange={handlePicChange} hidden />
            </label>
            <span>Click image to change</span>
          </div>

          <div className="form-row">
            <label>Name:</label>
            <input name="name" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <label>Email:</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <label>Phone Number:</label>
            <input name="number" value={formData.number} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <label>Country:</label>
            <select name="country" value={formData.country} onChange={handleChange} required>
              <option value="" disabled hidden>
                Select Country
              </option>
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
            </select>
          </div>

          {/* <div className="form-row">
            <label>Password:</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter new password (leave blank to keep)"
            />
          </div> */}

          <div className="buttons">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
