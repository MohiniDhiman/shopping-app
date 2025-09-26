import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Allproducts.css";

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <p>Loading products...</p>;
  if (error) return <p>{error}</p>;

  return (
<div className="all-products">
  <h2>All Products</h2>

  <div className="all-product-list">
    {products.map((prod) => (
      <Link to={`/product/${prod.id}`} className="all-product-item" key={prod.id}>
        <img
          src={prod.image || "https://via.placeholder.com/300"}
          alt={prod.name}
        />
        <h3>{prod.name}</h3>
  <div className="price-info">
    <span className="price">₹{prod.price}</span>
    {prod.old_price > 0 && (
      <span className="old-price">₹{prod.old_price}</span>
    )}
  </div>
      </Link>
    ))}
  </div>
</div>

  );
};

export default AllProducts;
