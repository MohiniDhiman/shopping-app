import React, { useState, useEffect } from "react";
import "./AddCategory.css";

const apiUrl = import.meta.env.VITE_API_URL;
const baseUrl = apiUrl.replace("/api", "");

const AddCategory = () => {
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${apiUrl}/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!name || !image) return alert("Please provide all fields.");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", image);

    try {
      const res = await fetch(`${apiUrl}/categories/add`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload category");

      alert("✅ Category uploaded successfully!");

      setName("");
      setImage(null);
      setPreview(null);
      fetchCategories();
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Failed to upload category.");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${apiUrl}/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete category");

      fetchCategories();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="add-category-container">
      <h2 className="category-title">Add New Category</h2>
      <div className="category-form">
        <input
          type="text"
          placeholder="Enter category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input type="file" onChange={handleImageChange} accept="image/*" />
        <button onClick={handleSubmit}>Upload Category</button>
      </div>

      {preview && (
        <img className="category-preview" src={preview} alt="Preview" />
      )}

      <h3 className="category-subheading">Uploaded Categories</h3>
      <div className="category-grid">
        {categories.map((cat) => (
          <div className="category-card" key={cat.id}>
            <img
              src={`${baseUrl}/uploads/categories/${cat.image}`}
              alt={cat.name}
              className="category-image"
            />
            <div className="category-info">
              <span>{cat.name}</span>
              <button onClick={() => handleDelete(cat.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddCategory;