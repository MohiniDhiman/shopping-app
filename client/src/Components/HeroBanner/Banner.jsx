import React, { useEffect, useRef, useState } from "react";
import "./Banner.css";
import { useNavigate } from "react-router-dom";

const Banner = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef(null);
  const navigate = useNavigate();

  // Use deployed backend URL from environment variable
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${apiUrl}/banners`)
      .then((res) => res.json())
      .then((data) => setBanners(data))
      .catch((err) => console.error("Failed to fetch banners:", err));
  }, [apiUrl]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!trackRef.current || banners.length === 0) return;

      const container = trackRef.current;
      const scrollAmount = container.clientWidth;
      const nextIndex = (currentIndex + 1) % banners.length;

      container.scrollTo({
        left: nextIndex * scrollAmount,
        behavior: "smooth",
      });

      setCurrentIndex(nextIndex);
    }, 3000);

    return () => clearInterval(interval);
  }, [banners.length, currentIndex]);

  const handleBannerClick = (link) => {
    if (!link) return;

    // If it's an external URL, open in new tab
    if (link.startsWith("http://") || link.startsWith("https://")) {
      window.open(link, "_blank");
      return;
    }

    // Ensure internal links are treated as absolute (starting from root)
    navigate(`/${link.replace(/^\/+/, "")}`);
  };

  const handleDotClick = (index) => {
    const container = trackRef.current;
    const scrollAmount = container.clientWidth;
    container.scrollTo({
      left: index * scrollAmount,
      behavior: "smooth",
    });
    setCurrentIndex(index);
  };

  return (
    <>
      <div className="banner-section">
        <div className="homepage-banner-wrapper" ref={trackRef}>
          {banners.map((banner, i) => (
            <div className="homepage-banner-item" key={i}>
<img
  src={`${apiUrl.replace("/api", "")}/uploads/banner/${banner.image_filename}`}
  alt={`banner-${i}`}
  className="homepage-banner-image"
  onClick={() => handleBannerClick(banner.link)}
/>

            </div>
          ))}
        </div>

        {/* Dots below */}
        <div className="dot-container">
          {banners.map((_, i) => (
            <span
              key={i}
              className={`dot ${currentIndex === i ? "active" : ""}`}
              onClick={() => handleDotClick(i)}
            ></span>
          ))}
        </div>
      </div>
    </>
  );
};

export default Banner;
