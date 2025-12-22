import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      position: 'fixed',
      bottom: '1rem',
      left: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.75rem',
      color: 'hsl(var(--muted-foreground))',
      zIndex: 50
    }}>
      <span>Made with</span>
      <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>❤️</span>
      <div style={{
        width: '1px',
        height: '1rem',
        background: 'hsl(var(--border))',
        margin: '0 0.25rem'
      }}></div>
      <span style={{
        padding: '0.125rem 0.375rem',
        background: 'hsl(var(--background))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'calc(var(--radius) - 2px)',
        fontSize: '0.75rem'
      }}>
        by Uday Savaliya
      </span>
    </footer>
  );
};

export default Footer;