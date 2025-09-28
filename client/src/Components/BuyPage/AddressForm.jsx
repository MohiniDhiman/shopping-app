import React, { useState, useEffect } from "react";
import "../../Pages/Checkout.css";

const AddressForm = ({ setAddress }) => {
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  const apiUrl = import.meta.env.VITE_API_URL; // deployed backend

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.id;

  useEffect(() => {
    if (!userId) return;

    const fetchAddresses = async () => {
      try {
        const res = await fetch(`${apiUrl}/address/${userId}`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setAddresses(data || []);
        if (!data || data.length === 0) setShowForm(true);
      } catch (err) {
        console.error("Error fetching addresses:", err);
        setShowForm(true);
      }
    };

    fetchAddresses();
  }, [userId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveAddress = async () => {
    if (!userId) return alert("User not logged in!");
    try {
      const res = await fetch(`${apiUrl}/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, user_id: userId }),
      });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const newAddress = await res.json();

      setAddresses([...addresses, newAddress]);
      setFormData({
        name: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        phone: "",
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error saving address:", err);
      alert("Failed to save address. Please try again.");
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    try {
      const res = await fetch(`${apiUrl}/address/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      setAddresses(addresses.filter((addr) => addr.id !== id));
    } catch (err) {
      console.error("Error deleting address:", err);
      alert("Failed to delete address. Please try again.");
    }
  };

  const handleUseAddress = (addr) => {
    setAddress(addr);
  };

  return (
    <div className="address-form-container">
      <h3>Shipping Address</h3>

      {addresses.length > 0 && !showForm && (
        <div className="saved-addresses">
          {addresses.map((addr, idx) => (
            <div key={idx} className="address-card">
              <p><b>{addr.name}</b></p>
              <p>{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
              <p>Phone: {addr.phone}</p>
              <div className="address-actions">
                <button onClick={() => handleUseAddress(addr)}>Use This Address</button>
                <button className="delete-btn" onClick={() => handleDeleteAddress(addr.id)}>Delete</button>
              </div>
            </div>
          ))}
          <button className="add-new-btn" onClick={() => setShowForm(true)}>+ Add Another Address</button>
        </div>
      )}

      {(showForm || addresses.length === 0) && (
        <div className="address-form">
          <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} />
          <input type="text" name="street" placeholder="Street Address" value={formData.street} onChange={handleChange} />
          <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} />
          <input type="text" name="state" placeholder="State" value={formData.state} onChange={handleChange} />
          <input type="text" name="pincode" placeholder="Pincode" value={formData.pincode} onChange={handleChange} />
          <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
          <button onClick={handleSaveAddress}>Save Address</button>
        </div>
      )}
    </div>
  );
};

export default AddressForm;
