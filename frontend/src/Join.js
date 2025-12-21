import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './components/AuthWrapper';
import Header from './components/Header';
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
      <Header />

      {/* Mobile Notice Banner */}
      <div
        style={{
          position: "fixed",
          top: "6rem",
          left: "1rem",
          right: "1rem",
          zIndex: 60,
          background:
            "linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.9))",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "1rem 1.5rem",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          display: window.innerWidth <= 768 ? "block" : "none",
          animation: "slideDown 0.5s ease-out",
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
          <div style={{ fontSize: "1.5rem" }}>💻</div>
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
              mobile devices. It is recommended to use a laptop for the ultimate
              coding interview experience.
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
                letterSpacing: '-0.1em',
              }}
            >
              Ready to conduct technical interviews? Head to your dashboard to
              create rooms and manage sessions.
            </p>

            <Link
              to="/dashboard"
              className="action-btn run-btn"
              style={{
                display: "inline-block",
                textDecoration: "none",
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
                lineHeight: "1.1",
                fontWeight: "800",
                letterSpacing: "-0.08em",
              }}
            >
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #ffffff, #acacacff, rgba(255, 255, 255, 1))",
                  fontSize:
                    window.innerWidth <= 360
                      ? "2rem"
                      : window.innerWidth <= 480
                        ? "2.5rem"
                        : window.innerWidth <= 768
                          ? "4rem"
                          : "6rem",
                  WebkitBackgroundClip: "text",
                  letterSpacing: "-0.08em",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "block",
                }}
              >
                Technical Interviews
              </span>
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #1E3A8A, #3B82F6, #87CEEB, #8B5CF6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  backgroundSize: "400% 400%",
                  animation: "gradientShift 15s ease-in-out infinite",
                  display: "block",
                  fontWeight: "900",
                  fontSize:
                    window.innerWidth <= 360
                      ? "2.2rem"
                      : window.innerWidth <= 480
                        ? "2.8rem"
                        : window.innerWidth <= 768
                          ? "4.5rem"
                          : "6.5rem",
                  letterSpacing:
                    window.innerWidth <= 480 ? "-0.06em" : "-0.1em",
                  transform: "translateZ(0)",
                  filter: "drop-shadow(0 0 8px rgba(135, 206, 235, 0.15))",
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
            Made with ❤️ by Uday Savaliya
          </p>
        </footer>
      )}
    </div>
  );
} 