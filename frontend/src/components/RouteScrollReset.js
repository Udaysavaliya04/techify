import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TOP_RESET_PATHS = new Set([
  '/',
  '/join',
  '/register',
  '/dashboard',
  '/profile-setup',
  '/settings/profile',
  '/home',
  '/homepage'
]);

export default function RouteScrollReset() {
  const location = useLocation();

  useLayoutEffect(() => {
    if (!TOP_RESET_PATHS.has(location.pathname)) return;

    const resetToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const root = document.getElementById('root');
      if (root) root.scrollTop = 0;
    };

    resetToTop();
    const rafId = window.requestAnimationFrame(resetToTop);
    return () => window.cancelAnimationFrame(rafId);
  }, [location.pathname, location.key]);

  return null;
}

