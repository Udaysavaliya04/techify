import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './components/AuthWrapper';
import config from './config';
import './App.css';

const EXPERIENCE_OPTIONS = [
  { value: 'fresher', label: 'Fresher' },
  { value: '2_plus_years', label: 'More than 2 years' },
  { value: '10_plus_years', label: 'More than 10 years' },
  { value: '20_plus_years', label: 'More than 20 years' }
];

export default function ProfileSettings() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSetupMode = location.pathname === '/profile-setup';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [experienceDropdownOpen, setExperienceDropdownOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    targetRole: '',
    comfortableLanguages: '',
    experienceLevel: '',
    currentCompany: '',
    location: '',
    bio: '',
    currentPassword: '',
    newPassword: ''
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [isAuthenticated, navigate]);

  const loadProfile = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/auth/profile`);
      const profile = res.data?.user?.candidateProfile || {};
      setForm((prev) => ({
        ...prev,
        fullName: profile.fullName || '',
        targetRole: profile.targetRole || '',
        comfortableLanguages: (profile.comfortableLanguages || []).join(', '),
        experienceLevel: profile.experienceLevel || '',
        currentCompany: profile.currentCompany || '',
        location: profile.location || '',
        bio: profile.bio || ''
      }));
    } catch (err) {
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (field, value) => {
    setError('');
    setSuccess('');
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateCandidateForm = () => {
    if (!form.fullName.trim()) return 'Full name is required.';
    if (!form.targetRole.trim()) return 'Target role is required.';
    if (!form.experienceLevel.trim()) return 'Experience level is required.';
    const languages = form.comfortableLanguages.split(',').map((l) => l.trim()).filter(Boolean);
    if (languages.length === 0) return 'At least one comfortable language is required.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (user?.role === 'candidate') {
        const validationError = validateCandidateForm();
        if (validationError) {
          setError(validationError);
          setSaving(false);
          return;
        }
      }

      const candidateProfile = {
        fullName: form.fullName.trim(),
        targetRole: form.targetRole.trim(),
        comfortableLanguages: form.comfortableLanguages.split(',').map((l) => l.trim()).filter(Boolean),
        experienceLevel: form.experienceLevel.trim(),
        currentCompany: form.currentCompany.trim(),
        location: form.location.trim(),
        bio: form.bio.trim()
      };

      let response;
      if (isSetupMode && user?.role === 'candidate') {
        response = await axios.post(`${config.API_BASE_URL}/api/auth/profile/setup`, candidateProfile);
      } else {
        response = await axios.put(`${config.API_BASE_URL}/api/auth/profile`, {
          candidateProfile: user?.role === 'candidate' ? candidateProfile : undefined,
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword || undefined
        });
      }

      if (response.data?.user) {
        updateUser(response.data.user);
      }

      if (isSetupMode) {
        navigate('/dashboard');
      } else {
        setSuccess('Profile settings saved successfully.');
        setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-root">
        <div className="join-container">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <div className="join-container" style={{ maxWidth: '760px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>
            {isSetupMode ? 'Complete Your Candidate Profile' : 'Profile Settings'}
          </h2>
          <p style={{ color: 'hsl(var(--muted-foreground))', marginTop: '0.5rem' }}>
            {isSetupMode
              ? 'Please complete this form to continue.'
              : 'Keep your profile up to date.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          {user?.role === 'candidate' && (
            <>
              <input
                className="input"
                placeholder="Full name *"
                value={form.fullName}
                onChange={(e) => onChange('fullName', e.target.value)}
              />
              <input
                className="input"
                placeholder="Target role * (e.g. Frontend Engineer)"
                value={form.targetRole}
                onChange={(e) => onChange('targetRole', e.target.value)}
              />
              <input
                className="input"
                placeholder="Comfortable languages * (comma separated)"
                value={form.comfortableLanguages}
                onChange={(e) => onChange('comfortableLanguages', e.target.value)}
              />
              <select
                style={{ display: 'none' }}
                value={form.experienceLevel}
                onChange={(e) => onChange('experienceLevel', e.target.value)}
              />
              <div className="dropdown-menu" style={{ width: '100%' }}>
                <button
                  type="button"
                  className="dropdown-trigger"
                  aria-expanded={experienceDropdownOpen}
                  onClick={() => setExperienceDropdownOpen((prev) => !prev)}
                  style={{ width: '100%' }}
                >
                  <span>
                    {form.experienceLevel
                      ? (EXPERIENCE_OPTIONS.find((item) => item.value === form.experienceLevel)?.label || 'Select experience level *')
                      : 'Select experience level *'}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="dropdown-icon">
                    <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {experienceDropdownOpen && (
                  <div className="dropdown-content" style={{ display: 'block', width: '100%' }}>
                    <div className="dropdown-label">Experience Level</div>
                    {EXPERIENCE_OPTIONS.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        className={`dropdown-item ${form.experienceLevel === item.value ? 'dropdown-item-active' : ''}`}
                        onClick={() => {
                          onChange('experienceLevel', item.value);
                          setExperienceDropdownOpen(false);
                        }}
                      >
                        <span>{item.label}</span>
                        {form.experienceLevel === item.value && (
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                className="input"
                placeholder="Current company (optional)"
                value={form.currentCompany}
                onChange={(e) => onChange('currentCompany', e.target.value)}
              />
              <input
                className="input"
                placeholder="Location (optional)"
                value={form.location}
                onChange={(e) => onChange('location', e.target.value)}
              />
              <textarea
                className="input"
                style={{ minHeight: '90px', resize: 'vertical' }}
                placeholder="Short bio (optional)"
                value={form.bio}
                onChange={(e) => onChange('bio', e.target.value)}
              />
            </>
          )}

          {!isSetupMode && (
            <>
              <div style={{ marginTop: '0.5rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
                Want to change your password?
              </div>
              <input
                className="input"
                type="password"
                placeholder="Current password"
                value={form.currentPassword}
                onChange={(e) => onChange('currentPassword', e.target.value)}
              />
              <input
                className="input"
                type="password"
                placeholder="New password"
                value={form.newPassword}
                onChange={(e) => onChange('newPassword', e.target.value)}
              />
            </>
          )}

          {error && (
            <div style={{ color: 'hsl(var(--destructive))', fontSize: '0.875rem' }}>{error}</div>
          )}
          {success && (
            <div style={{ color: 'hsl(142 76% 36%)', fontSize: '0.875rem' }}>{success}</div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            {!isSetupMode && (
              <button type="button" className="action-btn save-btn" onClick={() => navigate('/dashboard')}>
                Back
              </button>
            )}
            <button type="submit" className="action-btn run-btn" disabled={saving}>
              {saving ? 'Saving...' : isSetupMode ? 'Complete Setup' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
