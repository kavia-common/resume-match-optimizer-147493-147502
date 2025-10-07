import React, { useCallback, useMemo, useState } from 'react';
import Container from '../components/Layout/Container';
import JobDescriptionInput from '../components/Jobs/JobDescriptionInput';
import JobSuggestions from '../components/Jobs/JobSuggestions';
import MatchResults from '../components/Matching/MatchResults';
import SuggestionModal from '../components/Matching/SuggestionModal';
import useApi from '../hooks/useApi';
import { postJson } from '../api/client';
import { endpoints } from '../api/endpoints';

// PUBLIC_INTERFACE
export default function JobMatcher() {
  /**
   * JobMatcher - Flow for entering a job description, showing suggestions, and viewing match results.
   * - Uses JobDescriptionInput to accept description and emit onMatch/onSuggest
   * - Calls POST /api/jobs/suggest and POST /api/jobs/match via api/client
   * - Displays loading/error states and renders results
   */

  // State for modal suggestion details
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(null);

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

        <div style={{ display: 'grid', gap: 16 }}>
          <JobDescriptionInput
            onMatch={onMatch}
            onSuggest={onSuggest}
            isLoading={isSuggesting || isMatching}
            error={friendlySuggestError || friendlyMatchError}
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
