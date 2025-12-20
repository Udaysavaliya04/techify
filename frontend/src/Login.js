import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './components/AuthWrapper';
import AuthLayout from './components/AuthLayout';
import FormField from './components/FormField';
import axios from 'axios';
import config from './config';
import './App.css';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const { login } = useAuth();

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
      login(response.data.user, response.data.token);
      window.location.href = from || '/dashboard';
    } catch (error) {
      setErrors({ submit: error.response?.data?.error || 'Login failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account"
      footerText="Don't have an account?"
      footerLinkText="Sign Up"
      footerLinkTo="/register"
      alertMessage={message}
    >
      <form className="form-fields" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <FormField
          id="email"
          name="email"
          type="email"
          label="Email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          error={errors.email}
          autoComplete="email"
        />

        <FormField
          id="password"
          name="password"
          type="password"
          label="Password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          error={errors.password}
          autoComplete="current-password"
        />

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

        <button type="submit" disabled={loading} className={`action-btn run-btn ${loading ? 'loading' : ''}`} style={{ width: '100%' }}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </AuthLayout>
  );
}
