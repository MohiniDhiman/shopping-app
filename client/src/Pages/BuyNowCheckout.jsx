import React, { useState } from "react";
import "./Checkout.css";
import AddressForm from "../Components/BuyPage/AddressForm";
import PaymentOptions from "../Components/BuyPage/PaymentOptions";
import { useNavigate, useLocation } from "react-router-dom";

const BuyNowCheckout = ({ userId: propUserId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [address, setAddress] = useState({});

  const GST_PERCENT = 10;
  const PLATFORM_FEE = 5;

  // ✅ Persist userId: use prop first, fallback to localStorage
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = propUserId || storedUser?.id;

  // ✅ Get product passed from Buy Now button
  const product = location.state?.buyNowProduct;
  if (!product) return <p>No product selected for Buy Now.</p>;

  // ✅ Apply offers for single product
  const basePrice = Number(product.price) || 0;
  let totalPrice = basePrice * product.quantity;
  let appliedOffer = null;

  if (product.offers?.length > 0) {
    const offerDetails = product.offers.map((o) => {
      let offerTotal = basePrice * product.quantity;
      if (o.discount_type === "percentage") offerTotal -= (offerTotal * o.discount_value) / 100;
      if (o.discount_type === "flat") offerTotal -= o.discount_value * product.quantity;
      if (o.discount_type === "bogo" && o.buy_quantity && o.get_quantity && product.quantity >= o.buy_quantity) {
        const fullSets = Math.floor(product.quantity / o.buy_quantity);
        const freeItems = fullSets * o.get_quantity;
        offerTotal -= Math.min(freeItems, product.quantity) * basePrice;
      }
      return { offer: o, total: offerTotal };
    });

    const best = offerDetails.reduce(
      (prev, curr) => (curr.total < prev.total ? curr : prev),
      offerDetails[0]
    );
    appliedOffer = best.offer;
    totalPrice = best.total;
  }

  const subtotal = totalPrice;
  const gst = (subtotal * GST_PERCENT) / 100;
  const finalAmount = subtotal + gst + PLATFORM_FEE;

  // ✅ Handle order save after successful payment
  const handlePaymentSuccess = async () => {
    try {
      if (!userId) return alert("User not logged in!");

      // Save address
      const addrRes = await fetch("http://localhost:5000/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ...address }),
      });
      const savedAddress = await addrRes.json();
      if (!addrRes.ok) return alert(savedAddress.error || "Failed to save address");
      const addressId = savedAddress.id;

      // Save order
      const orderPayload = {
        user_id: userId,
        address_id: addressId,
        items: [
          {
            product_id: product.product_id || product.id,
            quantity: product.quantity,
            price: Number(totalPrice / product.quantity),
            offer_applied: appliedOffer || null,
          },
        ],
        subtotal,
        gst,
        platform_fee: PLATFORM_FEE,
        final_amount: finalAmount,
        status: "paid",
      };

      const orderRes = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const data = await orderRes.json();

      if (orderRes.ok) {
        navigate("/order-success", { state: { order: data } });
      } else {
        alert(data.error || "Failed to save order");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving order");
    }
  };

  return (
    <div className="checkout-container">
      {/* Left Panel */}
      <div className="checkout-left">
        <h2>Buy Now Checkout</h2>
        <AddressForm userId={userId} setAddress={setAddress} />
        <PaymentOptions
          amount={finalAmount}
          onPaymentSuccess={handlePaymentSuccess}
          items={[
            {
              product_id: product.product_id || product.id,
              quantity: product.quantity,
              price: Number(totalPrice / product.quantity),
              offer_applied: appliedOffer || null,
            },
          ]}
        />
      </div>

      {/* Right Panel */}
      <div className="checkout-right">
        <h2>Order Summary</h2>
        <div className="summary-item" key={`${product.product_id}-${product.size}`}>
          <img src={product.image} alt={product.name} />
          <div>
            <h4>{product.name}</h4>
            <p>Unit Price: ₹{Number(product.price).toFixed(2)}</p>
            <p>Final Price: ₹{(totalPrice / product.quantity).toFixed(2)}</p>
            <p>Qty: {product.quantity}</p>
            {appliedOffer && (
              <p className="offer-text">
                Offer Applied:{" "}
                {appliedOffer.discount_type === "percentage"
                  ? `${appliedOffer.discount_value}% off`
                  : appliedOffer.discount_type === "flat"
                  ? `₹${appliedOffer.discount_value} off`
                  : appliedOffer.discount_type === "bogo"
                  ? `Buy ${appliedOffer.buy_quantity} Get ${appliedOffer.get_quantity} Free`
                  : appliedOffer.discount_type === "free_shipping"
                  ? "Free Shipping"
                  : appliedOffer.title}
              </p>
            )}
          </div>
        </div>
        <hr />
        <div className="summary-totals">
          <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
          <p>GST ({GST_PERCENT}%): ₹{gst.toFixed(2)}</p>
          <p>Platform Fee: ₹{PLATFORM_FEE.toFixed(2)}</p>
          <h3>Final Amount: ₹{finalAmount.toFixed(2)}</h3>
        </div>
      </div>
    </div>
  );
};

export default BuyNowCheckout;
