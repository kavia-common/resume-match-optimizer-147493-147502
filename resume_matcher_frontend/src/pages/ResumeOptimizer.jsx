import React, { useCallback, useMemo, useState } from 'react';
import Container from '../components/Layout/Container';
import ResumeUpload from '../components/Resume/ResumeUpload';
import ResumePreview from '../components/Resume/ResumePreview';
import useApi from '../hooks/useApi';
import { postJson, postMultipart } from '../api/client';
import { endpoints } from '../api/endpoints';

// PUBLIC_INTERFACE
export default function ResumeOptimizer() {
  /**
   * ResumeOptimizer - Orchestrates resume upload and preview of backend analysis.
   * - Uses ResumeUpload to collect file/text and emits onAnalyze payload
   * - Calls POST /api/resumes/analyze using multipart for file or JSON for text
   * - Shows loading/error and renders analysis in ResumePreview
   */
  const [lastPayload, setLastPayload] = useState(null);

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
      // Prefer file if provided; otherwise send JSON with resumeText
      if (file && typeof prepareMultipart === 'function') {
        const fd = prepareMultipart();
        if (!fd) return;
        request({ formData: fd }, { timeout: 30000 });
        return;
        // eslint-disable-next-line no-else-return
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
    return error.message || 'An error occurred.';
  }, [error]);

  return (
    <Container as="section" role="region" ariaLabel="Resume Optimizer">
      <div className="panel">
        <header style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Resume Optimizer</h2>
          <p className="description">
            Upload your resume and review ATS-optimized suggestions before applying to jobs.
          </p>
        </header>

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
            <ResumePreview data={data} onApplySuggestion={handleApplySuggestion} />
          </div>
        </div>
      </div>
    </Container>
  );
}
