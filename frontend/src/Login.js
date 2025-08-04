import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './components/AuthWrapper';
import axios from 'axios';
import config from './config';
import './App.css';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Get redirect info from navigation state
  const from = location.state?.from;
  const message = location.state?.message;

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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${config.API_BASE_URL}/api/auth/login`, formData);
      
      // Store token and user data
      login(response.data.user, response.data.token);
      
      // Redirect to original destination or dashboard
      if (from) {
        navigate(from);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        submit: error.response?.data?.error || 'Login failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)),
        url('/backgroundhd.webp')
      `,
      backgroundSize: '150%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      {/* Homepage Button */}
      <div className="top-nav-button" style={{
        position: 'absolute',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 10
      }}>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="action-btn save-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem'
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
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      </div>

      {/* Logo Section */}
      <div className="logo-section" style={{ 
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <img 
          src="/logo.webp" 
          alt="Techify Logo" 
          style={{ 
            height: '60px', 
            width: 'auto'
          }} 
        />
      </div>

      {/* Auth Card */}
      <div className="auth-card" style={{
        width: '100%',
        maxWidth: '400px',
       
        backdropFilter: 'blur(30px)',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius)',
        padding: '2rem',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)'
      }}>
        <div className="form-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: '600',
            color: 'hsl(var(--foreground))',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.05em',
          }}>
            Welcome Back
          </h2>
          <p style={{ 
            fontSize: '0.875rem',
            color: 'hsl(var(--muted-foreground))',
            margin: '0'
          }}>
            Sign in to your account
          </p>
          {message && (
            <div style={{
              background: 'hsl(var(--destructive) / 0.1)',
              color: 'hsl(var(--destructive))',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              marginTop: '1rem',
              textAlign: 'center',
              border: '1px solid hsl(var(--destructive))'
            }}>
              {message}
            </div>
          )}
        </div>

        <form className="form-fields" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Email Field */}
          <div>
            <label htmlFor="email" style={{ 
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'hsl(var(--foreground))',
              marginBottom: '0.5rem'
            }}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={`input ${errors.email ? 'error' : ''}`}
              autoComplete="email"
            />
            {errors.email && (
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'hsl(var(--destructive))',
                margin: '0.25rem 0 0 0'
              }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" style={{ 
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'hsl(var(--foreground))',
              marginBottom: '0.5rem'
            }}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`input ${errors.password ? 'error' : ''}`}
              autoComplete="current-password"
            />
            {errors.password && (
              <p style={{
                fontSize: '0.75rem',
                color: 'hsl(var(--destructive))',
                background: 'red',
                margin: '0.25rem 0 0 0'
              }}>
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div style={{
              background: 'red',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '12px',
              fontSize: '0.875rem',
              textAlign: 'center',
              border: '1px solid hsl(var(--destructive))'
            }}>
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`action-btn run-btn ${loading ? 'loading' : ''}`}
            style={{ width: '100%' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Register Link */}
        <div className="footer-section" style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          paddingTop: '1.5rem',
          borderTop: '1px solid hsl(var(--border))'
        }}>
          <p style={{ 
            color: 'hsl(var(--muted-foreground))',
            fontSize: '0.875rem',
            margin: '0'
          }}>
            Don't have an account?{' '}
            <Link 
              to="/register" 
              style={{ 
                color: 'hsl(var(--primary))',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
