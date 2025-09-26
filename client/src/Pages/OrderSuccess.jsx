import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { useNavigate, useLocation } from "react-router-dom";
import "./OrderSuccess.css";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const order = state?.order;

  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Update confetti on window resize
  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="order-success-container">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          numberOfPieces={200}
          recycle={true} // continuous confetti
          gravity={0.2}
        />
      )}

      <div className="success-card">
        <img src="https://cdn-icons-png.flaticon.com/512/845/845646.png" alt="success" />
        <h1>🎉 Order Placed Successfully!</h1>
        {order && (
          <p>
            Your Order ID: <b>{order.id}</b> <br />
            Amount Paid: <b>₹{order.final_amount}</b>
          </p>
        )}
        <button onClick={() => navigate("/home")}>Continue Shopping</button>
      </div>
    </div>
  );
};

export default OrderSuccess;
