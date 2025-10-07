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
import { SkeletonBlock, SkeletonText } from '../components/Common/Skeleton';
import EmptyState from '../components/Common/EmptyState';
import theme from '../constants/theme';

// PUBLIC_INTERFACE
export default function JobMatcher() {
  /**
   * JobMatcher - Enter a job description to generate suggestions and evaluate match.
   * Adds skeleton loaders while loading and friendly empty state when no suggestions yet.
   */

  // State for modal suggestion details
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(null);

  // Local job draft state
  const [jobDraft, setJobDraft] = useState(() => {
    const saved = getJson(storageKeys.jobDraft);
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
      requestSuggest(payload, { timeout: 25000 });
    },
    [requestSuggest]
  );

  const onMatch = useCallback(
    (payload) => {
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
    if (!suggestData) return [];
    if (Array.isArray(suggestData)) return suggestData;
    if (Array.isArray(suggestData?.items)) return suggestData.items;
    return [];
  }, [suggestData]);

  const matchScore = useMemo(() => {
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
              if (payload && typeof payload.jobDescription === 'string') {
                setJobDraft((prev) => ({ ...prev, jobDescription: payload.jobDescription }));
                setHasRestorable(true);
              }
              onMatch(payload);
            }}
            onSuggest={(payload) => {
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
            <div>
              {isSuggesting ? (
                <div role="status" aria-live="polite" aria-label="Loading job suggestions">
                  <SkeletonBlock height={220} />
                  <div style={{ marginTop: 12 }}>
                    <SkeletonText lines={4} />
                  </div>
                </div>
              ) : suggestions.length === 0 ? (
                <EmptyState
                  title="No job matches yet"
                  description="Paste or describe a job to generate tailored suggestions and matching insights."
                  primaryActionText="Describe a job"
                  onPrimaryAction={() => {
                    const el = document.querySelector('textarea, input');
                    if (el) el.focus();
                  }}
                  secondaryActionText="Explore resume tips"
                  onSecondaryAction={() => { window.location.href = '/resume-optimizer'; }}
                  icon={
                    <svg width="28" height="28" viewBox="0 0 24 24" fill={theme.colors.primary} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M9 21h6v-1a4 4 0 0 0-6 0v1zm3-19a5 5 0 0 0-5 5c0 2.76 2.24 5 5 5s5-2.24 5-5a5 5 0 0 0-5-5zM4 8a8 8 0 1 1 16 0 8 8 0 0 1-16 0z" />
                    </svg>
                  }
                />
              ) : (
                <JobSuggestions
                  suggestions={suggestions}
                  onSelect={handleSelectJob}
                  heading="Suggested Jobs"
                  isLoading={isSuggesting}
                  error={friendlySuggestError}
                />
              )}
            </div>
            <div>
              {isMatching ? (
                <div role="status" aria-live="polite" aria-label="Matching score loading">
                  <SkeletonBlock height={180} />
                  <div style={{ marginTop: 12 }}>
                    <SkeletonText lines={3} />
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
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
