import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Container from '../components/Layout/Container';
import JobDescriptionInput from '../components/Jobs/JobDescriptionInput';
import JobSuggestions from '../components/Jobs/JobSuggestions';
import MatchResults from '../components/Matching/MatchResults';
import SuggestionModal from '../components/Matching/SuggestionModal';
import useApi from '../hooks/useApi';
import { postJson } from '../api/client';
import { endpoints } from '../api/endpoints';
import { getJson, setJson, removeItem, storageKeys } from '../utils/storage';

// PUBLIC_INTERFACE
export default function JobMatcher() {
  /**
   * JobMatcher - Flow for entering a job description, showing suggestions, and viewing match results.
   * - Uses JobDescriptionInput to accept description and emit onMatch/onSuggest
   * - Calls POST /api/jobs/suggest and POST /api/jobs/match via api/client
   * - Displays loading/error states and renders results
   * - Autosaves a local job draft (title/company/description) with debounce to localStorage.
   */

  // State for modal suggestion details
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(null);

  // Local job draft state
  const [jobDraft, setJobDraft] = useState(() => {
    const saved = getJson(storageKeys.jobDraft);
    // Shape: { jobTitle?: string, company?: string, jobDescription?: string }
    if (saved && typeof saved === 'object') {
      return {
        jobTitle: String(saved.jobTitle || ''),
        company: String(saved.company || ''),
        jobDescription: String(saved.jobDescription || ''),
      };
    }
    return { jobTitle: '', company: '', jobDescription: '' };
  });
  const [hasRestorable, setHasRestorable] = useState(() => {
    const saved = getJson(storageKeys.jobDraft);
    const s = (saved && typeof saved === 'object') ? saved : {};
    const hasAny =
      (s.jobTitle && String(s.jobTitle).trim().length > 0) ||
      (s.company && String(s.company).trim().length > 0) ||
      (s.jobDescription && String(s.jobDescription).trim().length > 0);
    return !!hasAny;
  });

  // Debounced persistence
  const debounceRef = useRef(null);
  useEffect(() => {
    if (!jobDraft) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setJson(storageKeys.jobDraft, {
        jobTitle: jobDraft.jobTitle || '',
        company: jobDraft.company || '',
        jobDescription: jobDraft.jobDescription || '',
      });
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [jobDraft]);

  const restoreDraft = useCallback(() => {
    const saved = getJson(storageKeys.jobDraft);
    if (saved && typeof saved === 'object') {
      setJobDraft({
        jobTitle: String(saved.jobTitle || ''),
        company: String(saved.company || ''),
        jobDescription: String(saved.jobDescription || ''),
      });
      const hasAny =
        (saved.jobTitle && String(saved.jobTitle).trim().length > 0) ||
        (saved.company && String(saved.company).trim().length > 0) ||
        (saved.jobDescription && String(saved.jobDescription).trim().length > 0);
      setHasRestorable(!!hasAny);
    }
  }, []);

  const clearDraft = useCallback(() => {
    removeItem(storageKeys.jobDraft);
    setJobDraft({ jobTitle: '', company: '', jobDescription: '' });
    setHasRestorable(false);
  }, []);

  // Suggest jobs API
  const suggestFn = useCallback(
    async (payload = {}, { signal, timeout } = {}) => {
      // Backend expects: { resumeText, query, page }
      const { data } = await postJson(endpoints.jobsSuggest(), payload, { signal, timeout });
      return data;
    },
    []
  );
  const {
    isLoading: isSuggesting,
    error: suggestError,
    data: suggestData,
    request: requestSuggest,
  } = useApi(suggestFn);

  // Match job API
  const matchFn = useCallback(
    async (payload = {}, { signal, timeout } = {}) => {
      // Backend expects: { resumeText, jobDescription }
      const { data } = await postJson(endpoints.jobsMatch(), payload, { signal, timeout });
      return data;
    },
    []
  );
  const {
    isLoading: isMatching,
    error: matchError,
    data: matchData,
    request: requestMatch,
  } = useApi(matchFn);

  const onSuggest = useCallback(
    (payload) => {
      // payload: { resumeText?, query, page? }
      requestSuggest(payload, { timeout: 25000 });
    },
    [requestSuggest]
  );

  const onMatch = useCallback(
    (payload) => {
      // payload: { resumeText?, jobDescription }
      requestMatch(payload, { timeout: 30000 });
    },
    [requestMatch]
  );

  const handleSelectJob = useCallback((job) => {
    setActiveSuggestion({
      id: `apply-${job?.id || 'x'}`,
      title: `Tailor resume for ${job?.title || 'selected job'}`,
      detail:
        'Emphasize experience that aligns with the job description, focusing on key skills and outcomes.',
    });
    setModalOpen(true);
  }, []);

  const handleApplySuggestion = useCallback((imp) => {
    setActiveSuggestion(imp);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setActiveSuggestion(null);
  }, []);

  const suggestionHeading = useMemo(() => 'Suggested Jobs', []);

  // Normalize backend responses into shapes expected by presentational components
  const suggestions = useMemo(() => {
    // Expecting an array like [{ id,title,company,location,summary,matchScore,postedAt,url }]
    if (!suggestData) return [];
    if (Array.isArray(suggestData)) return suggestData;
    if (Array.isArray(suggestData?.items)) return suggestData.items;
    return [];
  }, [suggestData]);

  const matchScore = useMemo(() => {
    // Expecting e.g., { matchScore, highlights, improvements }
    if (!matchData) return null;
    return typeof matchData.matchScore === 'number' ? matchData.matchScore : null;
  }, [matchData]);

  const highlights = useMemo(() => {
    const arr = matchData?.highlights;
    return Array.isArray(arr) ? arr : [];
  }, [matchData]);

  const improvements = useMemo(() => {
    const arr = matchData?.improvements;
    return Array.isArray(arr) ? arr : [];
  }, [matchData]);

  // Friendly error messages for CORS/network issues
  const friendlySuggestError = useMemo(() => {
    if (!suggestError) return null;
    if (suggestError.code === 'NETWORK_ERROR') {
      return `${suggestError.message}. Check API base URL and CORS settings.`;
    }
    if (suggestError.code === 'HTTP_ERROR') {
      const statusPart = typeof suggestError.status === 'number' ? ` (HTTP ${suggestError.status})` : '';
      return `${suggestError.message}${statusPart}`;
    }
    return suggestError.message || 'Failed to fetch suggestions.';
  }, [suggestError]);

  const friendlyMatchError = useMemo(() => {
    if (!matchError) return null;
    if (matchError.code === 'NETWORK_ERROR') {
      return `${matchError.message}. Check API base URL and CORS settings.`;
    }
    if (matchError.code === 'HTTP_ERROR') {
      const statusPart = typeof matchError.status === 'number' ? ` (HTTP ${matchError.status})` : '';
      return `${matchError.message}${statusPart}`;
    }
    return matchError.message || 'Failed to fetch match results.';
  }, [matchError]);

  return (
    <Container as="section" role="region" ariaLabel="Job Matcher">
      <div className="panel">
        <header style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Job Matcher</h2>
          <p className="description">
            Paste a job description to generate suggestions and estimate how well your resume matches.
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
              aria-label="Restore job draft"
              title="Restore job draft"
              disabled={!hasRestorable}
            >
              Restore draft
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={clearDraft}
              aria-label="Clear job draft"
              title="Clear job draft"
            >
              Clear draft
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <JobDescriptionInput
            onMatch={(payload) => {
              // Update local draft with latest fields inferred from payload/jobDescription text
              if (payload && typeof payload.jobDescription === 'string') {
                setJobDraft((prev) => ({ ...prev, jobDescription: payload.jobDescription }));
                setHasRestorable(true);
              }
              // Best-effort: jobTitle/company are not in payload built in child for match, but keep previous.
              onMatch(payload);
            }}
            onSuggest={(payload) => {
              // Suggestions are built from jobTitle/company/description; try to persist what's derivable
              // The payload contains query, not raw fields; keep existing draft.
              onSuggest(payload);
            }}
            isLoading={isSuggesting || isMatching}
            error={friendlySuggestError || friendlyMatchError}
            initialJobTitle={jobDraft.jobTitle}
            initialCompany={jobDraft.company}
            initialJobDescription={jobDraft.jobDescription}
            onFieldsChange={(fields) => {
              setJobDraft({
                jobTitle: fields.jobTitle || '',
                company: fields.company || '',
                jobDescription: fields.jobDescription || '',
              });
              const hasAny =
                (fields.jobTitle && fields.jobTitle.trim().length > 0) ||
                (fields.company && fields.company.trim().length > 0) ||
                (fields.jobDescription && fields.jobDescription.trim().length > 0);
              setHasRestorable(!!hasAny);
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <JobSuggestions
              suggestions={suggestions}
              onSelect={handleSelectJob}
              heading={suggestionHeading}
              isLoading={isSuggesting}
              error={friendlySuggestError}
            />
            <div>
              {isMatching && (
                <div role="status" aria-live="polite" className="card" style={{ marginBottom: 12 }}>
                  Matching…
                </div>
              )}
              {friendlyMatchError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="card"
                  style={{ color: 'var(--color-error)', marginBottom: 12, fontWeight: 600 }}
                >
                  {friendlyMatchError}
                </div>
              )}
              <MatchResults
                matchScore={matchScore}
                highlights={highlights}
                improvements={improvements}
                onApplySuggestion={handleApplySuggestion}
              />
            </div>
          </div>
        </div>
      </div>

      <SuggestionModal
        isOpen={modalOpen}
        title="Suggestion"
        suggestion={activeSuggestion}
        onClose={closeModal}
        onApplySuggestion={() => {
          closeModal();
        }}
      />
    </Container>
  );
}
