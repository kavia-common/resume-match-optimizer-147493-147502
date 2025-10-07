import React, { useCallback, useState } from 'react';
import Container from '../components/Layout/Container';
import ResumeUpload from '../components/Resume/ResumeUpload';
import ResumePreview from '../components/Resume/ResumePreview';

// PUBLIC_INTERFACE
export default function ResumeOptimizer() {
  /**
   * ResumeOptimizer - Orchestrates resume upload and preview of analysis (placeholder).
   * - Uses ResumeUpload to collect file/text and emits onAnalyze payload
   * - For now, generates mock analysis locally to preview UI; no API calls yet
   * - Later step will replace mock with backend integration
   */
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = useCallback(({ resumeText, file }) => {
    // Placeholder-only: build a mock analysis result
    const exampleText =
      resumeText ||
      (file ? `File "${file.name}" uploaded. (placeholder text extract)` : 'No resume content provided.');
    const mock = {
      extractedText: exampleText,
      atsScore: 72,
      keywords: ['React', 'JavaScript', 'APIs', 'CSS', 'Testing'],
      suggestions: [
        { id: 's1', title: 'Add quantifiable achievements', detail: 'Include metrics like % increase or $ saved.' },
        { id: 's2', title: 'Highlight relevant keywords', detail: 'Mention role-specific frameworks and tools.' },
      ],
    };
    setAnalysis(mock);
  }, []);

  const handleApplySuggestion = useCallback((suggestion) => {
    // Placeholder for applying suggestion - for now just log
    // eslint-disable-next-line no-console
    console.log('Apply suggestion clicked:', suggestion);
  }, []);

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
          </div>
          <div>
            <ResumePreview data={analysis} onApplySuggestion={handleApplySuggestion} />
          </div>
        </div>
      </div>
    </Container>
  );
}
