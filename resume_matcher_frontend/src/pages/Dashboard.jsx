import React from 'react';
import Container from '../components/Layout/Container';

// PUBLIC_INTERFACE
export default function Dashboard() {
  /**
   * Dashboard - High-level overview with quick actions and recent items (placeholders only).
   * - Quick Actions: buttons to navigate to Resume Optimizer and Job Matcher
   * - Recent Items: placeholder lists for recent resumes and matches
   * - No API calls; to be wired later
   */
  return (
    <Container as="section" role="region" ariaLabel="Dashboard overview">
      <div className="panel" aria-label="Quick actions">
        <header style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Quick Actions</h2>
          <p className="description">Jump right into optimizing your resume or finding matching jobs.</p>
        </header>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="/resume" className="btn btn-primary" aria-label="Go to Resume Optimizer">
            Optimize Resume
          </a>
          <a href="/match" className="btn btn-outline" aria-label="Go to Job Matcher">
            Find Job Matches
          </a>
        </div>
      </div>

      <div className="panel" aria-label="Recent activity">
        <header style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Recent Activity</h3>
          <p className="description">Your latest uploads and matches will appear here.</p>
        </header>

        <div
          className="card"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
          role="list"
          aria-label="Recent items"
        >
          <div role="listitem" className="card">
            <h4 style={{ marginTop: 0 }}>Recent Resumes</h4>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>John Doe - Software Engineer (placeholder)</li>
              <li>Jane Smith - Data Analyst (placeholder)</li>
              <li>Product Manager - General (placeholder)</li>
            </ul>
          </div>

          <div role="listitem" className="card">
            <h4 style={{ marginTop: 0 }}>Recent Matches</h4>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Senior Frontend Engineer - 78% match (placeholder)</li>
              <li>Data Scientist - 66% match (placeholder)</li>
              <li>Project Manager - 54% match (placeholder)</li>
            </ul>
          </div>
        </div>
      </div>
    </Container>
  );
}
