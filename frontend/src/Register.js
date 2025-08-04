import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './components/AuthWrapper';
import axios from 'axios';
import config from './config';
import './App.css';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'candidate'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/auth/register`, {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role
      });
      
      // Store token and user data
      login(response.data.user, response.data.token);
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({
        submit: error.response?.data?.error || 'Registration failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `
        linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)),
        url('/backgroundhd.webp')
      `,
        backgroundSize: "150%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      {/* Homepage Button - Top Right */}
      <div
        className="top-nav-button"
        style={{
          position: "absolute",
          top: "1.5rem",
          right: "1.5rem",
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="action-btn save-btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
          }}
        >
          Homepage
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Logo Section */}
      <div
        className="logo-section"
        style={{
          textAlign: "center",
          marginBottom: "2rem",
        }}
      >
        <img
          src="/logo.webp"
          alt="Techify Logo"
          style={{
            height: "60px",
            width: "auto",
          }}
        />
      </div>

      {/* Auth Card */}
      <div
        className="auth-card"
        style={{
          width: "100%",
          maxWidth: "400px",
          backdropFilter: "blur(30px)",
          border: "1px solid hsl(var(--border))",
          borderRadius: "var(--radius)",
          padding: "2rem",
          boxShadow:
            "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
        }}
      >
        <div className="form-header" style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "hsl(var(--foreground))",
              margin: "0 0 0.5rem 0",
              letterSpacing: "-0.05em",
            }}
          >
            Create Account
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "hsl(var(--muted-foreground))",
              margin: "0",
            }}
          >
            Enter your details to get started
          </p>
        </div>

        <form
          className="form-fields"
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {/* Username Field */}
          <div>
            <label
              htmlFor="username"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "hsl(var(--foreground))",
                marginBottom: "0.5rem",
              }}
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              className={`input ${errors.username ? "error" : ""}`}
              autoComplete="username"
            />
            {errors.username && (
              <p
                style={{
                  color: "hsl(var(--destructive))",
                  fontSize: "0.75rem",
                  marginTop: "0.25rem",
                  margin: "0.25rem 0 0 0",
                }}
              >
                {errors.username}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "hsl(var(--foreground))",
                marginBottom: "0.5rem",
              }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={`input ${errors.email ? "error" : ""}`}
              autoComplete="email"
            />
            {errors.email && (
              <p
                style={{
                  color: "hsl(var(--destructive))",
                  fontSize: "0.75rem",
                  marginTop: "0.25rem",
                  margin: "0.25rem 0 0 0",
                }}
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "hsl(var(--foreground))",
                marginBottom: "0.5rem",
              }}
            >
              Role
            </label>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                padding: "0.5rem 0",
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="interviewer"
                  checked={formData.role === "interviewer"}
                  onChange={handleChange}
                  style={{
                    margin: "0",
                    borderRadius: "50%",
                    width: "1rem",
                    height: "1rem",
                  }}
                />
                <span>Interviewer</span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="candidate"
                  checked={formData.role === "candidate"}
                  onChange={handleChange}
                  style={{
                    margin: "0",
                    borderRadius: "50%",
                    width: "1rem",
                    height: "1rem",
                  }}
                />
                <span>Candidate</span>
              </label>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "hsl(var(--foreground))",
                marginBottom: "0.5rem",
              }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className={`input ${errors.password ? "error" : ""}`}
              autoComplete="new-password"
            />
            {errors.password && (
              <p
                style={{
                  color: "hsl(var(--destructive))",
                  fontSize: "0.75rem",
                  marginTop: "0.25rem",
                  margin: "0.25rem 0 0 0",
                }}
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "hsl(var(--foreground))",
                marginBottom: "0.5rem",
              }}
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className={`input ${errors.confirmPassword ? "error" : ""}`}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p
                style={{
                  color: "hsl(var(--destructive))",
                  fontSize: "0.75rem",
                  marginTop: "0.25rem",
                  margin: "0.25rem 0 0 0",
                }}
              >
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div
              style={{
                padding: "0.75rem",
                background: "red",
                border: "1px solid hsl(var(--destructive))",
                borderRadius: "12px",
                color: "white",
                fontSize: "0.875rem",
                textAlign: "center",
              }}
            >
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`action-btn run-btn ${loading ? "loading" : ""}`}
            style={{ width: "100%" }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Login Link */}
        <div
          className="footer-section"
          style={{
            marginTop: "1.5rem",
            textAlign: "center",
            paddingTop: "1.5rem",
            borderTop: "1px solid hsl(var(--border))",
          }}
        >
          <p
            style={{
              fontSize: "0.875rem",
              color: "hsl(var(--muted-foreground))",
              margin: "0",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "hsl(var(--primary))",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
