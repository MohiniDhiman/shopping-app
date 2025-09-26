const pool = require("../db"); // PostgreSQL pool connection

// ================== GET ALL OFFERS ==================
const getAllOffers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM offers ORDER BY id DESC");
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching offers:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// ================== CREATE NEW OFFER ==================
const createOffer = async (req, res) => {
  const {
    title,
    description,
    discount_type,
    discount_value,
    min_purchase_amount,
    buy_quantity,
    get_quantity,
    start_date,
    end_date,
  } = req.body;

  if (!title || !discount_type) {
    return res
      .status(400)
      .json({ error: "Title and discount type are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO offers 
        (title, description, discount_type, discount_value, min_purchase_amount, buy_quantity, get_quantity, start_date, end_date) 
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        title,
        description || null,
        discount_type,
        discount_value || null,
        min_purchase_amount || null,
        buy_quantity || null,
        get_quantity || null,
        start_date || null,
        end_date || null,
      ]
    );

    return res
      .status(201)
      .json({ message: "Offer created successfully", offer: result.rows[0] });
  } catch (err) {
    console.error("Error creating offer:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// ================== UPDATE OFFER ==================
const updateOffer = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    discount_type,
    discount_value,
    min_purchase_amount,
    buy_quantity,
    get_quantity,
    start_date,
    end_date,
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE offers SET 
        title=$1, description=$2, discount_type=$3, discount_value=$4, 
        min_purchase_amount=$5, buy_quantity=$6, get_quantity=$7, start_date=$8, end_date=$9
       WHERE id=$10 RETURNING *`,
      [
        title,
        description || null,
        discount_type,
        discount_value || null,
        min_purchase_amount || null,
        buy_quantity || null,
        get_quantity || null,
        start_date || null,
        end_date || null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Offer not found" });
    }

    return res
      .status(200)
      .json({ message: "Offer updated successfully", offer: result.rows[0] });
  } catch (err) {
    console.error("Error updating offer:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// ================== DELETE OFFER ==================
const deleteOffer = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM offers WHERE id=$1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Offer not found" });
    }

    return res.status(200).json({ message: "Offer deleted successfully" });
  } catch (err) {
    console.error("Error deleting offer:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// ================== EXPORT ==================
module.exports = {
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
};
