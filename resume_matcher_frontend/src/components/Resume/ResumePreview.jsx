import React, { useMemo, useState } from 'react';
import { computeWordCount, estimateReadability, countKeywordFrequency, highlightKeywordsHtml } from '../../utils/text';
import { exportJSON, copyToClipboard } from '../../utils/export';

/**
 * PUBLIC_INTERFACE
 * ResumePreview - Displays analysis output for a resume.
 *
 * Expected data shape (from PlanningAgent):
 * {
 *   extractedText: string,
 *   atsScore: number, // 0-100
 *   keywords: string[], // extracted or missing keywords
 *   suggestions: Array<{ id: string|number, title: string, detail?: string }>
 * }
 *
 * Props:
 * - data: analysis object as above (all fields optional for robustness)
 * - onApplySuggestion?: (suggestion) => void
 * - localText?: string (optional) - when provided, enables "Local Insights" block without backend calls
 * - localKeywords?: string[] (optional) - seed keywords to highlight/analyze locally (fallbacks to data.keywords)
 */
export default function ResumePreview({ data, onApplySuggestion, localText = '', localKeywords = undefined }) {
  const [selectedSuggestionText, setSelectedSuggestionText] = useState('');

  // Normalize presence of local text first (do not early-return before hooks)
  const hasLocal = typeof localText === 'string' && localText.trim().length > 0;

  // Safely destructure data even when null
  const {
    extractedText = '',
    atsScore = null,
    keywords = [],
    suggestions = [],
  } = data || {};

  // Determine keywords to display/highlight: prefer provided localKeywords, then data.keywords
  const displayKeywords = useMemo(() => {
    const base = Array.isArray(localKeywords) && localKeywords.length > 0 ? localKeywords : keywords;
    return (Array.isArray(base) ? base : []).filter((k) => String(k || '').trim().length > 0);
  }, [localKeywords, keywords]);

  // Prepare export payload memoized (client-only, no backend)
  const analysisPayload = useMemo(
    () => ({
      extractedText: extractedText || '',
      atsScore: typeof atsScore === 'number' ? atsScore : null,
      keywords: Array.isArray(displayKeywords) ? displayKeywords : [],
      suggestions: Array.isArray(suggestions)
        ? suggestions.map((s) => (typeof s === 'string' ? { title: s } : s))
        : [],
      exportedAt: new Date().toISOString(),
      source: 'ResumePreview',
    }),
    [extractedText, atsScore, displayKeywords, suggestions]
  );

  // Compute local-only insights when localText is present (never calls backend)
  const localInsights = useMemo(() => {
    if (!hasLocal) return null;
    const wc = computeWordCount(localText);
    const readability = estimateReadability(localText);
    const freq = countKeywordFrequency(localText, displayKeywords);
    const highlighted = highlightKeywordsHtml(localText, displayKeywords);
    return {
      wordCount: wc,
      readability,
      keywordFrequency: freq,
      highlightedHtml: highlighted,
    };
  }, [hasLocal, localText, displayKeywords]);

  // After hooks, we may render a minimal empty state if both backend data and local text are missing
  const showEmpty = !data && !hasLocal;

  const handleCopyAllSuggestions = async () => {
    const list = Array.isArray(suggestions) ? suggestions : [];
    const normalized = list.map((s) => (typeof s === 'string' ? s : [s?.title, s?.detail].filter(Boolean).join(' - ')));
    await copyToClipboard(normalized.join('\n'));
  };

  const handleCopySelectedSuggestion = async () => {
    if (!selectedSuggestionText) return;
    await copyToClipboard(selectedSuggestionText);
  };

  if (showEmpty) {
    return (
      <section className="panel" aria-label="Resume analysis preview">
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h3 style={{ marginTop: 0 }}>Analysis Preview</h3>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn"
              aria-label="Export resume analysis as JSON"
              title="Export analysis JSON"
              onClick={() => exportJSON('resume-analysis.json', analysisPayload)}
            >
              Export JSON
            </button>
            <button
              type="button"
              className="btn-secondary"
              aria-label="Copy all suggestions to clipboard"
              title="Copy all suggestions"
              onClick={handleCopyAllSuggestions}
            >
              Copy Suggestions
            </button>
          </div>
        </div>
        <p className="description">No analysis yet. Upload or paste a resume to get started.</p>
      </section>
    );
  }

  return (
    <section className="panel" aria-label="Resume analysis preview">
      <header className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <div>
          <h3 style={{ marginTop: 0 }}>Analysis Preview</h3>
          {typeof atsScore === 'number' && (
            <div
              role="status"
              aria-label={`ATS score ${atsScore} out of 100`}
              style={{
                marginTop: 6,
                fontWeight: 700,
                color: 'var(--color-primary)',
              }}
            >
              ATS Score: {atsScore}/100
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="btn"
            onClick={() => exportJSON('resume-analysis.json', analysisPayload)}
            aria-label="Export resume analysis as JSON"
            title="Export analysis JSON"
          >
            Export JSON
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCopyAllSuggestions}
            aria-label="Copy all suggestions to clipboard"
            title="Copy all suggestions"
          >
            Copy Suggestions
          </button>
        </div>
      </header>

      {/* Keywords */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h4 style={{ marginTop: 0 }}>Keywords</h4>
        {Array.isArray(displayKeywords) && displayKeywords.length > 0 ? (
          <ul
            aria-label="Keywords list"
            style={{
              listStyle: 'none',
              padding: 0,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: 8,
            }}
          >
            {displayKeywords.map((kw, idx) => (
              <li
                key={`${kw}-${idx}`}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '6px 10px',
                  background: 'var(--color-subtle)',
                }}
                aria-label={`Keyword ${kw}`}
                title={`Keyword: ${kw}`}
              >
                {kw}
              </li>
            ))}
          </ul>
        ) : (
          <p className="description">No keywords available.</p>
        )}
      </div>

      {/* Suggestions */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <h4 style={{ marginTop: 0 }}>Suggestions</h4>
          <button
            type="button"
            className="btn-ghost"
            onClick={handleCopySelectedSuggestion}
            aria-label="Copy selected suggestion to clipboard"
            title="Copy selected suggestion"
            disabled={!selectedSuggestionText}
          >
            Copy Selected
          </button>
        </div>
        {Array.isArray(suggestions) && suggestions.length > 0 ? (
          <ul aria-label="Suggestions list" style={{ paddingLeft: 18 }}>
            {suggestions.map((sug, idx) => {
              const title = typeof sug === 'string' ? sug : sug?.title;
              const detail = typeof sug === 'string' ? '' : sug?.detail;
              const fullText = [title, detail].filter(Boolean).join(' - ');
              return (
                <li
                  key={sug?.id ?? idx}
                  style={{ marginBottom: 10, cursor: 'text' }}
                  onMouseUp={() => {
                    const sel = window.getSelection()?.toString();
                    setSelectedSuggestionText(sel?.trim() ? sel : fullText);
                  }}
                  aria-label={`Suggestion ${idx + 1}`}
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
                        onClick={() => onApplySuggestion(sug)}
                        aria-label={`Apply suggestion: ${title}`}
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
          <p className="description">No suggestions available.</p>
        )}
      </div>

      {/* Local Insights (client-side only; no backend calls) */}
      {hasLocal && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h4 style={{ marginTop: 0 }}>Local Insights (Client-side)</h4>
          <p className="description" style={{ marginTop: 4 }}>
            These insights are computed locally in your browser and do not require backend connectivity.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div className="card" title="Word count and readability">
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Word Count</div>
              <div>{localInsights?.wordCount ?? 0}</div>
              <div style={{ marginTop: 8, fontWeight: 700 }}>Readability (grade)</div>
              <div>
                Grade {localInsights?.readability?.grade ?? 0}{' '}
                <span style={{ color: 'var(--color-text-muted)' }}>
                  ({localInsights?.readability?.words ?? 0} words, {localInsights?.readability?.sentences ?? 0} sentences)
                </span>
              </div>
            </div>

            <div className="card" title="Keyword frequency">
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Keyword Mentions</div>
              {displayKeywords.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {displayKeywords.map((kw, idx) => {
                    const key = String(kw || '').toLowerCase();
                    const count = localInsights?.keywordFrequency?.breakdown?.[key] ?? 0;
                    return (
                      <li key={`${kw}-${idx}`}>
                        {kw}: <strong>{count}</strong>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="description">No keywords to count.</div>
              )}
            </div>
          </div>
          {/* Highlighted local text */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Highlighted Text</div>
            <div
              aria-label="Local highlighted resume text"
              className="card"
              style={{
                whiteSpace: 'pre-wrap',
                background: '#fff',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 12,
                maxHeight: 320,
                overflow: 'auto',
              }}
              // Rendering trusted HTML generated by our highlighter (no external input beyond user's text/keywords)
              dangerouslySetInnerHTML={{ __html: localInsights?.highlightedHtml || '' }}
            />
            <style>{`.kw { background: #fff3bf; color: var(--color-text); padding: 0 2px; border-radius: 2px; }`}</style>
          </div>
        </div>
      )}

      {/* Extracted Text */}
      <div className="card">
        <h4 style={{ marginTop: 0 }}>Extracted Text</h4>
        {extractedText ? (
          <div
            aria-label="Extracted resume text"
            style={{
              whiteSpace: 'pre-wrap',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 12,
              background: '#fff',
              maxHeight: 320,
              overflow: 'auto',
            }}
          >
            {extractedText}
          </div>
        ) : (
          <p className="description">No extracted text to display.</p>
        )}
      </div>
    </section>
  );
}
