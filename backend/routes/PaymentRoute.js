const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const pool = require("../db");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

router.post("/orders", async (req, res) => {
  console.log("Received payment payload:", req.body);
  const client = await pool.connect();

  try {
    const { amount, userId, items } = req.body;

    if (!amount || !userId || !items?.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await client.query("BEGIN");

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, discount, final_amount, status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW()) RETURNING id`,
      [userId, amount, 0, amount]
    );
    const orderId = orderResult.rows[0].id;

    for (let item of items) {
      const cartCheck = await client.query(
        `SELECT * FROM cart WHERE id=$1 AND user_id=$2`,
        [item.cart_id, userId]
      );
      if (!cartCheck.rows.length) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: `Cart ID ${item.cart_id} does not exist` });
      }

      const productId = cartCheck.rows[0].product_id;
      const price = cartCheck.rows[0].price;

      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, productId, item.quantity, item.price]
      );
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `order_${orderId}`,
      payment_capture: 1,
    });

    await client.query(`UPDATE orders SET razorpay_order_id=$1 WHERE id=$2`, [
      razorpayOrder.id,
      orderId,
    ]);

    await client.query("COMMIT");

    res.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating Razorpay order:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to create Razorpay order" });
  } finally {
    client.release();
  }
});

router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
    } = req.body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.json({
        success: false,
        message: "Payment verification failed!",
      });
    }

    await pool.query(
      `UPDATE orders SET status='paid' WHERE razorpay_order_id=$1`,
      [razorpay_order_id]
    );

    res.json({ success: true, message: "Payment verified successfully!" });
  } catch (err) {
    console.error("Payment verification error:", err);
    res
      .status(500)
      .json({ success: false, message: "Payment verification error" });
  }
});

module.exports = router;
