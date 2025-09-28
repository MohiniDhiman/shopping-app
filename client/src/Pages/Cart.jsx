import { useNavigate } from "react-router-dom";
import { useCart } from "./context/CartContext"; 
import "./Cart.css";

const Cart = () => {
  const { cart, increaseQuantity, decreaseQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  // ✅ Calculate cart items with best offer applied without mutating state
  const cartWithOffers = cart.map((item) => {
    let basePrice = Number(item.price);
    let appliedOffer = null;

    if (item.offers?.length > 0) {
      const discountedPrices = item.offers.map((o) => {
        let price = Number(item.price);

        if (o.discount_type === "percentage") price -= (price * o.discount_value) / 100;
        if (o.discount_type === "flat") price -= o.discount_value;
        if (o.discount_type === "bogo" && o.buy_quantity && o.get_quantity) {
          const freeItems = Math.floor(item.quantity / (o.buy_quantity + o.get_quantity)) * o.get_quantity;
          price = (item.price * item.quantity - item.price * freeItems) / item.quantity;
        }

        return { price, offer: o };
      });

      const best = discountedPrices.reduce(
        (prev, curr) => (curr.price < prev.price ? curr : prev),
        discountedPrices[0]
      );

      basePrice = best.price;
      appliedOffer = best.offer;
    }

    return { ...item, appliedOffer, basePrice };
  });

  const totalAmount = cartWithOffers.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);

  return (
    <div className="cart-container">
      <h2>My Cart</h2>

      {cartWithOffers.length === 0 ? (
        <p className="empty-cart">Your cart is empty!</p>
      ) : (
        <>
          <div className="cart-items">
            {cartWithOffers.map((item) => (
              <div className="cart-item" key={`${item.cart_id}-${item.size || "NA"}`}>
                {/* Image */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="cart-item-img"
                />

                {/* Item Info */}
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <p>Size: {item.size || "-"}</p>
                  <p>
                    Price: ₹{Number(item.price).toFixed(2)}{" "}
                    {item.appliedOffer && (
                      <span className="offer-text">
                        (Best Offer: {item.appliedOffer.discount_type === "percentage"
                          ? `${item.appliedOffer.discount_value}% off`
                          : item.appliedOffer.discount_type === "flat"
                          ? `₹${item.appliedOffer.discount_value} off`
                          : item.appliedOffer.discount_type === "bogo"
                          ? `Buy ${item.appliedOffer.buy_quantity} Get ${item.appliedOffer.get_quantity} Free`
                          : item.appliedOffer.discount_type === "free_shipping"
                          ? "Free Shipping"
                          : ""})
                      </span>
                    )}
                  </p>

                  {/* All Offers */}
                  {item.offers?.length > 0 && (
                    <p className="all-offers">
                      Offers:{" "}
                      {item.offers.map((o) => (
                        <span key={`offer-${o.id}`} className="offer-label">
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

                  {/* Quantity Controls */}
                  <div className="quantity-controls">
                    <button onClick={() => decreaseQuantity(item.cart_id, item.size)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => increaseQuantity(item.cart_id, item.size)}>+</button>
                  </div>

                  {/* Actions */}
                  <div className="cart-actions">
                   <button
                          className="buy-btn"
                             onClick={() =>
                           navigate("/buy-now-checkout", { state: { buyNowProduct: item } })
                              }
                           >
                         Buy Now
                      </button>
                    <button
                      className="remove-btn"
                      onClick={() => removeFromCart(item.cart_id, item.size)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="cart-summary">
            <h3>Total: ₹{totalAmount.toFixed(2)}</h3>
            <button
              className="checkout-btn"
              onClick={() => navigate("/checkout", { state: { cart: cartWithOffers } })}
            >
              Proceed to Checkout
            </button>
            <button className="clear-btn" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
