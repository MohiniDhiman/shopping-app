const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
require("dotenv").config();

const app = express();
const expressListRoutes = require("express-list-endpoints");

// ------------------ Middleware ------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ------------------ API Routes ------------------
app.use("/api/auth", require("./routes/auth"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/banners", require("./routes/BannerRoute"));
app.use("/api/categories", require("./routes/CategoryRoute"));
app.use("/api", require("./routes/ProductRoutes")); // keep /api prefix
app.use("/api/offers", require("./routes/offerRoutes"));
app.use("/api/address", require("./routes/AddressRoute"));
app.use("/api/orders", require("./routes/OrderRoute"));
app.use("/api/payment", require("./routes/PaymentRoute"));
app.use("/api/cart", require("./routes/CartRoute"));

// ------------------ PostgreSQL Connection ------------------
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: parseInt(process.env.DB_PORT),
});

// ------------------ Base URL for Images ------------------
const BASE_URL =
  process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    const products = result.rows.map((p) => ({
      ...p,
      image: p.image ? `${BASE_URL}/uploads/${p.image}` : null,
    }));
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ------------------ List All Routes (Debug) ------------------
console.log(expressListRoutes(app));

// ------------------ Serve Vite Frontend ------------------
// ------------------ Serve Vite Frontend ------------------
const clientBuildPath = path.join(__dirname, "client/dist");
app.use(express.static(clientBuildPath));

// SPA Fallback for frontend routes
// Change from "*" to regex to avoid path-to-regexp error
app.get(/^\/.*$/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// ------------------ Start Server ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
