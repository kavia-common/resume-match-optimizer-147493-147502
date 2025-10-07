import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Container from '../components/Layout/Container';
import ResumeUpload from '../components/Resume/ResumeUpload';
import ResumePreview from '../components/Resume/ResumePreview';
import useApi from '../hooks/useApi';
import { postJson, postMultipart } from '../api/client';
import { endpoints } from '../api/endpoints';
import { getJson, setJson, removeItem, storageKeys } from '../utils/storage';

// PUBLIC_INTERFACE
export default function ResumeOptimizer() {
  /**
   * ResumeOptimizer - Orchestrates resume upload and preview of backend analysis.
   * - Uses ResumeUpload to collect file/text and emits onAnalyze payload
   * - Calls POST /api/resumes/analyze using multipart for file or JSON for text
   * - Shows loading/error and renders analysis in ResumePreview
   * - Provides a local insights view (client-side) when pasted text is available or backend is unavailable.
   * - Autosaves a local draft (resume text only) with debounce to localStorage.
   */
  const [lastPayload, setLastPayload] = useState(null);
  const [draft, setDraft] = useState(() => {
    // Load draft once on mount
    const saved = getJson(storageKeys.resumeDraft);
    // Shape: { resumeText: string }
    if (saved && typeof saved.resumeText === 'string') return saved;
    return { resumeText: '' };
  });
  const [hasRestorable, setHasRestorable] = useState(() => {
    const saved = getJson(storageKeys.resumeDraft);
    return !!(saved && typeof saved.resumeText === 'string' && saved.resumeText.trim().length > 0);
  });

  // Debounce persistence
  const debounceRef = useRef(null);
  useEffect(() => {
    // Save only when resumeText changes
    if (!draft) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setJson(storageKeys.resumeDraft, { resumeText: draft.resumeText || '' });
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [draft]);

  const restoreDraft = useCallback(() => {
    const saved = getJson(storageKeys.resumeDraft);
    if (saved && typeof saved.resumeText === 'string') {
      setDraft({ resumeText: saved.resumeText });
      setHasRestorable(true);
    }
  }, []);

  const clearDraft = useCallback(() => {
    removeItem(storageKeys.resumeDraft);
    setDraft({ resumeText: '' });
    setHasRestorable(false);
  }, []);

  // Request function for useApi; accepts either { formData } or { json }
  const analyzeFn = useCallback(
    async (args = {}, { signal, timeout } = {}) => {
      const { formData, json } = args || {};
      if (formData) {
        const { data } = await postMultipart(endpoints.resumesAnalyze(), formData, { signal, timeout });
        return data;
      }
      // default to JSON path; backend expects { resumeText }
      const body = json || {};
      const { data } = await postJson(endpoints.resumesAnalyze(), body, { signal, timeout });
      return data;
    },
    []
  );

  const { isLoading, error, data, request, reset } = useApi(analyzeFn, { auto: false });

  const handleAnalyze = useCallback(
    ({ resumeText, file, prepareJson, prepareMultipart }) => {
      setLastPayload({ resumeText: resumeText || null, hasFile: !!file });

      // Update local draft from latest resumeText supplied by child (if any)
      if (typeof resumeText === 'string') {
        setDraft({ resumeText });
        setHasRestorable((resumeText || '').trim().length > 0);
      }

      // Prefer file if provided; otherwise send JSON with resumeText
      if (file && typeof prepareMultipart === 'function') {
        const fd = prepareMultipart();
        if (!fd) return;
        request({ formData: fd }, { timeout: 30000 });
        return;
      } else if (resumeText && typeof prepareJson === 'function') {
        const json = prepareJson();
        request({ json }, { timeout: 30000 });
        return;
      }
    },
    [request]
  );

  const handleApplySuggestion = useCallback((suggestion) => {
    // For now, just log; could be used to modify resume text client-side
    // eslint-disable-next-line no-console
    console.log('Apply suggestion clicked:', suggestion);
  }, []);

  const composedError = useMemo(() => {
    if (!error) return null;
    // Provide friendlier message for CORS/network errors
    if (error.code === 'NETWORK_ERROR') {
      return `${error.message}. Please verify the backend is reachable at the configured API base URL and CORS is enabled.`;
    }
    // If HTTP error, include status when available
    if (error.code === 'HTTP_ERROR') {
      const statusPart = typeof error.status === 'number' ? ` (HTTP ${error.status})` : '';
      return `${error.message}${statusPart}`;
    }
    return error.message || 'An error occurred.';
  }, [error]);

  // When we have pasted text and either: (a) backend hasn't returned data yet, or (b) there was an error,
  // we still want to show local insights. We'll pass localText and localKeywords to ResumePreview.
  const localText = useMemo(() => {
    // Prefer the current draft text if available and there is no file in lastPayload
    if (draft && typeof draft.resumeText === 'string' && draft.resumeText.trim().length > 0) {
      return draft.resumeText;
    }
    // Only use pasted text when last payload indicates it (no file) and we have a string
    if (lastPayload && !lastPayload.hasFile && typeof lastPayload.resumeText === 'string') {
      return lastPayload.resumeText;
    }
    // If there was a network error and lastPayload.resumeText exists, still show local insights
    if (composedError && lastPayload && typeof lastPayload.resumeText === 'string') {
      return lastPayload.resumeText;
    }
    return '';
  }, [draft, lastPayload, composedError]);

  const localKeywords = useMemo(() => {
    // Prefer backend-provided keywords if available; else fallback to a small default set for highlighting
    if (data && Array.isArray(data.keywords) && data.keywords.length > 0) return data.keywords;
    // Fallback defaults to keep UX helpful
    return ['experience', 'project', 'react', 'typescript', 'python', 'lead', 'optimize'];
  }, [data]);

  return (
    <Container as="section" role="region" ariaLabel="Resume Optimizer">
      <div className="panel">
        <header style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Resume Optimizer</h2>
          <p className="description">
            Upload your resume and review ATS-optimized suggestions before applying to jobs.
          </p>
        </header>

        {/* Draft controls */}
        <div className="card" style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
            Drafts are saved locally in your browser.
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={restoreDraft}
              aria-label="Restore resume draft"
              title="Restore resume draft"
              disabled={!hasRestorable}
            >
              Restore draft
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={clearDraft}
              aria-label="Clear resume draft"
              title="Clear resume draft"
            >
              Clear draft
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <ResumeUpload onAnalyze={handleAnalyze} />
            {isLoading && (
              <div role="status" aria-live="polite" className="card" style={{ marginTop: 12 }}>
                Analyzing resume…
              </div>
            )}
            {composedError && (
              <div
                role="alert"
                aria-live="assertive"
                className="card"
                style={{ marginTop: 12, color: 'var(--color-error)', fontWeight: 600 }}
              >
                {composedError}
              </div>
            )}
            {data && lastPayload && (
              <div className="card" style={{ marginTop: 12 }}>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                  Last analyze: {lastPayload.hasFile ? 'via file upload' : 'via pasted text'}
                </div>
                <button type="button" className="btn btn-outline" style={{ marginTop: 8 }} onClick={reset}>
                  Reset
                </button>
              </div>
            )}
          </div>
          <div>
            <ResumePreview
              data={data}
              onApplySuggestion={handleApplySuggestion}
              localText={localText}
              localKeywords={localKeywords}
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
