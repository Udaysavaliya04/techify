import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const LANGUAGE_OPTIONS = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'C',
  'C#',
  'Go',
  'Rust',
  'Kotlin',
  'Swift',
  'PHP',
  'Ruby',
  'Dart',
  'Scala',
  'SQL',
  'R',
  'MATLAB'
];

const TRACK_OPTIONS = [
  { value: '', label: 'General' },
  { value: 'dsa', label: 'Data Structures & Algorithms' },
  { value: 'system_design', label: 'System Design' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'fullstack', label: 'Fullstack' }
];

const WORK_TYPE_OPTIONS = [
  { value: '', label: 'Preferred work type' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'Onsite' },
  { value: 'flexible', label: 'Flexible' }
];

const NOTICE_OPTIONS = [
  { value: '', label: 'Notice period' },
  { value: 'immediate', label: 'Immediate' },
  { value: '15_days', label: '15 days' },
  { value: '30_days', label: '30 days' },
  { value: '60_days', label: '60 days' },
  { value: '90_plus_days', label: '90+ days' }
];

export default function ProfileSettings() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSetupMode = location.pathname === '/profile-setup';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [experienceDropdownOpen, setExperienceDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [trackDropdownOpen, setTrackDropdownOpen] = useState(false);
  const [workTypeDropdownOpen, setWorkTypeDropdownOpen] = useState(false);
  const [noticeDropdownOpen, setNoticeDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const languageRef = useRef(null);
  const countryRef = useRef(null);
  const experienceRef = useRef(null);
  const trackRef = useRef(null);
  const workTypeRef = useRef(null);
  const noticeRef = useRef(null);

  const [form, setForm] = useState({
    fullName: '',
    targetRole: '',
    comfortableLanguages: [],
    country: '',
    experienceLevel: '',
    preferredInterviewTrack: '',
    openToRemote: true,
    preferredWorkType: '',
    noticePeriod: '',
    timezone: '',
    careerGoal: '',
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
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

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('https://restcountries.com/v3.1/all?fields=name');
        const names = (response.data || [])
          .map((country) => country?.name?.common)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        setCountries(names);
      } catch (fetchError) {
        console.error('Failed to fetch countries:', fetchError);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setLanguageDropdownOpen(false);
      }
      if (countryRef.current && !countryRef.current.contains(event.target)) {
        setCountryDropdownOpen(false);
      }
      if (experienceRef.current && !experienceRef.current.contains(event.target)) {
        setExperienceDropdownOpen(false);
      }
      if (trackRef.current && !trackRef.current.contains(event.target)) {
        setTrackDropdownOpen(false);
      }
      if (workTypeRef.current && !workTypeRef.current.contains(event.target)) {
        setWorkTypeDropdownOpen(false);
      }
      if (noticeRef.current && !noticeRef.current.contains(event.target)) {
        setNoticeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSetupMode || success !== 'Profile updated successfully.') return undefined;

    const redirectTimer = setTimeout(() => {
      navigate('/dashboard');
    }, 1200);

    return () => clearTimeout(redirectTimer);
  }, [success, isSetupMode, navigate]);

  const filteredCountries = useMemo(() => {
    const search = countrySearch.trim().toLowerCase();
    if (!search) return countries;
    return countries.filter((country) => country.toLowerCase().includes(search));
  }, [countries, countrySearch]);

  const loadProfile = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/auth/profile`);
      const profile = res.data?.user?.candidateProfile || {};
      setForm((prev) => ({
        ...prev,
        fullName: profile.fullName || '',
        targetRole: profile.targetRole || '',
        comfortableLanguages: profile.comfortableLanguages || [],
        country: profile.country || '',
        experienceLevel: profile.experienceLevel || '',
        preferredInterviewTrack: profile.preferredInterviewTrack || '',
        openToRemote: profile.openToRemote !== undefined ? Boolean(profile.openToRemote) : true,
        preferredWorkType: profile.preferredWorkType || '',
        noticePeriod: profile.noticePeriod || '',
        timezone: profile.timezone || '',
        careerGoal: profile.careerGoal || '',
        githubUrl: profile.githubUrl || '',
        linkedinUrl: profile.linkedinUrl || '',
        portfolioUrl: profile.portfolioUrl || '',
        currentCompany: profile.currentCompany || '',
        location: profile.location || '',
        bio: profile.bio || ''
      }));
      setCountrySearch(profile.country || '');
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
    if (!form.country.trim()) return 'Country is required.';
    if (!form.experienceLevel.trim()) return 'Experience level is required.';
    if (!Array.isArray(form.comfortableLanguages) || form.comfortableLanguages.length === 0) {
      return 'Select at least one comfortable language.';
    }
    return '';
  };

  const toggleLanguage = (language) => {
    setForm((prev) => {
      const alreadySelected = prev.comfortableLanguages.includes(language);
      return {
        ...prev,
        comfortableLanguages: alreadySelected
          ? prev.comfortableLanguages.filter((item) => item !== language)
          : [...prev.comfortableLanguages, language]
      };
    });
    setError('');
    setSuccess('');
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
        comfortableLanguages: form.comfortableLanguages,
        country: form.country.trim(),
        experienceLevel: form.experienceLevel.trim(),
        preferredInterviewTrack: form.preferredInterviewTrack || '',
        openToRemote: form.openToRemote,
        preferredWorkType: form.preferredWorkType || '',
        noticePeriod: form.noticePeriod || '',
        timezone: form.timezone.trim(),
        careerGoal: form.careerGoal.trim(),
        githubUrl: form.githubUrl.trim(),
        linkedinUrl: form.linkedinUrl.trim(),
        portfolioUrl: form.portfolioUrl.trim(),
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
        setSuccess('Profile updated successfully.');
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
              : 'Update profile information or change credentials.'}
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

              <div className="dropdown-menu" style={{ width: '100%' }} ref={languageRef}>
                <button
                  type="button"
                  className="dropdown-trigger"
                  aria-expanded={languageDropdownOpen}
                  onClick={() => setLanguageDropdownOpen((prev) => !prev)}
                  style={{ width: '100%', minHeight: '100%', height: 'auto', alignItems: 'flex-start' }}
                >
                  <span style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', flex: 1 }}>
                    {form.comfortableLanguages.length === 0 ? (
                      <span style={{ color: 'hsl(var(--muted-foreground))' }}>Comfortable languages *</span>
                    ) : (
                      form.comfortableLanguages.map((language) => (
                        <span
                          key={language}
                          style={{
                            background: 'hsl(var(--secondary))',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'hsl(var(--foreground))',
                            borderRadius: '6px',
                            padding: '0.125rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}
                        >
                          {language}
                        </span>
                      ))
                    )}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="dropdown-icon">
                    <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {languageDropdownOpen && (
                  <div className="dropdown-content" style={{ display: 'block', width: '100%', maxHeight: '14rem', overflowY: 'auto' }}>
                    <div className="dropdown-label">Select One Or More</div>
                    {LANGUAGE_OPTIONS.map((language) => (
                      <button
                        key={language}
                        type="button"
                        className={`dropdown-item ${form.comfortableLanguages.includes(language) ? 'dropdown-item-active' : ''}`}
                        onClick={() => toggleLanguage(language)}
                      >
                        <span>{language}</span>
                        {form.comfortableLanguages.includes(language) && (
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="dropdown-menu" style={{ width: '100%' }} ref={countryRef}>
                <button
                  type="button"
                  className="dropdown-trigger"
                  aria-expanded={countryDropdownOpen}
                  onClick={() => setCountryDropdownOpen((prev) => !prev)}
                  style={{ width: '100%' }}
                >
                  <span>{form.country || 'Select country *'}</span>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="dropdown-icon">
                    <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {countryDropdownOpen && (
                  <div className="dropdown-content" style={{ display: 'block', width: '100%', maxHeight: '16rem', overflowY: 'auto' }}>
                    <div className="dropdown-label">Country</div>
                    <div style={{ padding: '0.25rem' }}>
                      <input
                        className="input"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder="Search country..."
                        style={{ height: '2rem', fontSize: '0.8125rem' }}
                      />
                    </div>
                    
                    {filteredCountries.slice(0, 150).map((country) => (
                      <button
                        key={country}
                        type="button"
                        className={`dropdown-item ${form.country === country ? 'dropdown-item-active' : ''}`}
                        onClick={() => {
                          onChange('country', country);
                          setCountrySearch(country);
                          setCountryDropdownOpen(false);
                        }}
                      >
                        <span>{country}</span>
                        {form.country === country && (
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                    {filteredCountries.length === 0 && (
                      <div style={{ padding: '0.5rem 0.75rem', color: 'hsl(var(--muted-foreground))', fontSize: '0.8rem' }}>
                        No countries found.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="dropdown-menu" style={{ width: '100%' }} ref={experienceRef}>
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

              <div className="dropdown-menu" style={{ width: '100%' }} ref={trackRef}>
                <button
                  type="button"
                  className="dropdown-trigger"
                  aria-expanded={trackDropdownOpen}
                  onClick={() => setTrackDropdownOpen((prev) => !prev)}
                  style={{ width: '100%' }}
                >
                  <span>
                    {TRACK_OPTIONS.find((item) => item.value === form.preferredInterviewTrack)?.label || 'Preferred interview track'}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="dropdown-icon">
                    <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {trackDropdownOpen && (
                  <div className="dropdown-content" style={{ display: 'block', width: '100%' }}>
                    <div className="dropdown-label">Interview Focus</div>
                    {TRACK_OPTIONS.map((item) => (
                      <button
                        key={item.value || 'general'}
                        type="button"
                        className={`dropdown-item ${form.preferredInterviewTrack === item.value ? 'dropdown-item-active' : ''}`}
                        onClick={() => {
                          onChange('preferredInterviewTrack', item.value);
                          setTrackDropdownOpen(false);
                        }}
                      >
                        <span>{item.label}</span>
                        {form.preferredInterviewTrack === item.value && (
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', marginLeft: '0.2rem', gap: '0.5rem', fontSize: '0.875rem', color: 'hsl(var(--foreground))' }}>
                <input
                  type="checkbox"
                  checked={form.openToRemote}
                  onChange={(e) => onChange('openToRemote', e.target.checked)}
                  style={{ accentColor: 'hsl(var(--primary))'  }}
                />
                Open to remote opportunities
              </label>

              <div className="dropdown-menu" style={{ width: '100%' }} ref={workTypeRef}>
                <button
                  type="button"
                  className="dropdown-trigger"
                  aria-expanded={workTypeDropdownOpen}
                  onClick={() => setWorkTypeDropdownOpen((prev) => !prev)}
                  style={{ width: '100%' }}
                >
                  <span>{WORK_TYPE_OPTIONS.find((item) => item.value === form.preferredWorkType)?.label || 'Preferred work type'}</span>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="dropdown-icon">
                    <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {workTypeDropdownOpen && (
                  <div className="dropdown-content" style={{ display: 'block', width: '100%' }}>
                    <div className="dropdown-label">Work Preference</div>
                    {WORK_TYPE_OPTIONS.map((item) => (
                      <button
                        key={item.value || 'none'}
                        type="button"
                        className={`dropdown-item ${form.preferredWorkType === item.value ? 'dropdown-item-active' : ''}`}
                        onClick={() => {
                          onChange('preferredWorkType', item.value);
                          setWorkTypeDropdownOpen(false);
                        }}
                      >
                        <span>{item.label}</span>
                        {form.preferredWorkType === item.value && (
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="dropdown-check">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="dropdown-menu" style={{ width: '100%' }} ref={noticeRef}>
                <button
                  type="button"
                  className="dropdown-trigger"
                  aria-expanded={noticeDropdownOpen}
                  onClick={() => setNoticeDropdownOpen((prev) => !prev)}
                  style={{ width: '100%' }}
                >
                  <span>{NOTICE_OPTIONS.find((item) => item.value === form.noticePeriod)?.label || 'Notice period'}</span>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="dropdown-icon">
                    <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {noticeDropdownOpen && (
                  <div className="dropdown-content" style={{ display: 'block', width: '100%' }}>
                    <div className="dropdown-label">Availability</div>
                    {NOTICE_OPTIONS.map((item) => (
                      <button
                        key={item.value || 'none'}
                        type="button"
                        className={`dropdown-item ${form.noticePeriod === item.value ? 'dropdown-item-active' : ''}`}
                        onClick={() => {
                          onChange('noticePeriod', item.value);
                          setNoticeDropdownOpen(false);
                        }}
                      >
                        <span>{item.label}</span>
                        {form.noticePeriod === item.value && (
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
                placeholder="Timezone (e.g. Asia/Kolkata)"
                value={form.timezone}
                onChange={(e) => onChange('timezone', e.target.value)}
              />
              <textarea
                className="input"
                style={{ minHeight: '72px', resize: 'vertical' }}
                placeholder="Current career goal (optional)"
                value={form.careerGoal}
                onChange={(e) => onChange('careerGoal', e.target.value)}
              />

              <input
                className="input"
                placeholder="GitHub profile URL"
                value={form.githubUrl}
                onChange={(e) => onChange('githubUrl', e.target.value)}
              />
              <input
                className="input"
                placeholder="LinkedIn profile URL"
                value={form.linkedinUrl}
                onChange={(e) => onChange('linkedinUrl', e.target.value)}
              />
              <input
                className="input"
                placeholder="Portfolio/website URL"
                value={form.portfolioUrl}
                onChange={(e) => onChange('portfolioUrl', e.target.value)}
              />

              <input
                className="input"
                placeholder="Current company (optional)"
                value={form.currentCompany}
                onChange={(e) => onChange('currentCompany', e.target.value)}
              />
              <input
                className="input"
                placeholder="Location (optional city/state)"
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
