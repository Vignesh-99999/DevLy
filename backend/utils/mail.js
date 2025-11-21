// utils/mail.js
import nodemailer from "nodemailer";
import escapeHtml from "escape-html";
import dotenv from "dotenv";
dotenv.config();

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = parseInt(process.env.SMTP_PORT || "465");
const secure = process.env.SMTP_SECURE === "true"; // true for 465, false for 587

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// verify once on startup
transporter.verify()
  .then(() => console.log(`✅ SMTP ready on ${host}:${port} (secure=${secure})`))
  .catch((err) => {
    console.error("❌ SMTP verify failed:", err && err.message ? err.message : err);
  });

// Send OTP email
export async function sendOtpEmail(to, otp) {
  const fromName = process.env.SENDER_NAME || "DevLy";
  const fromEmail = process.env.SENDER_EMAIL || process.env.SMTP_USER;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: `Your DevLy OTP: ${otp}`,
    text: `Your DevLy OTP is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif;">
        <h2>DevLy — One Time Password</h2>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

// Send appointment confirmation email
// utils/mail.js  — replace sendAppointmentEmail implementation with this
//import escapeHtml from "escape-html"; // npm i escape-html (optional but safer)

export async function sendAppointmentEmail(
  to,
  name,
  education = "",
  subjects = [],
  extra = { welcomeMsg: "", loginUrl: "", supportEmail: "" }
) {
  try {
    const fromName = process.env.SENDER_NAME || "DevLy";
    const fromEmail = process.env.SENDER_EMAIL || process.env.SMTP_USER;

    const safeName = escapeHtml(name || "");
    const safeEducation = escapeHtml(education || "");
    const safeSubjects = Array.isArray(subjects) ? subjects.map(s => escapeHtml(s)) : [];

    // small helper to build a subjects list html
    const subjectsHtml = safeSubjects.length
      ? `<ul style="margin:6px 0 12px 18px;padding:0;">${safeSubjects
          .map(s => `<li style="margin:4px 0;">${s}</li>`)
          .join("")}</ul>`
      : `<p style="margin:4px 0 12px 0;color:#6b7280;">No subjects specified</p>`;

    // Optional CTA
    const ctaHtml = extra.loginUrl
      ? `
        <a href="${escapeHtml(extra.loginUrl)}"
           style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px;">
          Go to Dashboard
        </a>`
      : "";

    const additionalMessage = extra.welcomeMsg
      ? `<p style="margin:12px 0 0;color:#111827;">${escapeHtml(extra.welcomeMsg)}</p>`
      : "";

    // Elegant email HTML (responsive-ish, inline css)
    const html = `
      <div style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#111827;">
        <div style="max-width:680px;margin:0 auto;padding:20px;background:#ffffff;border-radius:10px;border:1px solid #e5e7eb;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:56px;height:56px;background:#3b82f6;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:20px;">
              DL
            </div>
            <div>
              <h2 style="margin:0;color:#0f172a;">Welcome to DevLy, ${safeName}!</h2>
              <p style="margin:4px 0 0;color:#6b7280;">We’re excited to have you join our teaching team.</p>
            </div>
          </div>

          <hr style="border:none;border-top:1px solid #eef2f7;margin:16px 0;"/>

          <div style="margin-top:8px;">
            <p style="margin:0 0 6px;color:#374151;"><strong>Your appointment details</strong></p>

            <div style="background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e6eef8;">
              <p style="margin:6px 0;"><strong>Name:</strong> ${safeName}</p>
              <p style="margin:6px 0;"><strong>Education:</strong> ${safeEducation || "<em>Not provided</em>"}</p>
              <p style="margin:6px 0;"><strong>Subjects:</strong></p>
              ${subjectsHtml}
            </div>
          </div>

          ${additionalMessage}

          <div style="margin-top:14px;">
            ${ctaHtml}
          </div>

          <hr style="border:none;border-top:1px solid #eef2f7;margin:18px 0;"/>

          <p style="font-size:13px;margin:0;color:#6b7280;">
            If you didn’t expect this email or need help, contact
            <a href="mailto:${escapeHtml(extra.supportEmail || process.env.SUPPORT_EMAIL || fromEmail)}"
               style="color:#2563eb;text-decoration:none;">support</a>.
          </p>

          <p style="font-size:12px;color:#9ca3af;margin-top:8px;">DevLy • Built for learners & teachers</p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `Welcome to DevLy — ${safeName}, you’re appointed as Professor`,
      text: `${name} — appointed as professor. Education: ${education}. Subjects: ${subjects.join(", ")}`,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Appointment email sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("❌ sendAppointmentEmail error:", err && err.message ? err.message : err);
    return false;
  }
}


// Send resignation confirmation email
export async function sendResignationEmail(to, name) {
  const fromName = process.env.SENDER_NAME || "DevLy";
  const fromEmail = process.env.SENDER_EMAIL || process.env.SMTP_USER;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject: `Resignation Confirmation`,
    text: `Hi ${name},\n\nYour account has been successfully removed from DevLy.\n\nWe wish you the best.`,
    html: `
      <div style="font-family: Arial, Helvetica, sans-serif;">
        <h2>Resignation Confirmation</h2>
        <p>Hi ${name},</p>
        <p>Your account has been successfully removed from DevLy.</p>
        <p>We wish you the best.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}
