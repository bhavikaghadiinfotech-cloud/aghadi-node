const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./src/routes/auth.routes");
const subscriptionRoutes = require("./src/routes/subscription.routes");

const pool = require("./src/db/pool");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) =>
  res.json({ ok: true, message: "API running (PostgreSQL)" })
);

app.use("/api/auth", authRoutes);
app.use("/api", subscriptionRoutes);

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connected");

    const port = process.env.PORT || 5000;

    app.listen(port, "0.0.0.0", () => {
      console.log(`Server running on port ${port}`);
    });

    // app.listen(port, () => console.log(`Server running on port ${port}`));
  } catch (err) {
    console.error("Startup error:", err.message);
    process.exit(1);
  }
}

start();
