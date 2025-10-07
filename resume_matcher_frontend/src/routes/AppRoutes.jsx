import React from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import '../App.css';

// Simple header component
function Header({ onToggleTheme, theme }) {
  return (
    <header className="header">
      <div className="title">Resume Match Optimizer</div>
      <div className="actions">
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </header>
  );
}

// Sidebar with navigation items
function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>⎈</span>
        <span>Ocean Pro</span>
      </div>
      <nav className="nav-group">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/resume" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          Resume Optimizer
        </NavLink>
        <NavLink to="/match" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          Job Matcher
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}

// Layout wraps header, sidebar, and main content
function Layout({ children, onToggleTheme, theme }) {
  return (
    <div className="App">
      <Sidebar />
      <main className="main">
        <Header onToggleTheme={onToggleTheme} theme={theme} />
        <div className="content container">
          {children}
        </div>
      </main>
    </div>
  );
}

// Placeholder pages to avoid runtime errors; replace with real implementations later.
function DashboardPage() {
  return (
    <section className="panel">
      <h2>Dashboard</h2>
      <p className="description">Overview and quick actions.</p>
    </section>
  );
}

function ResumeOptimizerPage() {
  return (
    <section className="panel">
      <h2>Resume Optimizer</h2>
      <p className="description">Upload or paste your resume to get ATS optimization suggestions.</p>
    </section>
  );
}

function JobMatcherPage() {
  return (
    <section className="panel">
      <h2>Job Matcher</h2>
      <p className="description">Find the most relevant jobs matching your resume.</p>
    </section>
  );
}

function SettingsPage() {
  return (
    <section className="panel">
      <h2>Settings</h2>
      <p className="description">Configure preferences and integrations.</p>
    </section>
  );
}

/**
 * PUBLIC_INTERFACE
 * AppRoutes - Defines application routes using React Router v6.
 * Routes:
 * - '/'          -> DashboardPage
 * - '/resume'    -> ResumeOptimizerPage
 * - '/match'     -> JobMatcherPage
 * - '/settings'  -> SettingsPage
 * - Fallback     -> redirect to '/'
 */
export default function AppRoutes({ onToggleTheme, theme }) {
  return (
    <Layout onToggleTheme={onToggleTheme} theme={theme}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/resume" element={<ResumeOptimizerPage />} />
        <Route path="/match" element={<JobMatcherPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
