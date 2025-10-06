import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ManageOffers.css";

const apiUrl = import.meta.env.VITE_API_URL;

const ManageOffers = () => {
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase_amount: "",
    buy_quantity: "",
    get_quantity: "",
    start_date: "",
    end_date: "",
    id: null,
  });

  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await axios.get(`${apiUrl}/offers`);
        const formattedOffers = res.data.map((offer) => ({
          ...offer,
          start_date: formatDate(offer.start_date),
          end_date: formatDate(offer.end_date),
        }));
        setOffers(formattedOffers);
      } catch (err) {
        console.error("Error fetching offers:", err);
        setOffers([]);
      }
    };

    fetchOffers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        const res = await axios.put(`${apiUrl}/offers/${form.id}`, form);
        setOffers(
          offers.map((o) =>
            o.id === form.id
              ? {
                  ...res.data.offer,
                  start_date: formatDate(res.data.offer.start_date),
                  end_date: formatDate(res.data.offer.end_date),
                }
              : o
          )
        );
      } else {
        const res = await axios.post(`${apiUrl}/offers`, form);
        setOffers([
          {
            ...res.data.offer,
            start_date: formatDate(res.data.offer.start_date),
            end_date: formatDate(res.data.offer.end_date),
          },
          ...offers,
        ]);
      }

      setForm({
        title: "",
        description: "",
        discount_type: "percentage",
        discount_value: "",
        min_purchase_amount: "",
        buy_quantity: "",
        get_quantity: "",
        start_date: "",
        end_date: "",
        id: null,
      });
    } catch (err) {
      console.error("Error saving offer:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${apiUrl}/offers/${id}`);
      setOffers(offers.filter((o) => o.id !== id));
    } catch (err) {
      console.error("Error deleting offer:", err);
    }
  };

  const handleEdit = (offer) => {
    setForm({
      title: offer.title,
      description: offer.description,
      discount_type: offer.discount_type,
      discount_value: offer.discount_value,
      min_purchase_amount: offer.min_purchase_amount || "",
      buy_quantity: offer.buy_quantity || "",
      get_quantity: offer.get_quantity || "",
      start_date: offer.start_date,
      end_date: offer.end_date,
      id: offer.id,
    });
  };

  return (
    <div className="manage-offers-container">
      <h2>🎁 Manage Offers</h2>

      <form className="offer-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Offer Title"
          value={form.title}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        ></textarea>

        <select
          name="discount_type"
          value={form.discount_type}
          onChange={handleChange}
        >
          <option value="percentage">Percentage Discount</option>
          <option value="flat">Flat Discount</option>
          <option value="bogo">Buy X Get Y</option>
          <option value="free_shipping">Free Shipping</option>
        </select>

        {form.discount_type === "percentage" && (
          <input
            type="number"
            name="discount_value"
            placeholder="Discount %"
            value={form.discount_value}
            onChange={handleChange}
            required
          />
        )}

        {form.discount_type === "flat" && (
          <>
            <input
              type="number"
              name="discount_value"
              placeholder="Flat Discount Amount"
              value={form.discount_value}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="min_purchase_amount"
              placeholder="Min Purchase Amount"
              value={form.min_purchase_amount}
              onChange={handleChange}
            />
          </>
        )}

        {form.discount_type === "bogo" && (
          <>
            <input
              type="number"
              name="buy_quantity"
              placeholder="Buy Quantity"
              value={form.buy_quantity}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="get_quantity"
              placeholder="Get Quantity"
              value={form.get_quantity}
              onChange={handleChange}
              required
            />
          </>
        )}

        <input
          type="date"
          name="start_date"
          value={form.start_date}
          onChange={handleChange}
        />
        <input
          type="date"
          name="end_date"
          value={form.end_date}
          onChange={handleChange}
        />

        <button type="submit">
          {form.id ? "✏️ Update Offer" : "➕ Add Offer"}
        </button>
      </form>

      <div className="offers-list">
        {offers.length === 0 ? (
          <p>No offers found.</p>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className={`offer-card ${offer.is_active ? "active" : ""}`}
            >
              <h3>{offer.title}</h3>
              <p>{offer.description}</p>
              <p>
                <strong>{offer.discount_type}</strong>{" "}
                {offer.discount_type === "percentage" &&
                  `- ${offer.discount_value}%`}
                {offer.discount_type === "flat" &&
                  `- ₹${offer.discount_value} (Min Purchase: ₹${offer.min_purchase_amount})`}
                {offer.discount_type === "bogo" &&
                  `- Buy ${offer.buy_quantity} Get ${offer.get_quantity}`}
                {offer.discount_type === "free_shipping" && `- Free Shipping`}
              </p>
              <p>
                {offer.start_date} → {offer.end_date}
              </p>

              <div className="offer-actions">
                <button className="edit-btn" onClick={() => handleEdit(offer)}>
                  ✏️ Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(offer.id)}
                >
                  ❌ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageOffers;