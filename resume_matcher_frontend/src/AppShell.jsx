import React, { useState, useEffect } from 'react';
import './App.css';
import AppRoutes from './routes/AppRoutes';

/**
 * Resolve initial theme:
 * - If localStorage has a saved value ('light' | 'dark'), use it
 * - Else, use system preference via matchMedia('(prefers-color-scheme: dark)')
 * - Default to 'light'
 */
function resolveInitialTheme() {
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // ignore storage access errors
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }
  return 'light';
}

// PUBLIC_INTERFACE
export default function AppShell() {
  const [theme, setTheme] = useState(() => resolveInitialTheme());

  // Apply theme to document element and persist selection
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // ignore storage access errors
    }
  }, [theme]);

  // Respond to system theme changes if user hasn't explicitly chosen (i.e., no localStorage value)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    let userHasPreference = false;
    try {
      const saved = localStorage.getItem('theme');
      userHasPreference = saved === 'light' || saved === 'dark';
    } catch {
      userHasPreference = false;
    }
    if (userHasPreference) return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    // Modern API
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    // Fallback for older browsers
    if (typeof mql.addListener === 'function') {
      mql.addListener(handler);
      return () => mql.removeListener(handler);
    }
  }, []);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <AppRoutes onToggleTheme={toggleTheme} theme={theme} />
  );
}
