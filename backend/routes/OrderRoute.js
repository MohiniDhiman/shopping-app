const express = require("express");
const router = express.Router();
const pool = require("../db");
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// ================= CREATE NEW ORDER =================
router.post("/", async (req, res) => {
  try {
    const {
      user_id,
      items,
      total_amount,
      discount,
      final_amount,
      status,
      address_id,
    } = req.body;

    if (!user_id || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Step 1: Insert order (status 'pending')
    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, total_amount, discount, final_amount, status, created_at, address_id) 
       VALUES ($1, $2, $3, $4, $5, NOW(), $6) RETURNING id`,
      [
        user_id,
        total_amount,
        discount || 0,
        final_amount,
        status || "pending",
        address_id,
      ]
    );
    const orderId = orderResult.rows[0].id;

    // Step 2: Insert order items
    for (let item of items) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price) 
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    // Step 3: Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: final_amount * 100, // in paise
      currency: "INR",
      receipt: `order_${orderId}`,
      payment_capture: 1,
    });

    // Step 4: Save razorpay_order_id in orders table
    await pool.query(`UPDATE orders SET razorpay_order_id = $1 WHERE id = $2`, [
      razorpayOrder.id,
      orderId,
    ]);

    res.status(201).json({
      message: "Order created successfully",
      order_id: orderId,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ================= GET USER ORDERS =================
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(orders.rows);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ================= GET ORDER DETAILS WITH ITEMS =================
router.get("/details/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await pool.query(`SELECT * FROM orders WHERE id = $1`, [
      orderId,
    ]);
    if (order.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const items = await pool.query(
      `SELECT oi.*, p.name, p.description 
       FROM order_items oi 
       JOIN products p ON oi.product_id = p.id 
       WHERE oi.order_id = $1`,
      [orderId]
    );

    res.json({ ...order.rows[0], items: items.rows });
  } catch (err) {
    console.error("Error fetching order details:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ================= VERIFY PAYMENT =================
router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_method,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign)
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment verified → update order
      await pool.query(
        `UPDATE orders
         SET status='paid',
             payment_method=$1,
             payment_attempts = payment_attempts + 1
         WHERE razorpay_order_id=$2`,
        [payment_method, razorpay_order_id]
      );

      return res.json({
        success: true,
        message: "Payment verified & order updated",
      });
    } else {
      // Verification failed → increment attempts
      await pool.query(
        `UPDATE orders
         SET payment_attempts = payment_attempts + 1
         WHERE razorpay_order_id=$1`,
        [razorpay_order_id]
      );

      return res
        .status(400)
        .json({ success: false, message: "Payment verification failed" });
    }
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Error verifying payment" });
  }
});

module.exports = router;
