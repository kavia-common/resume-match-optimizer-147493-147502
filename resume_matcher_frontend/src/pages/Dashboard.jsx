import React, { useEffect, useState } from 'react';
import Container from '../components/Layout/Container';
import { SkeletonBlock, SkeletonText } from '../components/Common/Skeleton';
import EmptyState from '../components/Common/EmptyState';
import theme from '../constants/theme';

// PUBLIC_INTERFACE
export default function Dashboard() {
  /**
   * Dashboard - Overview page that shows loading skeletons while fetching,
   * and a friendly empty state when there is no data.
   */
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Simulate async fetch; replace with real API call
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const t = setTimeout(() => {
      if (!mounted) return;
      // Start with no data to showcase empty state UX
      setStats(null);
      setLoading(false);
    }, 700);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, []);

  return (
    <Container as="section" role="region" ariaLabel="Dashboard overview">
      {loading ? (
        <div role="status" aria-live="polite" aria-label="Loading dashboard content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
            <SkeletonBlock height={92} />
            <SkeletonBlock height={92} />
            <SkeletonBlock height={92} />
          </div>
          <SkeletonText lines={3} width="100%" />
        </div>
      ) : !stats ? (
        <EmptyState
          title="Get started on your journey"
          description="Upload a resume to see optimization tips, track improvements, and match with relevant jobs."
          primaryActionText="Upload Resume"
          onPrimaryAction={() => { window.location.href = '/resume-optimizer'; }}
          secondaryActionText="Find Jobs"
          onSecondaryAction={() => { window.location.href = '/job-matcher'; }}
          icon={
            <svg width="28" height="28" viewBox="0 0 24 24" fill={theme.colors.primary} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM13 9V3.5L18.5 9H13Z" />
            </svg>
          }
        />
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div className="panel">
              <div style={{ color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>Resumes</div>
              <div style={{ color: 'var(--color-text)', fontSize: 28, fontWeight: 700 }}>{stats.resumes}</div>
            </div>
            <div className="panel">
              <div style={{ color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>Matches</div>
              <div style={{ color: 'var(--color-text)', fontSize: 28, fontWeight: 700 }}>{stats.matches}</div>
            </div>
            <div className="panel">
              <div style={{ color: 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>Suggestions</div>
              <div style={{ color: 'var(--color-text)', fontSize: 28, fontWeight: 700 }}>{stats.suggestions}</div>
            </div>
          </div>
          <p>Welcome back! Explore your matches and refine your resume.</p>
        </div>
      )}
    </Container>
  );
}
