import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Header - Top application bar with brand/title and actions.
 * - Shows app title
 * - Includes a button placeholder for theme toggle (callback prop)
 *
 * Props:
 * - onToggleTheme?: () => void
 * - theme?: 'light'|'dark'|string
 */
export default function Header({ onToggleTheme, theme = 'light' }) {
  const nextMode = theme === 'light' ? 'dark' : 'light';

  return (
    <header className="header" role="banner" aria-label="Application header">
      <div className="title" aria-label="Application title">
        Resume Match Optimizer
      </div>
      <div className="actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${nextMode} mode`}
          title={`Switch to ${nextMode} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </header>
  );
}
