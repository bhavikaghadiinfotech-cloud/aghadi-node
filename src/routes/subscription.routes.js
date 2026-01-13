const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

router.post("/subscribe", async (req, res) => {
  try {
    const { email } = req.body || {};
    const cleanEmail = String(email || "").toLowerCase().trim();

    if (!cleanEmail) {
      return res.status(400).json({ ok: false, message: "Email is required" });
    }
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ ok: false, message: "Invalid email" });
    }

    const result = await pool.query(
      `INSERT INTO subscriptions (email)
       VALUES ($1)
       ON CONFLICT (email) DO UPDATE
         SET status='active'
       RETURNING id, email, status, created_at`,
      [cleanEmail]
    );

    return res.status(201).json({
      ok: true,
      message: "Subscribed successfully",
      subscription: result.rows[0],
    });
  } catch (err) {
    console.error("Subscribe error:", err);
    return res.status(500).json({ ok: false, message: "Server error", error: err.message });
  }
});

module.exports = router;
