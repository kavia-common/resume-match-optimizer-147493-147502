import React, { useCallback, useMemo, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * JobDescriptionInput - Collects job description details and triggers parent callbacks.
 *
 * Purpose:
 * - Provide a textarea for full job description text
 * - Optional fields for Job Title and Company (assist query building and display)
 * - Offer two actions:
 *    1) "Match Now" -> onMatch({ resumeText, jobDescription, jobTitle, company })
 *    2) "Get Suggestions" -> onSuggest({ resumeText, query, page })
 * - Does not invoke any API directly; leaves that to the parent
 *
 * Props:
 * - onMatch?: (payload: { resumeText?: string, jobDescription: string, jobTitle?: string, company?: string }) => void
 * - onSuggest?: (payload: { resumeText?: string, query: string, page?: number }) => void
 * - initialResumeText?: string (optional, to pass along for matching)
 * - isLoading?: boolean (for parent-controlled loading state)
 * - error?: string | { message: string } (for parent-controlled error display)
 *
 * Accessibility:
 * - Uses form labels, aria-labels, aria-describedby, and role="alert" for errors.
 * - Buttons have clear aria-labels.
 */
export default function JobDescriptionInput({
  onMatch,
  onSuggest,
  initialResumeText = '',
  isLoading = false,
  error = null,
}) {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [localError, setLocalError] = useState(null);

  const composedError = useMemo(() => {
    if (localError) return localError;
    if (!error) return null;
    return typeof error === 'string' ? error : error.message;
  }, [localError, error]);

  const canSubmitMatch = useMemo(() => {
    return Boolean(jobDescription && jobDescription.trim().length >= 20);
  }, [jobDescription]);

  const canSubmitSuggest = useMemo(() => {
    // For suggestions, allow either jobTitle or a minimal description to form a query.
    const hasTitle = jobTitle.trim().length >= 2;
    const hasDesc = jobDescription.trim().length >= 10;
    return hasTitle || hasDesc;
  }, [jobTitle, jobDescription]);

  const handleMatch = useCallback(
    (e) => {
      e.preventDefault();
      setLocalError(null);
      const desc = jobDescription.trim();
      if (desc.length < 20) {
        setLocalError('Please provide a more detailed job description (at least 20 characters).');
        return;
      }
      const payload = {
        resumeText: initialResumeText?.trim() || undefined,
        jobDescription: desc,
        jobTitle: jobTitle.trim() || undefined,
        company: company.trim() || undefined,
      };
      onMatch?.(payload);
    },
    [jobDescription, jobTitle, company, onMatch, initialResumeText]
  );

  const handleSuggest = useCallback(
    (e) => {
      e.preventDefault();
      setLocalError(null);

      // Build a simple query string from title/company/keywords extracted from description
      const titlePart = jobTitle.trim();
      const companyPart = company.trim();
      const descPart = jobDescription.trim();

      if (!canSubmitSuggest) {
        setLocalError('Enter a job title or a short description to fetch suggestions.');
        return;
      }

      // Naive keyword extraction: take the first 8 words from description as hints
      const keywords = descPart
        ? descPart
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 8)
            .join(' ')
        : '';

      const pieces = [
        titlePart ? `title:"${titlePart}"` : null,
        companyPart ? `company:"${companyPart}"` : null,
        keywords ? `keywords:"${keywords}"` : null,
      ].filter(Boolean);

      const query = pieces.join(' ');
      const payload = {
        resumeText: initialResumeText?.trim() || undefined,
        query: query || titlePart || keywords || '', // fallback to something non-empty if possible
        page: 1,
      };

      onSuggest?.(payload);
    },
    [jobTitle, company, jobDescription, onSuggest, initialResumeText, canSubmitSuggest]
  );

  const clear = useCallback(() => {
    setJobTitle('');
    setCompany('');
    setJobDescription('');
    setLocalError(null);
  }, []);

  return (
    <section className="panel" aria-label="Job description input panel">
      <header style={{ marginBottom: 12 }}>
        <h3 id="job-desc-title" style={{ margin: 0 }}>Job Description</h3>
        <p id="job-desc-sub" className="description">
          Paste the job description and optionally add a title and company. Then match against your resume or fetch job suggestions.
        </p>
      </header>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label htmlFor="job-title" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
              Job Title (optional)
            </label>
            <input
              id="job-title"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Senior Frontend Engineer"
              aria-label="Job title"
            />
          </div>
          <div>
            <label htmlFor="job-company" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
              Company (optional)
            </label>
            <input
              id="job-company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Acme Corp"
              aria-label="Company name"
            />
          </div>
        </div>

        <label htmlFor="job-description" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
          Job Description
        </label>
        <textarea
          id="job-description"
          aria-labelledby="job-desc-title"
          aria-describedby="job-desc-sub"
          placeholder="Paste the full job description here..."
          rows={8}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </div>

      {composedError && (
        <div
          role="alert"
          aria-live="assertive"
          style={{ color: 'var(--color-error)', marginBottom: 12, fontWeight: 600 }}
        >
          {composedError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleMatch}
          disabled={!canSubmitMatch || isLoading}
          aria-label="Match resume to this job"
          title="Match resume to this job"
        >
          {isLoading ? 'Working…' : 'Match Now'}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleSuggest}
          disabled={!canSubmitSuggest || isLoading}
          aria-label="Get suggested jobs like this"
          title="Get suggested jobs like this"
        >
          {isLoading ? 'Working…' : 'Get Suggestions'}
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={clear}
          aria-label="Clear fields"
          title="Clear fields"
        >
          Clear
        </button>
      </div>
    </section>
  );
}
