const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
require("dotenv").config();

const app = express();
const expressListRoutes = require("express-list-endpoints");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/auth"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const bannerRoutes = require("./routes/BannerRoute");
app.use("/api/banners", bannerRoutes);

const categoryRoutes = require("./routes/CategoryRoute");
app.use("/api/categories", categoryRoutes);

const productRoutes = require("./routes/ProductRoutes");
app.use("/api", productRoutes);

const offersRoute = require("./routes/offerRoutes");
app.use("/api/offers", offersRoute);

app.use("/api/address", require("./routes/AddressRoute"));
app.use("/api/orders", require("./routes/OrderRoute"));
app.use("/api/payment", require("./routes/PaymentRoute"));
app.use("/api/cart", require("./routes/CartRoute"));
app.use("/api/payment", require("./routes/PaymentRoute"));

// PostgreSQL Connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: parseInt(process.env.DB_PORT),
});

// Base URL (for Render / local)
const BASE_URL =
  process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

// Example Products API with image URL fix
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");

    // Fix image paths
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

// List all routes for debugging
console.log(expressListRoutes(app));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
