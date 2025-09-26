import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Description.css';
import { useCart } from "../context/CartContext";

const Description = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState("");
  const [offers, setOffers] = useState([]); 
  const [openOffers, setOpenOffers] = useState({}); // ✅ track open state of gifts
const { addToCart } = useCart();

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/products/${id}`);
        const currentProduct = res.data;
        setProduct(currentProduct);

        if (currentProduct.category_id) {
          const relatedRes = await axios.get(`http://localhost:5000/api/products`);
          const filtered = relatedRes.data.filter(
            p => p.category_id === currentProduct.category_id && p.id !== parseInt(id)
          );
          setRelatedProducts(filtered);
        }

        setOffers(currentProduct.offers || []);
        setLoading(false);
      } catch (err) {
        console.error("❌ Error fetching product or offers:", err.response ? err.response.data : err.message);
        setLoading(false);
      }
    };

    fetchProductAndRelated();
  }, [id]);

  const handleAddToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      return alert("Select a size");
    }

    const productToAdd = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      size: selectedSize || "default",
      quantity: 1,
      offers: product.offers || [], // ✅ include offers here
  };

    addToCart(productToAdd);
    alert("Product added to cart!");
  };

  const toggleOffer = (id) => {
    setOpenOffers((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading) return <h2 className="not-found">Loading product...</h2>;
  if (!product) return <h2 className="not-found">Product Not Found</h2>;

  return (
    <>
      <div className="product-description animated-fade">
        <div className="left-panel slide-in-left">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="right-panel slide-in-right">
          <h2>{product.name}</h2>

          <p className="price">
            {product.old_price && <span className="old-price">₹{product.old_price}</span>}
            <span className="new-price">₹{product.price}</span>
          </p>

          <p className="desc">{product.description}</p>

          {product.sizes?.length > 0 && (
            <div className="size-options">
              <strong>Sizes:</strong>
              <div className="size-buttons">
                {product.sizes.map((size, index) => (
                  <button
                    key={index}
                    className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ✅ Display Offers */}
          {offers.length > 0 && (
            <div className="product-offers">
                <div className="offers-header">
              <strong>Offers:</strong>
              <ul>
                {offers.map((offer) => {
                  const offerText =
                    offer.discount_type === "percentage"
                      ? `${offer.discount_value}% off`
                      : offer.discount_type === "flat"
                      ? `₹${offer.discount_value} off`
                      : offer.discount_type === "bogo"
                      ? `Buy ${offer.buy_quantity} Get ${offer.get_quantity} Free`
                      : offer.discount_type === "free_shipping"
                      ? "Free Shipping"
                      : "";

                  return (
                    <li
                      key={offer.id}
                      className={openOffers[offer.id] ? "open" : ""}
                      onClick={() => toggleOffer(offer.id)}
                    >
                      {openOffers[offer.id] ? offerText : "🎁"} {/* show gift box until clicked */}
                    </li>
                  );
                })}
              </ul>
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button className="btn add-cart" onClick={handleAddToCart}>Add to Cart</button>
           <button
  className="btn buy-now"
  onClick={() =>
    navigate("/buy-now-checkout", {
      state: {
        buyNowProduct: {
          product_id: product.id,
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          size: selectedSize || (product.sizes?.[0] || "default"),
          quantity: 1,
          offers: product.offers || [],
        },
      },
    })
  }
>
  Buy Now
</button>

          </div>
        </div>
      </div>
      
      <div className="related-products">
        <h2>More in this Category</h2>
        <div className="related-product-list">
          {relatedProducts.slice(0, 5).map((item) => (
            <Link to={`/product/${item.id}`} key={item.id} className="related-product-link">
              <div className="related-product-item">
                <img src={item.image} alt={item.name} />
                <h3>{item.name}</h3>
                <div className="price-info">
                  <span className="price">₹{item.price}</span>
                  {item.oldPrice && (
                    <span className="old-price">₹{item.oldPrice}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default Description;