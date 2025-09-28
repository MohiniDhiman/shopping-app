import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Use Vite environment variable for backend URL
      const apiUrl = import.meta.env.VITE_API_URL;

      const res = await axios.post(`${apiUrl}/auth/login`, form);

      // Save token and role in localStorage
      localStorage.setItem("token", res.data.token);

      // Save full user object for easier access
      const user = {
        id: res.data.user.id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role,
        isAdmin: res.data.user.role === "admin",
      };
      localStorage.setItem("user", JSON.stringify(user));

      alert("Login successful");

      // Redirect based on role
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/home");
      }

    } catch (err) {
      alert(err.response?.data?.error || "Something went wrong");
      console.error("Login error:", err);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleLogin}>
        <h2>Login</h2>

        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <button type="submit">Login</button>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link to="/" className="auth-link">Signup here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
