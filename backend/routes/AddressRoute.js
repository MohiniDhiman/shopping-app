// backend/routes/AddressRoute.js
const express = require("express");
const pool = require("../db");

const router = express.Router();

// ✅ Add a new address
router.post("/", async (req, res) => {
  try {
    const { user_id, name, street, city, state, pincode, phone } = req.body;

    const result = await pool.query(
      `INSERT INTO addresses (user_id, name, street, city, state, pincode, phone, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [user_id, name, street, city, state, pincode, phone]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error inserting address:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Get all addresses for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      "SELECT * FROM addresses WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching addresses:", err);
    res.status(500).json({ error: "Database error" });
  }
});
// ✅ Delete an address
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM addresses WHERE id = $1", [id]);
    res.json({ message: "Address deleted successfully" });
  } catch (err) {
    console.error("Error deleting address:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
