import React, { useState } from "react";
import "./Checkout.css";
import AddressForm from "../Components/BuyPage/AddressForm";
import PaymentOptions from "../Components/BuyPage/PaymentOptions";
import { useCart } from "./context/CartContext";
import { useNavigate } from "react-router-dom";

// ✅ Import API URL from Vite environment
const apiUrl = import.meta.env.VITE_API_URL;

const Checkout = ({ singleProduct, userId: propUserId }) => {
  const { cart, clearCart } = useCart();
  const productsToShow = singleProduct ? [singleProduct] : cart;

  const [address, setAddress] = useState({});
  const navigate = useNavigate();

  const GST_PERCENT = 10;
  const PLATFORM_FEE = 5;

  // Persist userId: prop first, fallback to localStorage
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = propUserId || storedUser?.id;

  const itemsWithOffers = productsToShow.map((item) => {
    const basePrice = Number(item.price) || 0;
    let totalPrice = basePrice * item.quantity;
    let appliedOffer = item.appliedOffer || null;

    const offerDetails =
      item.offers?.map((o) => {
        let offerTotal = basePrice * item.quantity;
        switch (o.discount_type) {
          case "percentage":
            offerTotal -= (offerTotal * o.discount_value) / 100;
            break;
          case "flat":
            offerTotal -= o.discount_value * item.quantity;
            break;
          case "bogo":
            if (o.buy_quantity && o.get_quantity && item.quantity >= o.buy_quantity) {
              const fullSets = Math.floor(item.quantity / o.buy_quantity);
              const freeItems = fullSets * o.get_quantity;
              offerTotal -= Math.min(freeItems, item.quantity) * basePrice;
            }
            break;
          default:
            break;
        }
        return { offer: o, total: offerTotal };
      }) || [];

    if (offerDetails.length > 0) {
      const best = offerDetails.reduce(
        (prev, curr) => (curr.total < prev.total ? curr : prev),
        offerDetails[0]
      );
      appliedOffer = best.offer;
      totalPrice = best.total;
    }

    return {
      ...item,
      totalPrice,
      priceWithOffer: totalPrice / item.quantity,
      appliedOffer,
      allOffers: item.offers || [],
      cart_id: item.cart_id,
      product_id: item.product_id,
    };
  });

  const subtotal = itemsWithOffers.reduce((sum, item) => sum + item.totalPrice, 0);
  const gst = (subtotal * GST_PERCENT) / 100;
  const finalAmount = subtotal + gst + PLATFORM_FEE;

  // Handle order save after successful payment
  const handlePaymentSuccess = async () => {
    try {
      if (!userId) return alert("User not logged in!");

      // Save address
      const addrRes = await fetch(`${apiUrl}/addresses`, {
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
        items: itemsWithOffers.map((item) => ({
          cart_id: item.cart_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: Number(item.priceWithOffer) || 0,
          offer_applied: item.appliedOffer || null,
        })),
        subtotal,
        gst,
        platform_fee: PLATFORM_FEE,
        final_amount: finalAmount,
        status: "paid",
      };

      const orderRes = await fetch(`${apiUrl}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const data = await orderRes.json();

      if (orderRes.ok) {
        clearCart();
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
        <h2>Checkout</h2>
        <AddressForm userId={userId} setAddress={setAddress} />
        <PaymentOptions
          amount={finalAmount}
          onPaymentSuccess={handlePaymentSuccess}
          items={itemsWithOffers.map((item) => ({
            cart_id: item.cart_id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: Number(item.priceWithOffer) || 0,
            offer_applied: item.appliedOffer || null,
          }))}
        />
      </div>

      {/* Right Panel */}
      <div className="checkout-right">
        <h2>Order Summary</h2>
        {itemsWithOffers.length === 0 ? (
          <p>No products in cart</p>
        ) : (
          <>
            {itemsWithOffers.map((item) => (
              <div className="summary-item" key={`${item.cart_id}-${item.size}`}>
                <img src={item.image || "https://via.placeholder.com/150"} alt={item.name} />
                <div>
                  <h4>{item.name}</h4>
                  <p>Unit Price: ₹{Number(item.price).toFixed(2)}</p>
                  <p>Price after best offer: ₹{item.priceWithOffer.toFixed(2)}</p>
                  <p>Qty: {item.quantity}</p>

                  {item.appliedOffer && (
                    <p className="offer-text">
                      Best Offer Applied:{" none"}
                      {item.appliedOffer.discount_type === "percentage"
                        ? `${item.appliedOffer.discount_value}% off`
                        : item.appliedOffer.discount_type === "flat"
                        ? `₹${item.appliedOffer.discount_value} off`
                        : item.appliedOffer.discount_type === "bogo"
                        ? `Buy ${item.appliedOffer.buy_quantity} Get ${item.appliedOffer.get_quantity} Free`
                        : item.appliedOffer.discount_type === "free_shipping"
                        ? "Free Shipping"
                        : item.appliedOffer.title}
                    </p>
                  )}

                  {item.allOffers.length > 0 && (
                    <p className="all-offers">
                      All Offers:{" "}
                      {item.allOffers.map((o) => (
                        <span key={o.id} className="offer-label">
                          {o.discount_type === "percentage"
                            ? `${o.discount_value}% off`
                            : o.discount_type === "flat"
                            ? `₹${o.discount_value} off`
                            : o.discount_type === "bogo"
                            ? `Buy ${o.buy_quantity} Get ${o.get_quantity} Free`
                            : o.discount_type === "free_shipping"
                            ? "Free Shipping"
                            : o.title}{" "}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              </div>
            ))}

            <hr />
            <div className="summary-totals">
              <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
              <p>GST ({GST_PERCENT}%): ₹{gst.toFixed(2)}</p>
              <p>Platform Fee: ₹{PLATFORM_FEE.toFixed(2)}</p>
              <h3>Final Amount: ₹{finalAmount.toFixed(2)}</h3>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Checkout;
