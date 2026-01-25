import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './components/AuthWrapper';
import Footer from './components/Footer';
import './App.css';

function randomRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function Join() {
  const [room, setRoom] = useState('');
  const [role, setRole] = useState('candidate');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const navigate = useNavigate();
  const inputRefs = useRef([]);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    setRoom(otpValues.join(''));
  }, [otpValues]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;

    const newValues = [...otpValues];
    newValues[index] = value.toUpperCase();
    setOtpValues(newValues);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').toUpperCase().slice(0, 6);
    const newValues = [...otpValues];

    for (let i = 0; i < 6; i++) {
      newValues[i] = pastedData[i] || '';
    }
    setOtpValues(newValues);

    // Focus the last filled input or the first empty one
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (room.trim()) {
      navigate(`/room/${room.trim().toUpperCase()}`, { state: { role } });
    }
  };

  const createRoom = () => {
    const id = randomRoomId();
    navigate(`/room/${id}`, { state: { role: 'interviewer' } });
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
      }}
    >
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
          <a
            href="https://github.com/Udaysavaliya04/techify"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ color: "hsl(var(--foreground))" }}>
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </nav>
      </header>

      {/* Mobile Notice Banner */}
      <div
        style={{
          position: "fixed",
          top: "12rem",
          left: "1rem",
          right: "1rem",
          zIndex: 60,
          background: "rgba(22, 22, 22, 0.75)",
          backdropFilter: "blur(25px) saturate(180%)",
          WebkitBackdropFilter: "blur(25px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px",
          padding: "1.25rem 1.5rem",
          boxShadow:
            "0 20px 40px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          display: window.innerWidth <= 768 ? "block" : "none",
          animation: "slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="mobile-notice"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "#ffffff",
            fontSize: window.innerWidth <= 480 ? "0.75rem" : "0.875rem",
            fontWeight: "500",
            lineHeight: "1.4",
          }}
        >
          <div style={{ fontSize: "1.5rem" }}>  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "hsl(var(--foreground))" }}>
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg></div>
          <div>
            <div
              style={{
                fontWeight: "600",
                marginBottom: "0.25rem",
                color: "#ffffff",
              }}
            >
              Desktop Experience Recommended
            </div>
            <div style={{ opacity: 0.85, color: "#e5e5e5" }}>
              This platform shines brightest on desktop! It's not optimized for
              mobile devices yet. <br></br>It is recommended to use a laptop strictly for the ultimate
              Interview experience.
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main
        style={{
          paddingTop: window.innerWidth <= 768 ? "8rem" : "4rem",
          paddingBottom: "4rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 12rem)",
          padding:
            window.innerWidth <= 768 ? "8rem 1rem 4rem 1rem" : "4rem 2rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Show different content based on authentication and role */}
        {isAuthenticated() && user?.role === "candidate" ? (
          // Candidate Join Interface
          <div
            className="auth-card"
            style={{
              textAlign: "center",
              maxWidth: "500px",
              width: "100%",
              backdropFilter: "blur(30px)",
              border: "1px solid hsl(var(--border) / 0.5)",
              borderRadius: "calc(var(--radius) * 1.5)",
              padding: window.innerWidth <= 768 ? "2rem 1.5rem" : "3rem",
              marginTop: window.innerWidth <= 768 ? "2rem" : "6rem",
              boxShadow:
                "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
            }}
          >
            <h1
              style={{
                fontSize:
                  window.innerWidth <= 480
                    ? "clamp(1.5rem, 6vw, 2.5rem)"
                    : window.innerWidth <= 768
                      ? "clamp(1.8rem, 5vw, 2.8rem)"
                      : "clamp(2rem, 4vw, 3rem)",
                fontWeight: "700",
                marginBottom: "1rem",
                color: "hsl(var(--foreground))",
                letterSpacing: "-0.07em",
                background:
                  "linear-gradient(135deg, #ffffff, #c7c7c7ff, #ffffffff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Join Interview
            </h1>

            <p
              style={{
                fontSize:
                  window.innerWidth <= 480
                    ? "0.875rem"
                    : window.innerWidth <= 768
                      ? "1rem"
                      : "1.125rem",
                color: "hsl(var(--muted-foreground))",
                marginBottom: "3rem",
                lineHeight: "1.6",
                letterSpacing: "-0.05em",
              }}
            >
              Enter the 6-digit interview code provided by your interviewer
            </p>

            <form
              onSubmit={joinRoom}
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              <div className="otp-container">
                <div className="otp-inputs" onPaste={handlePaste}>
                  {otpValues.map((value, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      className="otp-input"
                      value={value}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      maxLength={1}
                      autoComplete="off"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={room.length !== 6}
                className={`action-btn run-btn ${room.length !== 6 ? "disabled" : ""
                  }`}
                style={{ width: "100%" }}
              >
                Join Interview Room
              </button>
            </form>
          </div>
        ) : isAuthenticated() && user?.role === "interviewer" ? (
          // Interviewer Dashboard CTA
          <div
            className="auth-card"
            style={{
              marginTop: '125px',
              paddingTop: '20px',
              textAlign: "center",
              maxWidth: "500px",
              width: "100%",
              backdropFilter: "blur(30px)",
              border: "1px solid hsl(var(--border) / 0.5)",
              borderRadius: "calc(var(--radius) * 1.5)",
              padding: window.innerWidth <= 768 ? "2rem 1.5rem" : "3rem",
              boxShadow:
                "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
            }}
          >
            <h1
              style={{
                fontSize:
                  window.innerWidth <= 480
                    ? "clamp(1.5rem, 6vw, 2.5rem)"
                    : window.innerWidth <= 768
                      ? "clamp(1.8rem, 5vw, 2.8rem)"
                      : "clamp(2rem, 4vw, 3rem)",
                fontWeight: "700",
                marginBottom: "1rem",
                color: "hsl(var(--foreground))",
                letterSpacing: "-0.05em",
              }}
            >
              Welcome Back
            </h1>

            <p
              style={{
                fontSize:
                  window.innerWidth <= 480
                    ? "0.875rem"
                    : window.innerWidth <= 768
                      ? "1rem"
                      : "1.125rem",
                color: "hsl(var(--muted-foreground))",
                marginBottom: "3rem",
                lineHeight: "1.6",
                letterSpacing: "-0.05em",
                fontWeight: "400",
              }}
            >
              Ready to conduct technical interviews? 
              <br></br>Head to your dashboard to
              create rooms and manage sessions.
            </p>

            <Link
              to="/dashboard"
              className="action-btn run-btn"
              style={{
                display: "inline-block",
                textDecoration: "none",
                minWidth: "400px",
              }}
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          // Homepage Hero Section for Unauthenticated Users
          <div
            className="hero-section"
            style={{
              textAlign: "center",
              maxWidth: "1200px",
              width: "100%",
            }}
          >
            <h1
              className="hero-title"
              style={{
                paddingTop: window.innerWidth <= 768 ? "2rem" : "6rem",
                fontSize:
                  window.innerWidth <= 480
                    ? "clamp(1.8rem, 8vw, 4rem)"
                    : "clamp(2.5rem, 6vw, 7rem)",
                marginBottom: "1.5rem",
                lineHeight: "1",
                fontWeight: "800",
                letterSpacing: "-0.08em",
              }}
            >
              <span
                style={{
                  background: "linear-gradient(180deg, #ffffff 0%, #ffffffff 25%, #ffffffff 50%, #7bd1ffff 75%, #00b3ffff 100%)",
                  backgroundSize: "200% 200%",
                  fontSize:
                    window.innerWidth <= 360
                      ? "2.5rem"
                      : window.innerWidth <= 480
                        ? "3.5rem"
                        : window.innerWidth <= 768
                          ? "5rem"
                          : "8rem",
                  WebkitBackgroundClip: "text",
                  letterSpacing:
                    window.innerWidth <= 480 ? "-0.03em" : "-0.08em",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "block",
                  fontWeight: "700",
                  fontFamily: "'Familjen Grotesk', sans-serif",
                  animation: "gradientShift 1s ease-in-out infinite",
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                }}
              >
                Technical Interviews
              </span>
              <span
                style={{
                   background: "linear-gradient(180deg, #ffffff 0%, #ffffffff 25%, #91bdffff 50%, #46beffff 75%, #00b3ffff 100%)",
                  backgroundSize: "150% 150%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "block",
                  fontWeight: "900",
                  fontSize:
                    window.innerWidth <= 360
                      ? "3.5rem"
                      : window.innerWidth <= 480
                        ? "4.5rem"
                        : window.innerWidth <= 768
                          ? "6.5rem"
                          : "10rem", 
                  fontFamily: " 'Familjen Grotesk', sans-serif",
                  letterSpacing:
                    window.innerWidth <= 480 ? "-0.03em" : "-0.08em",
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                }}
              >
                Made Simple!
              </span>
            </h1>

            <p
              className="hero-subtitle"
              style={{
                fontSize:
                  window.innerWidth <= 360
                    ? "0.75rem"
                    : window.innerWidth <= 480
                      ? "0.875rem"
                      : window.innerWidth <= 768
                        ? "1rem"
                        : "1.25rem",
                color: "hsl(var(--muted-foreground))",
                marginBottom: "3rem",
                lineHeight: "1.6",
                maxWidth: window.innerWidth <= 768 ? "90%" : "600px",
                margin: "0 auto 3rem auto",
                letterSpacing: "-0.05em",
                background:
                  "linear-gradient(135deg, #ffffff, #9b9b9bff, #ffffffff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Conduct seamless remote technical interviews with real-time
              collaboration, AI assistance, and comprehensive evaluation tools.
            </p>

            {/* CTA Buttons */}
            <div
              className="cta-buttons"
              style={{
                display: "flex",
                gap: window.innerWidth <= 480 ? "0.5rem" : "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: "5rem",
                flexDirection: window.innerWidth <= 480 ? "column" : "row",
                alignItems: "center",
              }}
            >
              <Link
                to="/register"
                className="action-btn run-btn"
                style={{
                  display: "inline-block",
                  textDecoration: "none",
                  fontSize:
                    window.innerWidth <= 360
                      ? "0.75rem"
                      : window.innerWidth <= 480
                        ? "0.8rem"
                        : window.innerWidth <= 768
                          ? "0.875rem"
                          : "1rem",
                  padding:
                    window.innerWidth <= 480
                      ? "0.875rem 1.25rem"
                      : window.innerWidth <= 768
                        ? "0.75rem 1.5rem"
                        : "0.875rem 2rem",
                  width: window.innerWidth <= 480 ? "100%" : "auto",
                  textAlign: "center",
                }}
              >
                Get Started
              </Link>

              <Link
                to="/login"
                className="action-btn save-btn"
                style={{
                  display: "inline-block",
                  textDecoration: "none",
                  fontSize:
                    window.innerWidth <= 360
                      ? "0.75rem"
                      : window.innerWidth <= 480
                        ? "0.8rem"
                        : window.innerWidth <= 768
                          ? "0.875rem"
                          : "1rem",
                  padding:
                    window.innerWidth <= 480
                      ? "0.875rem 1.25rem"
                      : window.innerWidth <= 768
                        ? "0.75rem 1.5rem"
                        : "0.875rem 2rem",
                  background: "transparent",
                  backdropFilter: "blur(10px)",
                  width: window.innerWidth <= 480 ? "100%" : "auto",
                  textAlign: "center",
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </main>

      {!(isAuthenticated() && user?.role === "candidate") && (
        <footer
          className="footer-section"
          style={{
            position: "fixed",
            zIndex: 1,
            bottom: "1rem",
            left: "1rem",
            right: "1rem",
            backdropFilter: "blur(30px)",
            border: "1px solid hsl(var(--border))",
            padding: window.innerWidth <= 768 ? "0.75rem 1rem" : "1rem 2rem",
            textAlign: "center",
            borderRadius: "12px",
          }}
        >
          <p
            style={{
              fontSize:
                window.innerWidth <= 360
                  ? "0.625rem"
                  : window.innerWidth <= 480
                    ? "0.7rem"
                    : window.innerWidth <= 768
                      ? "0.75rem"
                      : "1rem",
              color: "hsl(var(--muted-foreground))",
              margin: 0,
              fontWeight: "500",
              letterSpacing: "-0.05em",
            }}
          >
            Made with <svg
            width="16"
            height="16"
            viewBox="0 0 24 18"
            fill="red"
            style={{
              display: "inline-block",
              filter: "drop-shadow(0 0 2px rgba(255, 0, 0, 0.6))",
              transform: "scale(1.1)",
              transition: "transform 0.3s ease-in-out infinite",
            }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg> by <a href="https://github.com/Udaysavaliya04" target="_blank" rel="noopener noreferrer" style={{ color: "rgb(235, 235, 235)", textDecoration: "none", transition: "opacity 0.2s ease", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "1"} onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}>Uday Savaliya</a>
          </p>
        </footer>
      )}
    </div>
  );
} 