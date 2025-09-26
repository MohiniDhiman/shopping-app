import { useState, useEffect } from "react";
import axios from "axios";
import "./AddProduct.css";

const AddProduct = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]); 
  const [selectedOffers, setSelectedOffers] = useState([]); 
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    price: "",
    old_price: "",
    image: "",
    description: "",
    sizes: [],
  });

  // ✅ Fetch products
  const fetchProducts = () => {
    axios
      .get("http://localhost:5000/api/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error(err));
  };

  // ✅ Fetch categories & offers once
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories:", err));

    axios
      .get("http://localhost:5000/api/offers")
      .then((res) => setOffers(res.data))
      .catch((err) => console.error("Error fetching offers:", err));

    fetchProducts();
  }, []);

  // ✅ Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Upload product image
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imageForm = new FormData();
    imageForm.append("image", file);

    try {
      const res = await fetch("http://localhost:5000/api/upload-image", {
        method: "POST",
        body: imageForm,
      });

      const data = await res.json();
      setFormData((prev) => ({ ...prev, image: data.imageUrl }));
    } catch (err) {
      console.error("Image upload failed:", err);
    }
  };

  // ✅ Offer checkbox handler
  const handleOfferChange = (e) => {
    const value = parseInt(e.target.value);
    setSelectedOffers((prev) =>
      prev.includes(value)
        ? prev.filter((id) => id !== value)
        : [...prev, value]
    );
  };

  // ✅ Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanedFormData = {
      ...formData,
      price: parseFloat(formData.price),
      old_price: parseFloat(formData.old_price || 0),
      category_id: parseInt(formData.category_id),
      sizes: `{${formData.sizes.join(",")}}`,
      offers: selectedOffers, // ✅ Pass offer IDs
    };

    try {
      const url = isEditing
        ? `http://localhost:5000/api/products/${editId}`
        : "http://localhost:5000/api/add-product";

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedFormData),
      });

      if (res.ok) {
        alert(isEditing ? "✅ Product updated!" : "✅ Product added!");
        resetForm();
        fetchProducts();
      } else {
        const data = await res.json();
        alert(data.error || "❌ Operation failed");
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Server error. Check console.");
    }
  };

  // ✅ Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      category_id: "",
      price: "",
      old_price: "",
      image: "",
      description: "",
      sizes: [],
    });
    setSelectedOffers([]);
    setIsEditing(false);
    setEditId(null);
  };

  // ✅ Delete product
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("🗑️ Product deleted successfully");
        fetchProducts();
      } else {
        const data = await res.json();
        alert(`Delete failed: ${data.error}`);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // ✅ Edit product
  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      category_id: product.category_id,
      price: product.price,
      old_price: product.old_price || "",
      image: product.image,
      description: product.description || "",
      sizes: product.sizes || [],
    });
  setSelectedOffers(
  product.offers
    ? product.offers.map((o) => parseInt(o.id))
    : []
);
    setIsEditing(true);
    setEditId(product.id);
  };

  return (
    <div className="add-product-container">
      {/* LEFT PANEL */}
      <div className="left-panel">
        <form onSubmit={handleSubmit} className="add-product-form">
          <h2>{isEditing ? "✏️ Edit Product" : "➕ Add Product"}</h2>

          <div className="form-group">
            <input
              className="product-name-input"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Product Name"
              required
            />
          </div>

          <div className="form-group">
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <input
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              placeholder="Price"
              required
            />
          </div>

          <div className="form-group">
            <input
              name="old_price"
              type="number"
              value={formData.old_price}
              onChange={handleChange}
              placeholder="Old Price"
            />
          </div>

          <div className="form-group">
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </div>

          {formData.image && (
            <div className="form-group preview-image">
              <img src={formData.image} alt="Preview" />
            </div>
          )}

          <div className="form-group">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Description"
            />
          </div>

          {/* ✅ Sizes */}
          <div className="form-group sizes-container">
            <label>Select Sizes:</label>
            <div className="size-buttons">
              {["26", "28", "30", "32", "34", "36", "S", "M", "L", "XL", "XXL"].map((size) => (
                <button
                  type="button"
                  key={size}
                  className={formData.sizes.includes(size) ? "size-btn selected" : "size-btn"}
                  onClick={() => {
                    const newSizes = formData.sizes.includes(size)
                      ? formData.sizes.filter((s) => s !== size)
                      : [...formData.sizes, size];
                    setFormData((prev) => ({ ...prev, sizes: newSizes }));
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

    {/* ✅ Offers */}
<div className="form-group">
  <label>Attach Offers (optional):</label>
  <div className="offers-list">
    {offers.length === 0 ? (
      <p>No offers available.</p>
    ) : (
    offers.map((offer) => {
  let offerLabel = "";

  switch (offer.discount_type) {
    case "percentage":
      offerLabel = `${offer.discount_value}% off`;
      break;
    case "flat":
      offerLabel = `₹${offer.discount_value} off`;
      break;
    case "bogo":
      // Dynamic BOGO label
      // Assuming offer has `bogo_buy` and `bogo_get` fields
      offerLabel = `Buy ${offer.buy_quantity} Get ${offer.get_quantity} Free`;
      break;
    case "free_shipping":
      offerLabel = "Free Shipping";
      break;
    default:
      offerLabel = offer.title;
  }
        return (
          <label key={offer.id} className="offer-option">
       <input
           type="checkbox"
            value={offer.id} // usually number
             checked={selectedOffers.includes(Number(offer.id))} // force number comparison
            onChange={handleOfferChange}
                  />
            <span className="offer-label">
              {offer.title} – <span className="offer-badge">{offerLabel}</span>
            </span>
          </label>
        );
      })
    )}
  </div>

  {/* Display selected offers */}
  {selectedOffers.length > 0 && (
    <div className="selected-offers">
      {selectedOffers.map((id) => {
        const offer = offers.find((o) => o.id === id);
        if (!offer) return null;

        let selectedLabel = "";
        switch (offer.discount_type) {
          case "percentage":
            selectedLabel = `${offer.discount_value}% off`;
            break;
          case "flat":
            selectedLabel = `₹${offer.discount_value} off`;
            break;
          case "bogo":
           selectedLabel = `Buy ${offer.buy_quantity} Get ${offer.get_quantity} Free`;
            break;
          case "free_shipping":
            selectedLabel = "Free Shipping";
            break;
          default:
            selectedLabel = offer.title;
        }

        return (
          <span key={id} className="selected-offer">
            {offer.title} (<span className="offer-badge">{selectedLabel}</span>)
            <span
              className="remove-offer"
              onClick={() =>
                setSelectedOffers((prev) => prev.filter((oid) => oid !== id))
              }
            >
              ❌
            </span>
          </span>
        );
      })}
    </div>
  )}
</div>


          <div className="form-group">
            <button type="submit" className="submit-btn">
              {isEditing ? "Update Product" : "Add Product"}
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        <h3>🛒 Existing Products</h3>
        {products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <ul className="product-list">
            {products.map((product) => (
              <li key={product.id} className="product-item">
                <img src={product.image} alt={product.name} className="product-image" />
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p>₹{product.price}</p>
                  {product.offers && product.offers.length > 0 && (
                    <small>
                      Offers: {product.offers.map((o) => o.title).join(", ")}
                    </small>
                  )}
                </div>
                <div className="action-buttons">
                  <button onClick={() => handleEdit(product)} className="edit-btn">✏️ Edit</button>
                  <button onClick={() => handleDelete(product.id)} className="delete-btn">🗑️ Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AddProduct;
