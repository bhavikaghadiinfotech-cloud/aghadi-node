const axios = require("axios");

async function sendWelcomeEmail({ to, name, email, password }) {
  const apiKey = process.env.BREVO_API_KEY; // ✅ read at runtime
  if (!apiKey) {
    throw new Error("BREVO_API_KEY missing in env (must be Brevo API key starting with xkeysib-)");
  }

  const from = process.env.MAIL_FROM;
  if (!from) throw new Error("MAIL_FROM missing in env");

  // Parse: "Name <email@domain.com>"
  const match = String(from).match(/^(.*)<(.*)>$/);
  const fromName = match ? match[1].trim().replace(/^"|"$/g, "") : "Aghadi";
  const fromEmail = match ? match[2].trim() : from;

  const replyTo = process.env.MAIL_REPLY_TO;

  const subject = "Welcome! Your account details";

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Hello ${escapeHtml(name)},</h2>
      <p>Your account has been created successfully.</p>

      <h3 style="margin:16px 0 8px;">Login Details</h3>
      <table style="border-collapse: collapse;">
        <tr>
          <td style="padding:6px 10px; border:1px solid #ddd;"><b>Username</b></td>
          <td style="padding:6px 10px; border:1px solid #ddd;">${escapeHtml(name)}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px; border:1px solid #ddd;"><b>Email</b></td>
          <td style="padding:6px 10px; border:1px solid #ddd;">${escapeHtml(email)}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px; border:1px solid #ddd;"><b>Password</b></td>
          <td style="padding:6px 10px; border:1px solid #ddd;">${escapeHtml(password)}</td>
        </tr>
      </table>

      <p style="margin-top: 18px;">You can login anytime.</p>
      <p>Thanks,<br/>My App Team</p>
    </div>
  `;

  const payload = {
    sender: { name: fromName, email: fromEmail },
    to: [{ email: to, name: name || "" }],
    subject,
    htmlContent,
    ...(replyTo ? { replyTo: { email: replyTo } } : {}),
  };

  try {
    const res = await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 20000,
    });

    return res.data;
  } catch (err) {
    // ✅ show Brevo error message in logs
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error("Brevo email error:", status, data || err.message);
    throw err;
  }
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
