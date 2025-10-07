import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * Sidebar - Application navigation with responsive/collapsible behavior.
 * - Renders navigation links (Dashboard, Resume Optimizer, Job Matcher, Settings)
 * - Uses NavLink for active state styling
 * - Provides ARIA landmarks and labels for accessibility
 * - Collapsible on small screens via a toggle button
 */
export default function Sidebar() {
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(true);

  // Track viewport to enable collapsible mode at <= 768px
  useEffect(() => {
    const check = () => {
      const mobile = window.matchMedia('(max-width: 768px)').matches;
      setIsMobile(mobile);
      setOpen(!mobile); // default open on desktop, collapsed on mobile
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggle = () => setOpen(prev => !prev);

  return (
    <aside
      className="sidebar"
      role="navigation"
      aria-label="Primary"
      style={isMobile ? { position: 'relative' } : undefined}
    >
      <div className="brand" aria-label="Brand">
        <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>⎈</span>
        <span>Resume Match Optimizer</span>
        {isMobile && (
          <button
            type="button"
            className="button-toggle"
            onClick={toggle}
            aria-expanded={open}
            aria-controls="sidebar-nav"
            style={{ marginLeft: 'auto' }}
          >
            {open ? 'Hide Menu' : 'Show Menu'}
          </button>
        )}
      </div>

      <nav
        id="sidebar-nav"
        className="nav-group"
        aria-label="Main navigation"
        style={isMobile && !open ? { display: 'none' } : undefined}
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          aria-label="Dashboard"
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/resume"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          aria-label="Resume Optimizer"
        >
          Resume Optimizer
        </NavLink>

        <NavLink
          to="/match"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          aria-label="Job Matcher"
        >
          Job Matcher
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          aria-label="Settings"
        >
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}
