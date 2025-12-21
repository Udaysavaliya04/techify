import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthWrapper';

export default function Header() {
    const { isAuthenticated, user } = useAuth();

    return (
        <header
            className="top-nav-button"
            style={{
                position: "fixed",
                top: "1rem",
                left: "1rem",
                right: "1rem",
                zIndex: 50,
                backdropFilter: "blur(30px)",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                padding: window.innerWidth <= 768 ? "0.75rem 1rem" : "1rem 2rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow:
                    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                flexWrap: window.innerWidth <= 480 ? "wrap" : "nowrap",
                gap: window.innerWidth <= 480 ? "0.5rem" : "0",
            }}
        >
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <img
                    src="/logo.webp"
                    alt="Techify Logo"
                    style={{
                        height: window.innerWidth <= 768 ? "32px" : "40px",
                        width: "auto",
                    }}
                />
            </div>

            {/* Navigation Links */}
            <nav
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: window.innerWidth <= 768 ? "0.5rem" : "1rem",
                    flexWrap: window.innerWidth <= 480 ? "wrap" : "nowrap",
                }}
            >
                {isAuthenticated() ? (
                    <>
                        <span
                            style={{
                                color: "hsl(var(--muted-foreground))",
                                fontSize: window.innerWidth <= 768 ? "0.75rem" : "0.875rem",
                            }}
                        >
                            {user?.username}
                        </span>
                        <Link
                            to="/dashboard"
                            className="action-btn run-btn"
                            style={{
                                textDecoration: "none",
                                fontSize: window.innerWidth <= 768 ? "0.75rem" : "0.875rem",
                                padding:
                                    window.innerWidth <= 768
                                        ? "0.375rem 0.75rem"
                                        : "0.5rem 1rem",
                            }}
                        >
                            Dashboard
                        </Link>
                    </>
                ) : (
                    <>
                        <Link
                            to="/login"
                            className="action-btn save-btn"
                            style={{
                                textDecoration: "none",
                                fontSize: window.innerWidth <= 768 ? "0.75rem" : "0.875rem",
                                fontWeight: "500",
                                transition: "color 0.2s ease",
                                background: "transparent",
                                backdropFilter: "blur(10px)",
                                padding:
                                    window.innerWidth <= 768
                                        ? "0.375rem 0.75rem"
                                        : "0.5rem 1rem",
                            }}
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/register"
                            className="action-btn run-btn"
                            style={{
                                textDecoration: "none",
                                fontSize: window.innerWidth <= 768 ? "0.75rem" : "0.875rem",
                                padding:
                                    window.innerWidth <= 768
                                        ? "0.375rem 0.75rem"
                                        : "0.5rem 1rem",
                            }}
                        >
                            Get Started
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}
