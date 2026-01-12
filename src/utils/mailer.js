const nodemailer = require("nodemailer");

function createTransporter() {
  const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } = process.env;

  if (!MAIL_HOST || !MAIL_PORT || !MAIL_USER || !MAIL_PASS) {
    throw new Error(
      "Mail config missing in .env (MAIL_HOST/MAIL_PORT/MAIL_USER/MAIL_PASS)"
    );
  }

  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT || 587),
    secure: false, // 587 = STARTTLS (false)
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    requireTLS: true,
  });
}

async function sendWelcomeEmail({ to, name, email, password }) {
  const transporter = createTransporter();

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
