import React from 'react';
import './Footer.css'; // Assuming you save the CSS file as Footer.css

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-about">
          <h1>{''}</h1>
          <h3>About Us</h3>
          <p><b>Zyra Clothing Store</b> is committed to bringing you the latest trends in jeans and premium apparel. Quality, style, and comfort are at the heart of everything we create.</p>
        </div>

        <div className="footer-customer-service">
          <h3>Customer Service</h3>
          <ul>
            <li>Contact Us at <b>ZyraStore@gmail.com</b></li>
            <li>Shipping & Returns: Hassle-free policies</li>
            <li>FAQs: Answers to common questions</li>
          </ul>
        </div>

        <div className="footer-quick-links">
          <h3>Quick Links</h3>
          <ul>
            <li>Shop our latest collections</li>
            <li>Find your perfect size</li>
            <li>Track your recent orders</li>
          </ul>
        </div>

        <div className="footer-follow-us">
          <h3>Follow Us</h3>
          <p>Stay connected and get inspired on social platforms like Facebook, Instagram, Twitter, and Pinterest.</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>Secure Shopping: We prioritize your safety with secure payment options and encrypted transactions.</p>
        <p>© <b>2024 Zyra Clothing Store</b>. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
