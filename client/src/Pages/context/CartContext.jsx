import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;

  const apiUrl = import.meta.env.VITE_API_URL; // ✅ deployed backend

  useEffect(() => {
    if (!userId) return;

    const fetchCart = async () => {
      try {
        const res = await axios.get(`${apiUrl}/cart/${userId}`);
        const mappedCart = res.data.map((item) => ({
          cart_id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size || "M",
          appliedOffer: item.offer || null,
          price: item.price,
          offers: item.offers || [],
          image: item.image || "",
          name: item.name || "",
        }));
        setCart(mappedCart);
      } catch (err) {
        console.error("Failed to fetch cart", err);
      }
    };

    fetchCart();
  }, [userId, apiUrl]);

  const getBestOffer = (item) => {
    if (!item.offers || item.offers.length === 0) return null;

    const best = item.offers.reduce((prev, curr) => {
      let prevPrice = Number(item.price);
      let currPrice = Number(item.price);

      if (prev.discount_type === "percentage") prevPrice -= (prevPrice * prev.discount_value) / 100;
      if (prev.discount_type === "flat") prevPrice -= prev.discount_value;
      if (prev.discount_type === "bogo" && prev.buy_quantity && prev.get_quantity) {
        const freeItems = Math.floor(item.quantity / (prev.buy_quantity + prev.get_quantity)) * prev.get_quantity;
        prevPrice = (item.price * item.quantity - item.price * freeItems) / item.quantity;
      }

      if (curr.discount_type === "percentage") currPrice -= (currPrice * curr.discount_value) / 100;
      if (curr.discount_type === "flat") currPrice -= curr.discount_value;
      if (curr.discount_type === "bogo" && curr.buy_quantity && curr.get_quantity) {
        const freeItems = Math.floor(item.quantity / (curr.buy_quantity + curr.get_quantity)) * curr.get_quantity;
        currPrice = (item.price * item.quantity - item.price * freeItems) / item.quantity;
      }

      return currPrice < prevPrice ? curr : prev;
    });

    return best;
  };

  const addToCart = async (item) => {
    if (!userId) return alert("Please login to add items to cart");
    const size = item.size || "M";

    try {
      const res = await axios.post(`${apiUrl}/cart`, {
        user_id: userId,
        product_id: item.product_id || item.id,
        quantity: item.quantity || 1,
        offer: item.appliedOffer || null,
        size,
      });

      const newItem = {
        cart_id: res.data.id,
        product_id: res.data.product_id,
        quantity: res.data.quantity,
        size: res.data.size,
        appliedOffer: res.data.offer || null,
        price: res.data.price,
        offers: res.data.offers || [],
        image: res.data.image || "",
        name: res.data.name || "",
      };
      newItem.appliedOffer = getBestOffer(newItem);

      setCart((prev) => {
        const exists = prev.find((i) => i.cart_id === newItem.cart_id);
        if (exists) {
          return prev.map((i) => (i.cart_id === newItem.cart_id ? newItem : i));
        }
        return [...prev, newItem];
      });
    } catch (err) {
      console.error(err);
    }
  };

  const updateCartItem = async (cartId, quantity) => {
    const item = cart.find((i) => i.cart_id === cartId);
    if (!item) return;

    if (quantity <= 0) return removeFromCart(cartId);

    try {
      const res = await axios.post(`${apiUrl}/cart`, {
        user_id: userId,
        product_id: item.product_id,
        quantity,
        offer: item.appliedOffer || null,
        size: item.size,
      });

      const updatedItem = {
        cart_id: res.data.id,
        product_id: res.data.product_id,
        quantity: res.data.quantity,
        size: res.data.size,
        appliedOffer: res.data.offer || null,
        price: res.data.price,
        offers: res.data.offers || [],
        image: res.data.image || "",
        name: res.data.name || "",
      };
      updatedItem.appliedOffer = getBestOffer(updatedItem);

      setCart((prev) => prev.map((i) => (i.cart_id === cartId ? updatedItem : i)));
    } catch (err) {
      console.error(err);
    }
  };

  const increaseQuantity = (cartId) => {
    const item = cart.find((i) => i.cart_id === cartId);
    if (!item) return;
    updateCartItem(cartId, item.quantity + 1);
  };

  const decreaseQuantity = (cartId) => {
    const item = cart.find((i) => i.cart_id === cartId);
    if (!item) return;
    updateCartItem(cartId, item.quantity - 1);
  };

  const removeFromCart = async (cartId) => {
    const item = cart.find((i) => i.cart_id === cartId);
    if (!item) return;

    try {
      await axios.delete(`${apiUrl}/cart/${userId}/${item.product_id}/${item.size}`);
      setCart((prev) => prev.filter((i) => i.cart_id !== cartId));
    } catch (err) {
      console.error(err);
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${apiUrl}/cart/clear/${userId}`);
      setCart([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
