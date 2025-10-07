import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import '../App.css';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import Container from '../components/Layout/Container';

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
    <div className="App">
      <Sidebar />
      <main className="main" role="main" aria-label="Main content">
        <Header onToggleTheme={onToggleTheme} theme={theme} />
        <Container>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/resume" element={<ResumeOptimizerPage />} />
            <Route path="/match" element={<JobMatcherPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </main>
    </div>
  );
}
