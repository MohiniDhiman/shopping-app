// backend/config/db.js
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: parseInt(process.env.DB_PORT, 10),
  ssl: { rejectUnauthorized: false }, // Render requires SSL
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Optional: test connection once at startup
pool
  .connect()
  .then(() => console.log("✅ Connected to Render PostgreSQL"))
  .catch((err) => console.error("❌ Database connection error:", err));

module.exports = pool;
