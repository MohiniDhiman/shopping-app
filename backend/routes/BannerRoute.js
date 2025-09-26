const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ✅ Import pool from db.js
const pool = require("../db");

// ✅ Ensure uploads/banner folder exists
const bannerDir = path.join(__dirname, "../uploads/banner");
if (!fs.existsSync(bannerDir)) {
  fs.mkdirSync(bannerDir, { recursive: true });
}

// ✅ Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, bannerDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ Upload banner
router.post("/upload-image", upload.single("image"), async (req, res) => {
  const image = req.file?.filename;
  const link = req.body.link;

  if (!image) return res.status(400).send("No image uploaded");

  try {
    const result = await pool.query(
      "INSERT INTO banners (image_filename, link) VALUES ($1, $2) RETURNING *",
      [image, link]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).send("Server error");
  }
});

// ✅ Get all banners
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM banners ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ message: "Error fetching banners" });
  }
});

// ✅ Delete banner
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM banners WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Banner not found" });
    }
    res.json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Edit/Update a banner
router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const link = req.body.link;
  const image = req.file?.filename;

  try {
    let query, values;

    if (image) {
      query =
        "UPDATE banners SET image_filename = $1, link = $2 WHERE id = $3 RETURNING *";
      values = [image, link, id];
    } else {
      query = "UPDATE banners SET link = $1 WHERE id = $2 RETURNING *";
      values = [link, id];
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
