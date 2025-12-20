import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';

export default function AuthLayout({
    title,
    subtitle,
    children,
    footerText,
    footerLinkText,
    footerLinkTo,
    alertMessage
}) {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            background: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('/backgroundhd.webp')`,
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 18 6-6-6-6" />
                    </svg>
                </button>
            </div>

            {/* Logo */}
            <div className="logo-section" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <img src="/logo.webp" alt="Techify Logo" style={{ height: '60px', width: 'auto' }} />
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
                {/* Header */}
                <div className="form-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: 'hsl(var(--foreground))',
                        margin: '0 0 0.5rem 0',
                        letterSpacing: '-0.05em'
                    }}>
                        {title}
                    </h2>
                    <p style={{
                        fontSize: '0.875rem',
                        color: 'hsl(var(--muted-foreground))',
                        margin: '0'
                    }}>
                        {subtitle}
                    </p>
                    {alertMessage && (
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
                            {alertMessage}
                        </div>
                    )}
                </div>

                {/* Form Content */}
                {children}

                {/* Footer */}
                <div className="footer-section" style={{
                    marginTop: '1.5rem',
                    textAlign: 'center',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid hsl(var(--border))'
                }}>
                    <p style={{
                        fontSize: '0.875rem',
                        color: 'hsl(var(--muted-foreground))',
                        margin: '0'
                    }}>
                        {footerText}{' '}
                        <Link to={footerLinkTo} style={{
                            color: 'hsl(var(--primary))',
                            textDecoration: 'none',
                            fontWeight: '500'
                        }}>
                            {footerLinkText}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
