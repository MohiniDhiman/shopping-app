import React from "react";
import "./Home.css";
import Banner from "../HeroBanner/Banner";
import CategoryList from "../CategoryList/CategoryList";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="home">
      {/* HEADER */}
      <header className="zyra-header">
        <div className="top-banner">
          <span>New Collection is Live Now</span>
        </div>

        <nav className="main-header">
          <div className="brand-center">
            <h1>Z Y R A</h1>
            <span className="brand-subtext">S T O R E</span>
          </div>

          <ul className="nav-right"><Link to="/login">
            <li><i className="fa-solid fa-user"></i> Login</li>
            </Link>
            <Link to="/cart" className="nav-cart-link">
              <li><i className="fa-solid fa-cart-shopping"></i> 🛒 My Cart</li>
            </Link>
          </ul>
        </nav>
      </header>

      {/* BANNER */}
      <div className="hero-banner-container">
        <Banner />
      </div>

      {/* CATEGORY LIST */}
      <CategoryList />
    </div>
  );
};

export default Home;
