import React, { useEffect, useState } from "react";
import "./CategoryList.css";
import { Link } from "react-router-dom";

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL; // deployed backend URL

  useEffect(() => {
    fetch(`${apiUrl}/categories`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch categories");
        }
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
          console.log("Fetched categories:", data);
        } else {
          throw new Error("Invalid data format");
        }
      })
      .catch((err) => {
        console.error("Error fetching categories:", err);
        setError(err.message);
      });
  }, [apiUrl]);

  if (error) {
    return <div className="category-error">Error: {error}</div>;
  }

  return (
    <div className="category-list">
      <h2>PRODUCTS CATEGORY</h2>
      <div className="category-grid">
        {categories.map((category) => (
          <Link
            to={`/category/${category.id}`}
            key={category.id}
            className="category-card"
          >
            <div className="category-image-wrapper">
              <img
                // ✅ Fix: remove /api from URL for categories images
                src={
                  category.image
                    ? `${apiUrl.replace("/api", "")}/uploads/categories/${category.image}`
                    : "https://via.placeholder.com/200"
                }
                alt={category.name}
                className="homepage-category-image"
              />
              <div className="category-name-overlay">{category.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
