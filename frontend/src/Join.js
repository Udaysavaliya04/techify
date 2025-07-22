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
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(circle at 25% 25%, hsl(var(--muted) / 0.1) 0%, transparent 25%),
        radial-gradient(circle at 75% 75%, hsl(var(--muted) / 0.05) 0%, transparent 25%),
        hsl(var(--background))
      `,
      position: 'relative'
    }}>
      
      <header style={{
        position: 'fixed',
        top: '1rem',
        left: '1rem',
        right: '1rem',
        zIndex: 50,
        background: 'hsl(var(--background) / 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid hsl(var(--border))',
        borderRadius: '12px',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img 
            src="/logo.png" 
            alt="Techify Logo" 
            style={{ 
              height: '40px',
              width: 'auto'
            }}
          />
        </div>
        
        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isAuthenticated() ? (
            <>
              <span style={{ 
                color: 'hsl(var(--muted-foreground))', 
                fontSize: '0.875rem'
              }}>
                {user?.username}
              </span>
              <Link 
                to="/dashboard" 
                className="action-btn save-btn"
                style={{ 
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  padding: '0.5rem 1rem'
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
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'color 0.2s ease'
                }}
           
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="action-btn run-btn"
                style={{ 
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  padding: '0.5rem 1rem'
                }}
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main style={{
        paddingTop: '4rem',
        paddingBottom: '4rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 12rem)',
        padding: '4rem 2rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Show different content based on authentication and role */}
        {isAuthenticated() && user?.role === 'candidate' ? (
          // Candidate Join Interface
          <div style={{
            textAlign: 'center',
            maxWidth: '500px',
            width: '100%',
            background: 'hsl(var(--card) / 0.5)',
            backdropFilter: 'blur(20px)',
            border: '1px solid hsl(var(--border) / 0.5)',
            borderRadius: 'calc(var(--radius) * 1.5)',
            padding: '3rem',
            marginTop: '6rem',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)'
          }}>
            <h1 style={{ 
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              marginBottom: '1rem',
              color: 'hsl(var(--foreground))',
              letterSpacing: '-0.07em',background: 'linear-gradient(135deg, #ffffff, #c7c7c7ff, #ffffffff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Join Interview
            </h1>
            
            <p style={{ 
              fontSize: '1.125rem',
              color: 'hsl(var(--muted-foreground))',
              marginBottom: '3rem',
              lineHeight: '1.6',
              letterSpacing: '-0.05em'
            }}>
              Enter the 6-digit interview code provided by your interviewer
            </p>

            <form onSubmit={joinRoom} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="otp-container">
                <div className="otp-inputs" onPaste={handlePaste}>
                  {otpValues.map((value, index) => (
                    <input
                      key={index}
                      ref={el => inputRefs.current[index] = el}
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
                className={`action-btn run-btn ${room.length !== 6 ? 'disabled' : ''}`}
                style={{ width: '100%' }}
              >
                Join Interview Room
              </button>
            </form>
          </div>
        ) : isAuthenticated() && user?.role === 'interviewer' ? (
          // Interviewer Dashboard CTA
          <div style={{
            textAlign: 'center',
            maxWidth: '500px',
            width: '100%',
            background: 'hsl(var(--card) / 0.5)',
            backdropFilter: 'blur(20px)',
            border: '1px solid hsl(var(--border) / 0.5)',
            borderRadius: 'calc(var(--radius) * 1.5)',
            padding: '3rem',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)'
          }}>
            <h1 style={{ 
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              marginBottom: '1rem',
              color: 'hsl(var(--foreground))'
            }}>
              Welcome Back
            </h1>
            
            <p style={{ 
              fontSize: '1.125rem',
              color: 'hsl(var(--muted-foreground))',
              marginBottom: '3rem',
              lineHeight: '1.6'
            }}>
              Ready to conduct technical interviews? Head to your dashboard to create rooms and manage sessions.
            </p>
            
            <Link 
              to="/dashboard" 
              className="action-btn run-btn"
              style={{
                display: 'inline-block',
                textDecoration: 'none'
              }}
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
            // Homepage Hero Section for Unauthenticated Users
            <div style={{ 
            textAlign: 'center',
            maxWidth: '1200px',
            width: '100%'
            }}>
            <h1 style={{ 
              paddingTop: '6rem',
              fontSize: 'clamp(2.5rem, 6vw, 7rem)',
              marginBottom: '1.5rem',
              lineHeight: '1.1',
              color: 'hsl(var(--foreground))',
              fontWeight: '800',
              letterSpacing: '-0.08em',
              background: 'linear-gradient(135deg, #ffffff, #acacacff, #ffffffff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Technical Interviews<br />Made Simple!
            </h1>
            
            <p style={{ 
              fontSize: '1.25rem',
              color: 'hsl(var(--muted-foreground))',
              marginBottom: '3rem',
              lineHeight: '1.6',
              maxWidth: '600px',
              margin: '0 auto 3rem auto',
              letterSpacing: '-0.05em',
              background: 'linear-gradient(135deg, #ffffff, #9b9b9bff, #ffffffff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Conduct seamless remote technical interviews with real-time collaboration, AI assistance, and comprehensive evaluation tools.
            </p>

            {/* CTA Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '5rem'
            }}>
              <Link 
                to="/register" 
                className="action-btn run-btn"
                style={{
                  display: 'inline-block',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  padding: '0.875rem 2rem',
                }}
              >
                Get Started
              </Link>
              
              <Link 
                to="/login" 
                className="action-btn save-btn"
                style={{
                  display: 'inline-block',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  padding: '0.875rem 2rem'
                }}
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </main>
      
      {!(isAuthenticated() && user?.role === 'candidate') && (
        <footer style={{
          position:'fixed',
          zIndex: 1,
          bottom: '1rem',
          left: '1rem',
          right: '1rem',
          background: 'hsl(var(--background) / 0.8)',
          border: '1px solid hsl(var(--border))',
          padding: '1rem 2rem',
          textAlign: 'center',
          borderRadius: '12px',
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: 'hsl(var(--muted-foreground))',
            margin: 0,
            fontWeight: '500',
            letterSpacing: '-0.05em',
          }}>
            Made with ❤️ by Uday Savaliya
          </p>
        </footer>
      )}
    </div>
  );
} 