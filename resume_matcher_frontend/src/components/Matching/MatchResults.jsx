import React, { useMemo, useState } from 'react';
import { exportJSON, copyToClipboard } from '../../utils/export';

/**
 * PUBLIC_INTERFACE
 * MatchResults - Displays the results of a resume-to-job match in a presentational way.
 *
 * Props:
 * - matchScore: number (0-100) overall match score
 * - highlights: string[] list of positive highlights
 * - improvements: Array<{
 *     id?: string|number,
 *     title: string,
 *     detail?: string
 *   }>
 * - heading?: string (optional section title)
 * - onApplySuggestion?: (improvement) => void (optional callback to apply an improvement)
 *
 * Notes:
 * - This component is purely presentational: no API calls.
 * - Uses Ocean Professional style classes from index.css/App.css (panel, card, btn, etc.).
 */
export default function MatchResults({
  matchScore = null,
  highlights = [],
  improvements = [],
  heading = 'Match Results',
  onApplySuggestion,
}) {
  const [selectedImprovementText, setSelectedImprovementText] = useState('');

  const clampedScore = useMemo(() => {
    if (typeof matchScore !== 'number' || Number.isNaN(matchScore)) return null;
    return Math.max(0, Math.min(100, Math.round(matchScore)));
  }, [matchScore]);

  const scoreColor = useMemo(() => {
    if (clampedScore == null) return 'var(--color-text-muted)';
    if (clampedScore >= 75) return 'var(--color-primary)';
    if (clampedScore >= 50) return 'var(--color-secondary)';
    return 'var(--color-text-muted)';
  }, [clampedScore]);

  const exportPayload = useMemo(
    () => ({
      matchScore: clampedScore,
      highlights: Array.isArray(highlights) ? highlights : [],
      improvements: Array.isArray(improvements) ? improvements : [],
      exportedAt: new Date().toISOString(),
      source: 'MatchResults',
    }),
    [clampedScore, highlights, improvements]
  );

  const handleCopyAllImprovements = async () => {
    const list = Array.isArray(improvements) ? improvements : [];
    const normalized = list.map((imp) => [imp?.title, imp?.detail].filter(Boolean).join(' - '));
    await copyToClipboard(normalized.join('\n'));
  };

  const handleCopySelectedImprovement = async () => {
    if (!selectedImprovementText) return;
    await copyToClipboard(selectedImprovementText);
  };

  return (
    <section className="panel" aria-label="Match results panel">
      <header className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>{heading}</h3>
          {clampedScore != null && (
            <div
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={clampedScore}
              aria-label={`Overall match score ${clampedScore} out of 100`}
              style={{ fontWeight: 700, color: scoreColor, marginTop: 6 }}
              title={`Match score: ${clampedScore}/100`}
            >
              Match Score: {clampedScore}/100
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="btn"
            onClick={() => exportJSON('match-results.json', exportPayload)}
            aria-label="Export match results as JSON"
            title="Export results JSON"
          >
            Export JSON
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCopyAllImprovements}
            aria-label="Copy all improvements to clipboard"
            title="Copy all improvements"
          >
            Copy Improvements
          </button>
        </div>
      </header>

      {/* Highlights */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h4 style={{ marginTop: 0 }}>Highlights</h4>
        {Array.isArray(highlights) && highlights.length > 0 ? (
          <ul
            aria-label="Match highlights"
            style={{
              listStyle: 'disc',
              paddingLeft: 20,
              marginTop: 8,
              marginBottom: 0,
              display: 'grid',
              gap: 8,
            }}
          >
            {highlights.map((h, idx) => (
              <li key={`${h}-${idx}`} style={{ color: 'var(--color-text)' }}>
                {h}
              </li>
            ))}
          </ul>
        ) : (
          <p className="description" style={{ margin: 0 }}>No highlights identified.</p>
        )}
      </div>

      {/* Improvements */}
      <div className="card">
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <h4 style={{ marginTop: 0 }}>Improvements</h4>
          <button
            type="button"
            className="btn-ghost"
            onClick={handleCopySelectedImprovement}
            aria-label="Copy selected improvement to clipboard"
            title="Copy selected improvement"
            disabled={!selectedImprovementText}
          >
            Copy Selected
          </button>
        </div>
        {Array.isArray(improvements) && improvements.length > 0 ? (
          <ul aria-label="Improvement suggestions" style={{ paddingLeft: 18, margin: 0 }}>
            {improvements.map((imp, idx) => {
              const title = imp?.title ?? '';
              const detail = imp?.detail ?? '';
              const fullText = [title, detail].filter(Boolean).join(' - ');
              return (
                <li
                  key={imp.id ?? idx}
                  style={{ marginBottom: 12, cursor: 'text' }}
                  onMouseUp={() => {
                    const sel = window.getSelection()?.toString();
                    setSelectedImprovementText(sel?.trim() ? sel : fullText);
                  }}
                  aria-label={`Improvement ${idx + 1}`}
                  title={fullText}
                >
                  <div style={{ fontWeight: 600 }}>{title}</div>
                  {detail && (
                    <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                      {detail}
                    </div>
                  )}
                  {onApplySuggestion && (
                    <div style={{ marginTop: 6 }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => onApplySuggestion(imp)}
                        aria-label={`Apply improvement: ${title}`}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="description" style={{ margin: 0 }}>No improvements suggested.</p>
        )}
      </div>
    </section>
  );
}
