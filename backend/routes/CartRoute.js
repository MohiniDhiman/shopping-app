// backend/routes/cartRoutes.js
const express = require("express");
const pool = require("../db");

const router = express.Router();

// ✅ Get all cart items for a user with product details and offers
router.get("/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: "Invalid userId" });

  try {
    const result = await pool.query(
      `SELECT 
     cart.*, 
     p.name, 
     p.price, 
     p.image,  -- this is important
     COALESCE(json_agg(
       json_build_object(
         'id', o.id,
         'title', o.title,
         'discount_type', o.discount_type,
         'discount_value', o.discount_value,
         'buy_quantity', o.buy_quantity,
         'get_quantity', o.get_quantity,
         'min_purchase_amount', o.min_purchase_amount,
         'is_active', o.is_active
       )
     ) FILTER (WHERE o.id IS NOT NULL), '[]') AS offers
   FROM cart
   JOIN products p ON cart.product_id = p.id
   LEFT JOIN product_offers po ON po.product_id = p.id
   LEFT JOIN offers o ON po.offer_id = o.id
   WHERE cart.user_id = $1
   GROUP BY cart.id, p.name, p.price, p.image
   ORDER BY cart.id`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch cart items" });
  }
});

// ✅ Add or update a cart item and return product details with offers
router.post("/", async (req, res) => {
  const { user_id, product_id, quantity, offer, size } = req.body;
  const uId = parseInt(user_id);
  const pId = parseInt(product_id);
  const qty = parseInt(quantity);

  if (!uId || !pId || !qty) {
    return res
      .status(400)
      .json({ error: "user_id, product_id, and quantity are required" });
  }

  try {
    // Check if item already exists with same size
    const existing = await pool.query(
      "SELECT * FROM cart WHERE user_id=$1 AND product_id=$2 AND size=$3",
      [uId, pId, size]
    );

    let cartItem;
    if (existing.rows.length > 0) {
      const updated = await pool.query(
        "UPDATE cart SET quantity=$1, offer=$2 WHERE id=$3 RETURNING *",
        [qty, JSON.stringify(offer || []), existing.rows[0].id]
      );
      cartItem = updated.rows[0];
    } else {
      const inserted = await pool.query(
        "INSERT INTO cart (user_id, product_id, quantity, offer, size) VALUES ($1,$2,$3,$4,$5) RETURNING *",
        [uId, pId, qty, JSON.stringify(offer || []), size]
      );
      cartItem = inserted.rows[0];
    }

    // Fetch product details with offers
    const result = await pool.query(
      `SELECT 
         cart.*, 
         p.name, p.price, p.image,
         COALESCE(json_agg(
           json_build_object(
             'id', o.id,
             'title', o.title,
             'discount_type', o.discount_type,
             'discount_value', o.discount_value,
             'buy_quantity', o.buy_quantity,
             'get_quantity', o.get_quantity,
             'min_purchase_amount', o.min_purchase_amount,
             'is_active', o.is_active
           )
         ) FILTER (WHERE o.id IS NOT NULL), '[]') AS offers
       FROM cart
       JOIN products p ON cart.product_id = p.id
       LEFT JOIN product_offers po ON po.product_id = p.id
       LEFT JOIN offers o ON po.offer_id = o.id
       WHERE cart.id = $1
       GROUP BY cart.id, p.name, p.price, p.image`,
      [cartItem.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add/update cart item" });
  }
});

// ✅ Remove a single cart item by size
router.delete("/:userId/:productId/:size", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const productId = parseInt(req.params.productId);
  const size = req.params.size;

  if (!userId || !productId || !size)
    return res.status(400).json({ error: "Invalid userId, productId or size" });

  try {
    await pool.query(
      "DELETE FROM cart WHERE user_id=$1 AND product_id=$2 AND size=$3",
      [userId, productId, size]
    );
    res.json({ message: "Cart item removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove cart item" });
  }
});

// ✅ Clear entire cart for a user
router.delete("/clear/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (!userId) return res.status(400).json({ error: "Invalid userId" });

  try {
    await pool.query("DELETE FROM cart WHERE user_id=$1", [userId]);
    res.json({ message: "Cart cleared successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to clear cart" });
  }
});

module.exports = router;
