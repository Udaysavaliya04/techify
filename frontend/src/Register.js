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
                backgroundColor: "transparent",
                borderRadius: "12px",
                padding: "4px",
                position: "relative",
                border: "1px solid rgba(255, 255, 255, 0.1) ",
                backdropFilter: "blur(10px)",
              }}
            >
              {/* Sliding Background Pill */}
              <div
                style={{
                  position: "absolute",
                  top: "4px",
                  bottom: "4px",
                  left: formData.role === 'interviewer' ? "4px" : "50%",
                  width: "calc(50% - 4px)",
                  borderRadius: "8px",
                  background: "linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
                  transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
                  zIndex: 0,
                }}
              />

              {['interviewer', 'candidate'].map((roleOption) => (
                <button
                  key={roleOption}
                  type="button"
                  onClick={() => handleChange({ target: { name: 'role', value: roleOption } })}
                  style={{
                    flex: 1,
                    position: "relative",
                    padding: "0.6rem",
                    border: "none",
                    borderRadius: "8px",
                    background: "transparent",
                    color: formData.role === roleOption ? "#fff" : "rgba(255, 255, 255, 0.5)",
                    fontSize: "0.875rem",
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontWeight: formData.role === roleOption ? "700" : "500",
                    cursor: "pointer",
                    transition: "color 0.7s ease",
                    textTransform: "capitalize",
                    zIndex: 1,
                  }}
                >
                  {roleOption}
                </button>
              ))}
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

      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          maxWidth: "320px",
          backdropFilter: "blur(20px)",
          backgroundColor: "transparent",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "12px",
          padding: "1.25rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          zIndex: 50,
          animation: "fadeIn 1s ease-out",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 14 24"
            fill="none"
            stroke="yellow"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginTop: "0.25rem", flexShrink: 0 }}
          >
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
          </svg>
          <h3
            style={{
              fontSize: "0.95rem",
              fontWeight: "600",
              color: "#fff",
              margin: 0,
              paddingTop: "0.25rem"
            }}
          >
            How to try this platform?
          </h3>
        </div>
        
        <ol
          style={{
            margin: 0,
            paddingLeft: "1.5rem",
            fontSize: "0.85rem",
            color: "#e2e2e2",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            lineHeight: "1.5"
          }}
        >
          <li>
            Sign up as an <strong>Interviewer</strong> in this tab and create an interview.
          </li>
          <li>
            Open a new tab (or incognito) and sign up as a <strong>Candidate</strong>.
          </li>
          <li>
            Join the interview using the code.
          </li>
        </ol>
      </div>
    </div>
  );
}