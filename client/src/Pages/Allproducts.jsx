import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Allproducts.css";

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL; // deployed backend URL
  const baseUrl = apiUrl.replace("/api", "");   // full image path

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${apiUrl}/products`);
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();

        // Prepend baseUrl for image paths
        const updatedProducts = data.map((prod) => ({
          ...prod,
          image: prod.image ? `${baseUrl}/uploads/${encodeURIComponent(prod.image)}` : null
        }));

        setProducts(updatedProducts);
      } catch (err) {
        console.error(err);
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [apiUrl, baseUrl]);

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
