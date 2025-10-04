import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PaymentOptions = ({ amount, onPaymentSuccess, items }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL; // backend URL

  const handlePayment = async () => {
    try {
      setLoading(true);

      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) {
        alert("User not logged in!");
        setLoading(false);
        return;
      }

      const userId = Number(user.id);

      const paymentPayload = {
        amount,
        userId,
        items: items.map((item) => ({
          cart_id: item.cart_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          offer_applied: item.appliedOffer || null,
        })),
      };

      const res = await fetch(`${apiUrl}/payment/orders`, {
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

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: data.amount,
        currency: data.currency,
        name: "My Shop",
        description: "Payment for your order",
        order_id: data.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${apiUrl}/payment/verify-payment`, {
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

              // Redirect to OrderSuccess page with order data
              navigate("/order-success", { state: { order: data } });
              
              // Optional callback
              if (onPaymentSuccess) onPaymentSuccess();
            } else {
              alert("❌ Payment verification failed!");
            }
          } catch (err) {
            console.error(err);
            alert("❌ Payment verification error!");
          }
        },
        prefill: {
          name: user.name || "Customer",
          email: user.email || "customer@example.com",
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
