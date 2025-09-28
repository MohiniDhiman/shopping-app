const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ========== Ensure Uploads Directory ==========
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ========== IMAGE UPLOAD SETUP ==========
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// 🔹 Helper to build full image URL
const getImageUrl = (filename) => {
  if (!filename) return null;
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  return `${baseUrl}/uploads/${filename}`;
};

// ========== UPLOAD IMAGE ==========
router.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image uploaded" });
  const imageUrl = getImageUrl(req.file.filename);
  res.status(200).json({ imageUrl, filename: req.file.filename });
});

// ========== ADD NEW PRODUCT ==========
router.post("/add-product", async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      name,
      category_id,
      image, // filename
      price,
      old_price,
      description,
      sizes,
      offers,
    } = req.body;

    await client.query("BEGIN");

    const insertQuery = `
      INSERT INTO products (name, category_id, image, price, old_price, description, sizes)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `;
    const result = await client.query(insertQuery, [
      name,
      category_id,
      image,
      price,
      old_price,
      description,
      sizes,
    ]);

    const productId = result.rows[0].id;

    if (offers && offers.length > 0) {
      for (let offerId of offers) {
        await client.query(
          `INSERT INTO product_offers (product_id, offer_id) VALUES ($1, $2)`,
          [productId, offerId]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Product added successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error adding product:", err);
    res.status(500).json({ error: "Something went wrong" });
  } finally {
    client.release();
  }
});

// ========== FETCH ALL PRODUCTS ==========
router.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");

    const products = await Promise.all(
      result.rows.map(async (prod) => {
        const sizes =
          typeof prod.sizes === "string"
            ? prod.sizes.replace("{", "").replace("}", "").split(",")
            : prod.sizes || [];

        const offersRes = await pool.query(
          `SELECT o.* FROM offers o
           JOIN product_offers po ON o.id = po.offer_id
           WHERE po.product_id = $1`,
          [prod.id]
        );

        return {
          ...prod,
          sizes,
          offers: offersRes.rows,
          image_url: getImageUrl(prod.image), // ✅ full URL for frontend
        };
      })
    );

    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== FETCH SINGLE PRODUCT BY ID ==========
router.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Product not found" });

    const product = result.rows[0];
    product.sizes =
      typeof product.sizes === "string"
        ? product.sizes.replace("{", "").replace("}", "").split(",")
        : product.sizes || [];

    const offersRes = await pool.query(
      `SELECT o.* FROM offers o
       JOIN product_offers po ON o.id = po.offer_id
       WHERE po.product_id = $1`,
      [id]
    );
    product.offers = offersRes.rows;
    product.image_url = getImageUrl(product.image); // ✅ add URL

    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== DELETE PRODUCT ==========
router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM product_offers WHERE product_id = $1`, [id]);
    const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Product not found" });

    res.status(200).json({ message: "Product deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========== UPDATE PRODUCT ==========
router.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const {
    name,
    category_id,
    image,
    price,
    old_price,
    description,
    sizes,
    offers,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updateQuery = `
      UPDATE products
      SET name = $1,
          category_id = $2,
          image = $3,
          price = $4,
          old_price = $5,
          description = $6,
          sizes = $7
      WHERE id = $8
    `;

    const result = await client.query(updateQuery, [
      name,
      category_id,
      image,
      price,
      old_price,
      description,
      sizes,
      id,
    ]);

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found" });
    }

    await client.query(`DELETE FROM product_offers WHERE product_id = $1`, [
      id,
    ]);

    if (offers && offers.length > 0) {
      for (let offerId of offers) {
        await client.query(
          `INSERT INTO product_offers (product_id, offer_id) VALUES ($1, $2)`,
          [id, offerId]
        );
      }
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Product updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Update error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

module.exports = router;
