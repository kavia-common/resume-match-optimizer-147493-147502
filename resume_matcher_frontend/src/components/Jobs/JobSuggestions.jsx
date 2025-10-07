import React, { useMemo } from 'react';

/**
 * PUBLIC_INTERFACE
 * JobSuggestions - Renders a list of suggested jobs with match scores and actions.
 *
 * Props:
 * - suggestions?: Array<{
 *     id: string|number,
 *     title: string,
 *     company?: string,
 *     location?: string,
 *     summary?: string,
 *     matchScore?: number, // 0-100
 *     postedAt?: string,   // ISO or human friendly
 *     url?: string
 *   }>
 * - onSelect?: (job) => void  // select action callback
 * - isLoading?: boolean
 * - error?: string | { message: string }
 * - heading?: string
 * - emptyText?: string
 *
 * Notes:
 * - Does not call APIs. Only displays data and emits onSelect(job).
 * - Ocean Professional styling using existing classes.
 * - Includes ARIA roles/labels for accessibility.
 */
export default function JobSuggestions({
  suggestions = [],
  onSelect,
  isLoading = false,
  error = null,
  heading = 'Suggested Jobs',
  emptyText = 'No job suggestions yet. Try refining your search or run "Get Suggestions".',
}) {
  const errText = useMemo(() => {
    if (!error) return null;
    return typeof error === 'string' ? error : error.message;
  }, [error]);

  return (
    <section className="panel" aria-label="Job suggestions panel">
      <header style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>{heading}</h3>
        <p className="description">Review potential matches and select jobs to analyze further.</p>
      </header>

      {isLoading && (
        <div role="status" aria-live="polite" className="card" style={{ marginBottom: 12 }}>
          Loading suggestions…
        </div>
      )}

      {errText && (
        <div
          role="alert"
          aria-live="assertive"
          className="card"
          style={{ color: 'var(--color-error)', marginBottom: 12, fontWeight: 600 }}
        >
          {errText}
        </div>
      )}

      {!isLoading && !errText && (!Array.isArray(suggestions) || suggestions.length === 0) && (
        <div className="card" aria-label="No suggestions">
          <p className="description" style={{ margin: 0 }}>{emptyText}</p>
        </div>
      )}

      {Array.isArray(suggestions) && suggestions.length > 0 && (
        <ul
          aria-label="Suggested jobs list"
          style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}
        >
          {suggestions.map((job, idx) => {
            const {
              id,
              title,
              company,
              location,
              summary,
              matchScore,
              postedAt,
              url,
            } = job || {};

            // Clamp and format score if present
            const hasScore = typeof matchScore === 'number' && !Number.isNaN(matchScore);
            const score = hasScore ? Math.max(0, Math.min(100, Math.round(matchScore))) : null;
            const scoreColor = score != null && score >= 75
              ? 'var(--color-primary)'
              : score != null && score >= 50
                ? 'var(--color-secondary)'
                : 'var(--color-text-muted)';

            return (
              <li key={id ?? idx} className="card" aria-label={`Job: ${title || 'Untitled job'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0 }}>{title || 'Untitled job'}</h4>
                      {company && (
                        <div style={{ color: 'var(--color-text-muted)' }}>• {company}</div>
                      )}
                      {location && (
                        <div style={{ color: 'var(--color-text-muted)' }}>• {location}</div>
                      )}
                    </div>
                    {summary && (
                      <p style={{ marginTop: 8, marginBottom: 0, color: 'var(--color-text)' }}>
                        {summary}
                      </p>
                    )}
                    <div style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      {postedAt && (
                        <span
                          aria-label={`Posted at ${postedAt}`}
                          style={{ color: 'var(--color-text-muted)', fontSize: 14 }}
                        >
                          Posted: {postedAt}
                        </span>
                      )}
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Open job posting in new tab"
                          style={{ fontSize: 14 }}
                        >
                          View posting ↗
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    {hasScore && (
                      <div
                        role="meter"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={score}
                        aria-label={`Match score ${score} out of 100`}
                        style={{ fontWeight: 700, color: scoreColor }}
                        title={`Match score: ${score}/100`}
                      >
                        {score}/100
                      </div>
                    )}
                    {onSelect && (
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => onSelect(job)}
                        aria-label={`Select job ${title || id || idx}`}
                        title="Select this job"
                      >
                        Select
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
