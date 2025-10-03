const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Optional: test connection once at startup
pool
  .connect()
  .then(() => console.log("✅ Connected to Supabase PostgreSQL"))
  .catch((err) => console.error("❌ Database connection error:", err));

module.exports = pool;
