import React from 'react';

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
 */
export default function ResumePreview({ data, onApplySuggestion }) {
  if (!data) {
    return (
      <section className="panel" aria-label="Resume analysis preview">
        <h3 style={{ marginTop: 0 }}>Analysis Preview</h3>
        <p className="description">No analysis yet. Upload or paste a resume to get started.</p>
      </section>
    );
  }

  const {
    extractedText = '',
    atsScore = null,
    keywords = [],
    suggestions = [],
  } = data || {};

  return (
    <section className="panel" aria-label="Resume analysis preview">
      <header style={{ marginBottom: 12 }}>
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
      </header>

      {/* Keywords */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h4 style={{ marginTop: 0 }}>Keywords</h4>
        {Array.isArray(keywords) && keywords.length > 0 ? (
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
            {keywords.map((kw, idx) => (
              <li
                key={`${kw}-${idx}`}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '6px 10px',
                  background: 'var(--color-subtle)',
                }}
                aria-label={`Keyword ${kw}`}
              >
                {kw}
              </li>
            ))}
          </ul>
        ) : (
          <p className="description">No keywords extracted.</p>
        )}
      </div>

      {/* Suggestions */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h4 style={{ marginTop: 0 }}>Suggestions</h4>
        {Array.isArray(suggestions) && suggestions.length > 0 ? (
          <ul aria-label="Suggestions list" style={{ paddingLeft: 18 }}>
            {suggestions.map((sug, idx) => (
              <li key={sug.id ?? idx} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 600 }}>{sug.title}</div>
                {sug.detail && (
                  <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {sug.detail}
                  </div>
                )}
                {onApplySuggestion && (
                  <div style={{ marginTop: 6 }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => onApplySuggestion(sug)}
                      aria-label={`Apply suggestion: ${sug.title}`}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="description">No suggestions available.</p>
        )}
      </div>

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
