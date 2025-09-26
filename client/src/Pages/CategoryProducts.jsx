import React, { useEffect, useState } from "react";
import "./CategoryProducts.css"; // create CSS if needed
import { useParams, useNavigate } from "react-router-dom";


const CategoryProducts = () => {
  const { categoryId } = useParams();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchFilteredProducts = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/products`);
        const allProducts = await res.json();

        // Filter products by category ID
        const filtered = allProducts.filter(
          (prod) => prod.category_id === parseInt(categoryId)
        );

        setProducts(filtered);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    fetchFilteredProducts();
  }, [categoryId]);
  const navigate = useNavigate();

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
        <div className="all-product-item" key={prod.id}
         onClick={() => handleProductClick(prod.id)}
      style={{ cursor: "pointer" }} >
         <img src={prod.image} alt={prod.name} />
          <h3>{prod.name}</h3>
          <div className="price-info">
            <span className="price">₹{prod.price}</span>
            {prod.old_price && (
              <span className="old-price">₹{prod.old_price}</span>
            )}
          </div>
        </div>
      ))
    )}
  </div>
</div>
  )
};

export default CategoryProducts;
