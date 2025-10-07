import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Container from '../components/Layout/Container';
import ResumeUpload from '../components/Resume/ResumeUpload';
import ResumePreview from '../components/Resume/ResumePreview';
import useApi from '../hooks/useApi';
import { postJson, postMultipart } from '../api/client';
import { endpoints } from '../api/endpoints';
import { getJson, setJson, removeItem, storageKeys } from '../utils/storage';
import { SkeletonBlock, SkeletonText } from '../components/Common/Skeleton';
import EmptyState from '../components/Common/EmptyState';
import theme from '../constants/theme';

// PUBLIC_INTERFACE
export default function ResumeOptimizer() {
  /**
   * ResumeOptimizer - Handles resume upload and optimization analysis.
   * Adds skeleton loaders while analyzing and a friendly empty state when no resume is uploaded.
   */
  const [lastPayload, setLastPayload] = useState(null);
  const [draft, setDraft] = useState(() => {
    const saved = getJson(storageKeys.resumeDraft);
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

  const analyzeFn = useCallback(
    async (args = {}, { signal, timeout } = {}) => {
      const { formData, json } = args || {};
      if (formData) {
        const { data } = await postMultipart(endpoints.resumesAnalyze(), formData, { signal, timeout });
        return data;
      }
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
      if (typeof resumeText === 'string') {
        setDraft({ resumeText });
        setHasRestorable((resumeText || '').trim().length > 0);
      }

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

  const composedError = useMemo(() => {
    if (!error) return null;
    if (error.code === 'NETWORK_ERROR') {
      return `${error.message}. Please verify the backend is reachable at the configured API base URL and CORS is enabled.`;
    }
    if (error.code === 'HTTP_ERROR') {
      const statusPart = typeof error.status === 'number' ? ` (HTTP ${error.status})` : '';
      return `${error.message}${statusPart}`;
    }
    return error.message || 'An error occurred.';
  }, [error]);

  const localText = useMemo(() => {
    if (draft && typeof draft.resumeText === 'string' && draft.resumeText.trim().length > 0) {
      return draft.resumeText;
    }
    if (lastPayload && !lastPayload.hasFile && typeof lastPayload.resumeText === 'string') {
      return lastPayload.resumeText;
    }
    if (composedError && lastPayload && typeof lastPayload.resumeText === 'string') {
      return lastPayload.resumeText;
    }
    return '';
  }, [draft, lastPayload, composedError]);

  const localKeywords = useMemo(() => {
    if (data && Array.isArray(data.keywords) && data.keywords.length > 0) return data.keywords;
    return ['experience', 'project', 'react', 'typescript', 'python', 'lead', 'optimize'];
  }, [data]);

  const hasAnyResume = (draft?.resumeText || '').trim().length > 0 || !!(lastPayload && (lastPayload.hasFile || (lastPayload.resumeText || '').trim().length > 0));

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

        {/* Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <ResumeUpload onAnalyze={handleAnalyze} />
            {isLoading && (
              <div role="status" aria-live="polite" className="card" style={{ marginTop: 12 }}>
                <SkeletonBlock height={18} style={{ width: '45%', marginBottom: 8 }} />
                <SkeletonText lines={2} />
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
            {!hasAnyResume && !isLoading ? (
              <EmptyState
                title="No resume uploaded"
                description="Upload your resume to receive ATS optimization suggestions and see a formatted preview."
                primaryActionText="Upload Resume"
                onPrimaryAction={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                secondaryActionText="Learn how it works"
                onSecondaryAction={() => { window.location.href = '/settings'; }}
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill={theme.colors.primary} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M5 20h14v-2H5m14-9h-4V3H9v6H5l7 7 7-7z" />
                  </svg>
                }
              />
            ) : (
              <div>
                {isLoading ? (
                  <div role="status" aria-live="polite" aria-label="Loading preview">
                    <SkeletonBlock height={320} />
                    <div style={{ marginTop: 12 }}>
                      <SkeletonText lines={4} />
                    </div>
                  </div>
                ) : (
                  <ResumePreview
                    data={data}
                    onApplySuggestion={() => {}}
                    localText={localText}
                    localKeywords={localKeywords}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
