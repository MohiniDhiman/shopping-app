import React, { useState } from "react";

const PaymentOptions = ({ amount, onPaymentSuccess, items }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      const userId = Number(localStorage.getItem("userId"));
      if (!userId) {
        alert("User not logged in!");
        setLoading(false);
        return;
      }

      // Prepare payment payload with cart_id
      const paymentPayload = {
        amount,
        userId,
        items: items.map((item) => ({
          cart_id: item.cart_id,           // cart table id
          product_id: item.product_id,     // product reference
          quantity: item.quantity,
          price: item.price,
          offer_applied: item.appliedOffer || null,
        })),
      };

      console.log("Payment payload:", paymentPayload);

      // Create Razorpay order
      const res = await fetch("http://localhost:5000/api/payment/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentPayload),
      });

      const data = await res.json();
      if (!data?.id) {
        alert(data.error || "Order creation failed!");
        setLoading(false);
        return;
      }
      const apiUrl = import.meta.env.VITE_API_URL;
      // Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_XXXXXXXXXXXXXX",
        amount: data.amount,
        currency: data.currency,
        name: "My Shop",
        description: "Payment for your order",
        order_id: data.id,
        handler: async function (response) {
          try {
           const verifyRes = await fetch(`${apiUrl}/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              alert("✅ Payment successful!");
              onPaymentSuccess();
            } else {
              alert("❌ Payment verification failed!");
            }
          } catch (err) {
            console.error(err);
            alert("❌ Payment verification error!");
          }
        },
        prefill: {
          name: localStorage.getItem("name") || "Customer",
          email: localStorage.getItem("email") || "customer@example.com",
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("❌ Payment failed. Try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-options">
      <h3>Payment Options</h3>
      <button onClick={handlePayment} disabled={loading}>
        {loading ? "Processing..." : `Pay ₹${amount.toFixed(2)}`}
      </button>
    </div>
  );
};

export default PaymentOptions;
