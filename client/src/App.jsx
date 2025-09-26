import React from "react";
import { Routes, Route } from "react-router-dom";
import { CartProvider } from "./Pages/context/CartContext";
import Login from "./Pages/Authentication/Login";
import Signup from "./Pages/Authentication/Signup";
import Homepage from "./Pages/Homepage";
import Allproducts from "./Pages/Allproducts";
import Description from "./Pages/Product-Description/Description";
import AddProduct from "./Pages/admin-panel/AddProduct";
import AddBanner from './Pages/admin-panel/AddBanner';
import Cart from "./Pages/Cart";
import CategoryProducts from "./Pages/CategoryProducts";
import AddCategory from "./Pages/admin-panel/AddCategory";
import AdminDashboard from "./Pages/admin-panel/Dashboard";
import ManageOffers from "./Pages/admin-panel/ManageOffers";
import OrderSuccess from "./Pages/OrderSuccess"; // ✅ import
import BuyNowCheckout from "./Pages/BuyNowCheckout";


// ✅ New Checkout Page (combines Address, Payment, and Order Summary)
import Checkout from "./Pages/Checkout";

const App = () => {
  return (
    <CartProvider>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Customer side */}
        <Route path="/home" element={<Homepage />} />
        <Route path="/all-p" element={<Allproducts />} />
        <Route path="/category/:categoryId" element={<CategoryProducts />} />
        <Route path="/product/:id" element={<Description />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout/>} /> {/* ✅ Checkout */}
        <Route path="/order-success" element={<OrderSuccess />} /> {/* ✅ new */}


        {/* Admin side */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/add-product" element={<AddProduct />} />
        <Route path="/admin/add-category" element={<AddCategory />} />
        <Route path="/admin/add-banner" element={<AddBanner />} />
        <Route path="/manage-offers" element={<ManageOffers />} />
        <Route path="/buy-now-checkout" element={<BuyNowCheckout />} />
      </Routes>
    </CartProvider>
  );
};

export default App;
