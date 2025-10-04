import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const PaymentOptions = ({ amount, items, userId, saveAddress, clearCart }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const handlePayment = async () => {
    setLoading(true);

    try {
      // 1️⃣ Save Address first
      const addressId = await saveAddress();
      if (!addressId) {
        setLoading(false);
        return;
      }

      // 2️⃣ Create Razorpay order
      const res = await fetch(`${apiUrl}/payment/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, userId, items }),
      });
      const data = await res.json();
      if (!data?.id) throw new Error(data.error || "Order creation failed");

      // 3️⃣ Open Razorpay modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
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
              clearCart(); // clear cart after successful payment
              navigate("/order-success", { state: { order: data } });
            } else {
              alert("❌ Payment verification failed!");
            }
          } catch (err) {
            console.error(err);
            alert("❌ Payment verification error!");
          }
        },
        prefill: { name: "Customer", email: "customer@example.com" },
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
