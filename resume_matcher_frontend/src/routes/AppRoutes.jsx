import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import '../App.css';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import Container from '../components/Layout/Container';

import Dashboard from '../pages/Dashboard';
import ResumeOptimizer from '../pages/ResumeOptimizer';
import JobMatcher from '../pages/JobMatcher';
import Settings from '../pages/Settings';

/**
 * PUBLIC_INTERFACE
 * AppRoutes - Defines application routes using React Router v6.
 * Routes:
 * - '/'          -> Dashboard
 * - '/resume'    -> ResumeOptimizer
 * - '/match'     -> JobMatcher
 * - '/settings'  -> Settings
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
            <Route path="/" element={<Dashboard />} />
            <Route path="/resume" element={<ResumeOptimizer />} />
            <Route path="/match" element={<JobMatcher />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </main>
    </div>
  );
}
