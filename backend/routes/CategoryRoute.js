const express = require("express");
const router = express.Router();
const multer = require("multer");
const pool = require("../db");
const fs = require("fs");
const path = require("path");

// Setup Multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/categories");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

router.post("/add", upload.single("image"), async (req, res) => {
  const { name } = req.body;
  console.log("Name:", name);
  console.log("Uploaded File:", req.file);

  if (!name || !req.file) {
    return res
      .status(400)
      .json({ error: "Category name and image are required" });
  }

  try {
    const imageFilename = req.file.filename;

    await pool.query("INSERT INTO categories (name, image) VALUES ($1, $2)", [
      name,
      imageFilename,
    ]);

    res.status(201).json({ message: "Category added successfully" });
  } catch (err) {
    console.error("Add Category Error:", err);
    res.status(500).json({ error: "Server error while adding category" });
  }
});

/**
 * 🔹 Get All Categories
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories ORDER BY id DESC"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Fetch Category Error:", err);
    res.status(500).json({ error: "Unable to fetch categories" });
  }
});

/**
 * 🔹 Delete Category by ID
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM categories WHERE id = $1", [
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error("Delete Category Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
// PUT /api/categories/:id → Update category
router.put("/api/categories/:id", upload.single("image"), async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    category.name = name || category.name;

    if (req.file) {
      // Delete old image
      const oldImagePath = path.join(
        __dirname,
        "../uploads/categories",
        category.image
      );
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);

      category.image = req.file.filename;
    }

    await category.save();
    res.status(200).json({ message: "Category updated" });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error while updating category" });
  }
});

module.exports = router;
