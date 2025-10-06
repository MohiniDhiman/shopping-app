import React, { useState, useEffect } from "react";
import "./AddBanner.css";

const apiUrl = import.meta.env.VITE_API_URL;
const baseUrl = apiUrl.replace("/api", "");

const AddBanner = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [link, setLink] = useState("");
  const [banners, setBanners] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState(null);

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${apiUrl}/banners`);
      const data = await res.json();
      setBanners(data);
    } catch (err) {
      console.error("Error fetching banners:", err);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!image && !editingBannerId) {
      alert("Please select an image.");
      return;
    }
    if (!link) {
      alert("Please enter a link.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    if (image) formData.append("image", image);
    formData.append("link", link);

    try {
      let url = `${apiUrl}/banners/upload-image`;
      let method = "POST";

      if (editingBannerId) {
        url = `${apiUrl}/banners/${editingBannerId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        body: formData,
      });

      if (!res.ok) throw new Error("Upload/Edit failed");

      const data = await res.json();
      console.log(method === "PUT" ? "Edited:" : "Uploaded:", data);

      setImage(null);
      setLink("");
      setPreview(null);
      setEditingBannerId(null);
      fetchBanners();
    } catch (err) {
      console.error("Upload/Edit error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (banner) => {
    setEditingBannerId(banner.id);
    setLink(banner.link);
    setPreview(`${baseUrl}/uploads/banner/${banner.image_filename}`);
    setImage(null);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/banners/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${errorText}`);
      }

      fetchBanners();
      console.log("Deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="add-banner-container">
      <div className="banner-header">
        <h2 className="banner-title">
          {editingBannerId ? "Edit Banner" : "Add New Banner"}
        </h2>
        <div className="upload-controls">
          <input
            type="file"
            onChange={handleImageChange}
            accept="image/*"
            className="upload-input"
          />
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Enter link for this banner"
            className="link-input"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="upload-button"
          >
            {uploading
              ? "Uploading..."
              : editingBannerId
              ? "Update Banner"
              : "Upload Banner"}
          </button>
        </div>
      </div>

      {preview && (
        <img className="banner-preview" src={preview} alt="Preview" />
      )}

      <h3 className="banner-subheading">Uploaded Banners</h3>
      <div className="banner-grid">
        {banners.map((banner) => (
          <div key={banner.id} className="banner-item">
            <a href={banner.link} target="_blank" rel="noopener noreferrer">
              <img
                src={`${baseUrl}/uploads/banner/${banner.image_filename}`}
                alt="banner"
                className="banner-img"
              />
            </a>
            <div className="banner-actions">
              <button
                onClick={() => handleEdit(banner)}
                className="edit-button"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(banner.id)}
                className="delete-button"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AddBanner;