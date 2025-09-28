const express = require("express");
const router = express.Router();
const multer = require("multer");
const pool = require("../db");
const fs = require("fs");
const path = require("path");

// Setup uploads folder
const categoriesDir = path.join(__dirname, "../uploads/categories");
if (!fs.existsSync(categoriesDir))
  fs.mkdirSync(categoriesDir, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, categoriesDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Helper for full image URL
const getImageUrl = (filename) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  return `${baseUrl}/uploads/categories/${filename}`;
};

// Add Category
router.post("/add", upload.single("image"), async (req, res) => {
  const { name } = req.body;
  if (!name || !req.file)
    return res
      .status(400)
      .json({ error: "Category name and image are required" });

  try {
    const imageFilename = req.file.filename;
    const result = await pool.query(
      "INSERT INTO categories (name, image) VALUES ($1, $2) RETURNING *",
      [name, imageFilename]
    );
    const category = result.rows[0];
    category.image_url = getImageUrl(category.image);

    res.status(201).json(category);
  } catch (err) {
    console.error("Add Category Error:", err);
    res.status(500).json({ error: "Server error while adding category" });
  }
});

// Get All Categories
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories ORDER BY id DESC"
    );
    const categories = result.rows.map((c) => ({
      ...c,
      image_url: getImageUrl(c.image),
    }));
    res.status(200).json(categories);
  } catch (err) {
    console.error("Fetch Category Error:", err);
    res.status(500).json({ error: "Unable to fetch categories" });
  }
});

// Delete Category
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM categories WHERE id = $1", [
      id,
    ]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Category not found" });
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Delete Category Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Category
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    // Fetch current category
    const result = await pool.query("SELECT * FROM categories WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Category not found" });

    let category = result.rows[0];
    let imageFilename = category.image;

    // Replace image if new one uploaded
    if (req.file) {
      const oldImagePath = path.join(categoriesDir, category.image);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      imageFilename = req.file.filename;
    }

    const updateResult = await pool.query(
      "UPDATE categories SET name = $1, image = $2 WHERE id = $3 RETURNING *",
      [name || category.name, imageFilename, id]
    );

    category = updateResult.rows[0];
    category.image_url = getImageUrl(category.image);

    res.status(200).json(category);
  } catch (err) {
    console.error("Update Category Error:", err);
    res.status(500).json({ message: "Server error while updating category" });
  }
});

module.exports = router;
