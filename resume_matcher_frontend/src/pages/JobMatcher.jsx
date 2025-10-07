import React, { useCallback, useMemo, useState } from 'react';
import Container from '../components/Layout/Container';
import JobDescriptionInput from '../components/Jobs/JobDescriptionInput';
import JobSuggestions from '../components/Jobs/JobSuggestions';
import MatchResults from '../components/Matching/MatchResults';
import SuggestionModal from '../components/Matching/SuggestionModal';

// PUBLIC_INTERFACE
export default function JobMatcher() {
  /**
   * JobMatcher - Flow for entering a job description, showing suggestions, and viewing match results.
   * - Uses JobDescriptionInput to accept description and emit onMatch/onSuggest
   * - Displays JobSuggestions list with placeholder data
   * - Shows MatchResults with placeholder score/details
   * - Provides SuggestionModal placeholder for actionable improvements
   * - No API calls; all data is local/mock until wired in later step
   */

  // Local state placeholders
  const [suggestions, setSuggestions] = useState([]);
  const [match, setMatch] = useState({ score: null, highlights: [], improvements: [] });
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(null);

  const onSuggest = useCallback((payload) => {
    // Placeholder: generate simple mock suggestions using the query or title
    const basis = payload?.query || 'Software Engineer';
    const mock = [
      {
        id: 'j1',
        title: `${basis} I`,
        company: 'Acme Corp',
        location: 'Remote',
        summary: 'Work on modern web apps using React and Node.',
        matchScore: 62,
        postedAt: '2025-01-10',
        url: '#',
      },
      {
        id: 'j2',
        title: `${basis} II`,
        company: 'Globex',
        location: 'San Francisco, CA',
        summary: 'Collaborate with cross-functional teams to build scalable platforms.',
        matchScore: 74,
        postedAt: '2025-01-08',
        url: '#',
      },
      {
        id: 'j3',
        title: `${basis} III`,
        company: 'Initech',
        location: 'New York, NY',
        summary: 'Lead frontend architecture and mentor junior engineers.',
        matchScore: 81,
        postedAt: '2025-01-05',
        url: '#',
      },
    ];
    setSuggestions(mock);
  }, []);

  const onMatch = useCallback((payload) => {
    // Placeholder: compute a fake score and details from job description length and presence of resumeText
    const descLen = payload?.jobDescription?.length || 0;
    const base = Math.min(100, Math.max(30, Math.round(descLen / 5)));
    const extra = payload?.resumeText ? 10 : 0;
    const score = Math.min(100, base + extra);

    setMatch({
      score,
      highlights: ['Strong alignment with required skills (placeholder)', 'Relevant experience detected (placeholder)'],
      improvements: [
        { id: 'imp-1', title: 'Add more project outcomes', detail: 'Provide metrics such as % improvement, revenue impact.' },
        { id: 'imp-2', title: 'Customize summary', detail: 'Tailor your headline to this role and company.' },
      ],
    });
  }, []);

  const handleSelectJob = useCallback((job) => {
    // Placeholder: open modal with a suggestion to tailor resume for selected job
    setActiveSuggestion({
      id: `apply-${job?.id || 'x'}`,
      title: `Tailor resume for ${job?.title || 'selected job'}`,
      detail:
        'Emphasize experience that aligns with the job description, focusing on key skills and outcomes. (placeholder)',
    });
    setModalOpen(true);
  }, []);

  const handleApplySuggestion = useCallback((imp) => {
    // Placeholder: surface modal with selected improvement
    setActiveSuggestion(imp);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setActiveSuggestion(null);
  }, []);

  const suggestionHeading = useMemo(() => 'Suggested Jobs', []);

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
          <JobDescriptionInput onMatch={onMatch} onSuggest={onSuggest} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <JobSuggestions
              suggestions={suggestions}
              onSelect={handleSelectJob}
              heading={suggestionHeading}
            />
            <MatchResults
              matchScore={match.score}
              highlights={match.highlights}
              improvements={match.improvements}
              onApplySuggestion={handleApplySuggestion}
            />
          </div>
        </div>
      </div>

      <SuggestionModal
        isOpen={modalOpen}
        title="Suggestion"
        suggestion={activeSuggestion}
        onClose={closeModal}
        onApplySuggestion={() => {
          // Placeholder: simulate applying suggestion
          closeModal();
        }}
      />
    </Container>
  );
}
