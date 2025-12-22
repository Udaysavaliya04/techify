import React from 'react';
import { Link } from 'react-router-dom';
import './App.css';

export default function Homepage() {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="/logo.webp"
            alt="Techify Logo"
            style={{
              height: '40px',
              width: 'auto'
            }}
          />
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
        </nav>
      </header>

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
      </main>

      <footer style={{
        position: 'fixed',
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
    </div>
  );
}