import React, { useEffect, useState } from "react";
import "./CategoryProducts.css"; 
import { useParams, useNavigate } from "react-router-dom";

const CategoryProducts = () => {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL; // deployed backend URL
  const baseUrl = apiUrl.replace("/api", "");   // for full image path

  useEffect(() => {
    const fetchFilteredProducts = async () => {
      try {
        const res = await fetch(`${apiUrl}/products`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const allProducts = await res.json();

        // Filter products by category ID
        const filtered = allProducts
          .filter((prod) => prod.category_id === parseInt(categoryId))
          .map((prod) => ({
            ...prod,
            image: prod.image ? `${baseUrl}/uploads/${encodeURIComponent(prod.image)}` : null
          }));

        setProducts(filtered);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    fetchFilteredProducts();
  }, [categoryId, apiUrl, baseUrl]);

  const handleProductClick = (id) => {
    navigate(`/product/${id}`);
  };

  return (
    <div className="all-products">
      <h2>Products in This Category</h2>
      <div className="all-product-list">
        {products.length === 0 ? (
          <p>No products found in this category.</p>
        ) : (
          products.map((prod) => (
            <div
              className="all-product-item"
              key={prod.id}
              onClick={() => handleProductClick(prod.id)}
              style={{ cursor: "pointer" }}
            >
              <img
  src={prod.image ? `${apiUrl.replace("/api", "")}/uploads/${encodeURIComponent(prod.image)}` : "https://via.placeholder.com/300"}
  alt={prod.name}
/>

              <h3>{prod.name}</h3>
              <div className="price-info">
                <span className="price">₹{prod.price}</span>
                {prod.old_price > 0 && (
                  <span className="old-price">₹{prod.old_price}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryProducts;
