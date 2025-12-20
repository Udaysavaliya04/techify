import React, { useState } from 'react';
import { useAuth } from './components/AuthWrapper';
import AuthLayout from './components/AuthLayout';
import FormField from './components/FormField';
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
      login(response.data.user, response.data.token);
      window.location.href = '/dashboard';
    } catch (error) {
      setErrors({ submit: error.response?.data?.error || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Enter your details to get started"
      footerText="Already have an account?"
      footerLinkText="Sign In"
      footerLinkTo="/login"
    >
      <form className="form-fields" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <FormField
          id="username"
          name="username"
          type="text"
          label="Username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Enter your username"
          error={errors.username}
          autoComplete="username"
        />

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

        {/* Role Selection */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'hsl(var(--foreground))',
            marginBottom: '0.5rem'
          }}>
            Role
          </label>
          <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="role"
                value="interviewer"
                checked={formData.role === "interviewer"}
                onChange={handleChange}
                style={{ margin: '0', borderRadius: '50%', width: '1rem', height: '1rem' }}
              />
              <span>Interviewer</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="role"
                value="candidate"
                checked={formData.role === "candidate"}
                onChange={handleChange}
                style={{ margin: '0', borderRadius: '50%', width: '1rem', height: '1rem' }}
              />
              <span>Candidate</span>
            </label>
          </div>
        </div>

        <FormField
          id="password"
          name="password"
          type="password"
          label="Password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password"
          error={errors.password}
          autoComplete="new-password"
        />

        <FormField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        {errors.submit && (
          <div style={{
            padding: '0.75rem',
            background: 'red',
            border: '1px solid hsl(var(--destructive))',
            borderRadius: '12px',
            color: 'white',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            {errors.submit}
          </div>
        )}

        <button type="submit" disabled={loading} className={`action-btn run-btn ${loading ? 'loading' : ''}`} style={{ width: '100%' }}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </AuthLayout>
  );
}
