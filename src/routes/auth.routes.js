const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../db/pool");
const { sendWelcomeEmail } = require("../utils/mailer");

const router = express.Router();

function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET missing in .env");
  return jwt.sign({ userId: user.id, email: user.email }, secret, {
    expiresIn: "7d",
  });
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, services, message } = req.body || {};

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "name, email, password are required" });
    }
    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ ok: false, message: "Password must be at least 6 characters" });
    }

    // services can be array OR comma-separated string
    let servicesArr = [];
    if (Array.isArray(services)) {
      servicesArr = services.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof services === "string") {
      servicesArr = services
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const cleanEmail = String(email).toLowerCase().trim();

    const existing = await pool.query(
      "SELECT id FROM users WHERE email=$1 LIMIT 1",
      [cleanEmail]
    );
    if (existing.rows.length) {
      return res
        .status(409)
        .json({ ok: false, message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insert = await pool.query(
      `INSERT INTO users (name, email, phone, services, message, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, phone, services, message, created_at`,
      [
        String(name).trim(),
        cleanEmail,
        phone ? String(phone).trim() : null,
        servicesArr.length ? servicesArr : null, // TEXT[] column
        message ? String(message).trim() : null,
        passwordHash,
      ]
    );

    const user = insert.rows[0];

    try {
      await sendWelcomeEmail({
        to: user.email,
        name: user.name,
        email: user.email,
        password: password, // plain password user entered
      });
    } catch (e) {
      console.error("Email send failed:", e.message);
    } 

    const token = signToken(user);

    return res.status(201).json({
      ok: true,
      message: "Registered successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        services: user.services,
        message: user.message,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ ok: false, message: "Email already registered" });
    }
    return res
      .status(500)
      .json({
        ok: false,
        message: "Server error",
        error: err.message,
        code: err.code || null,
      });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "email and password are required" });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    const result = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email=$1 LIMIT 1",
      [cleanEmail]
    );

    if (!result.rows.length) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res
        .status(401)
        .json({ ok: false, message: "Invalid credentials" });
    }

    const token = signToken(user);

    return res.json({
      ok: true,
      message: "Logged in successfully",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Server error", error: err.message });
  }
});

module.exports = router;
