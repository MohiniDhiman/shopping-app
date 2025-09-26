import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const routes = [
    { label: "➕ Add Banner", path: "/admin/add-banner", color: "#FF6B6B" },
    { label: "🎨 Add Category", path: "/admin/add-category", color: "#4ECDC4" },
    { label: "🛍️ Add Product", path: "/admin/add-product", color: "#FFD93D", textColor: "#333" },
    { label: "📦 Ordered Products", path: "/admin/ordered-products", color: "#1A8FE3" },
      { label: "🏷️ Manage Offers", path: "/manage-offers", color: "#FF9F1C" },
  ];

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">Admin Dashboard</h1>
      <div className="dashboard-buttons">
        {routes.map((route, index) => (
          <button
            key={index}
            className="dashboard-button"
            style={{
              backgroundColor: route.color,
              color: route.textColor || "#fff",
            }}
            onClick={() => navigate(route.path)}
          >
            {route.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
