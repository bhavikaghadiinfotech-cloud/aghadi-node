const nodemailer = require("nodemailer");

function createTransporter() {
  const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } = process.env;

  if (!MAIL_HOST || !MAIL_PORT || !MAIL_USER || !MAIL_PASS) {
    throw new Error("Mail config missing in env");
  }

  const transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: Number(MAIL_PORT),
    secure: false, // 587 uses STARTTLS
    auth: { user: MAIL_USER, pass: MAIL_PASS },
    requireTLS: true,
    tls: {
      minVersion: "TLSv1.2",
      // Usually NOT needed, but helps if TLS chain causes trouble:
      // rejectUnauthorized: false,
    },
  });

  return transporter;
}

async function sendWelcomeEmail({ to, name, email, password }) {
  const transporter = createTransporter();
  await transporter.verify();
  console.log("SMTP verified OK");

  const from = process.env.MAIL_FROM;
  const replyTo = process.env.MAIL_REPLY_TO;

  const subject = "Welcome! Your account details";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Hello ${escapeHtml(name)},</h2>
      <p>Your account has been created successfully.</p>

      <h3 style="margin:16px 0 8px;">Login Details</h3>
      <table style="border-collapse: collapse;">
        <tr>
          <td style="padding:6px 10px; border:1px solid #ddd;"><b>Username</b></td>
          <td style="padding:6px 10px; border:1px solid #ddd;">${escapeHtml(
            name
          )}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px; border:1px solid #ddd;"><b>Email</b></td>
          <td style="padding:6px 10px; border:1px solid #ddd;">${escapeHtml(
            email
          )}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px; border:1px solid #ddd;"><b>Password</b></td>
          <td style="padding:6px 10px; border:1px solid #ddd;">${escapeHtml(
            password
          )}</td>
        </tr>
      </table>

      <p style="margin-top: 18px;">You can login anytime.</p>
      <p>Thanks,<br/>My App Team</p>
    </div>
  `;

  await transporter.sendMail({ from, replyTo, to, subject, html });
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

module.exports = { sendWelcomeEmail };
