import React, { useCallback, useMemo, useRef, useState } from 'react';
import useApi from '../../hooks/useApi';
import { postJson, postMultipart } from '../../api/client';
import { validateFile, buildFormData } from '../../utils/file';

/**
 * PUBLIC_INTERFACE
 * ResumeUpload - Upload or paste a resume to prepare analysis payloads.
 * - Supports single file upload (PDF/DOCX/TXT) with drag-and-drop
 * - Supports pasting plain text as an alternative
 * - Validates file type and size via utils/file.js
 * - Prepares payloads using api/client.js helpers (multipart for file, JSON for text)
 * - Does NOT call backend endpoints yet; triggers onAnalyze callback to parent with prepared values.
 *
 * Props:
 * - onAnalyze: ({ resumeText: string|null, file: File|null, prepareJson: Function, prepareMultipart: Function }) => void
 *   Parent callback invoked when user clicks "Analyze" with constructed data and helper functions.
 * - maxFileSize?: number (default 5 * 1024 * 1024 = 5MB)
 *
 * Accessibility:
 * - Provides ARIA labels, roles, and keyboard support for drag-and-drop area.
 */
export default function ResumeUpload({ onAnalyze, maxFileSize = 5 * 1024 * 1024 }) {
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Handlers for file selection
  const onFileChange = useCallback(
    (e) => {
      const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
      if (!f) return;
      const v = validateFile(f, Math.round(maxFileSize / (1024 * 1024)));
      if (!v.ok) {
        setError(v.reason);
        setFile(null);
        return;
      }
      setError(null);
      setFile(f);
      // If a file is chosen, clear pasted text to avoid ambiguity
      setResumeText('');
    },
    [maxFileSize]
  );

  // Drag and drop handlers
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);
  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const f = e.dataTransfer.files && e.dataTransfer.files[0] ? e.dataTransfer.files[0] : null;
      if (!f) return;
      const v = validateFile(f, Math.round(maxFileSize / (1024 * 1024)));
      if (!v.ok) {
        setError(v.reason);
        setFile(null);
        return;
      }
      setError(null);
      setFile(f);
      setResumeText('');
    },
    [maxFileSize]
  );

  const chooseFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Prepare payload helpers using api/client.js but do not invoke yet
  const prepareMultipart = useCallback(() => {
    if (!file) return null;
    // Place under 'file' key to align with backend expectation for multipart
    return buildFormData(file, 'file');
  }, [file]);

  const prepareJson = useCallback(() => {
    if (!resumeText || !resumeText.trim()) return null;
    return { resumeText: resumeText.trim() };
  }, [resumeText]);

  const handleAnalyze = useCallback(
    (e) => {
      e.preventDefault();
      setError(null);

      if (!file && !resumeText.trim()) {
        setError('Please upload a file or paste your resume text.');
        return;
      }
      if (file) {
        const v = validateFile(file, Math.round(maxFileSize / (1024 * 1024)));
        if (!v.ok) {
          setError(v.reason);
          return;
        }
      }

      // Notify parent with both the raw values and helpers
      onAnalyze?.({
        resumeText: resumeText.trim() || null,
        file: file || null,
        // Expose payload builders so parent can call correct api helper in next integration step
        prepareJson,
        prepareMultipart,
        // Suggest the api functions to use later; not invoked here
        api: { postJson, postMultipart },
      });
    },
    [file, resumeText, onAnalyze, maxFileSize, prepareJson, prepareMultipart]
  );

  const onPasteTextChange = useCallback((e) => {
    setResumeText(e.target.value);
    if (file) {
      // If user starts typing, we can optionally clear the file to prefer text
      // Keep file but it's okay; analyze will pass both and parent can choose precedence
    }
  }, [file]);

  const clearAll = useCallback(() => {
    setFile(null);
    setResumeText('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const fileLabel = useMemo(() => {
    if (file) return `Selected: ${file.name}`;
    return 'Drag & drop your resume here, or click to browse';
  }, [file]);

  return (
    <section className="panel" aria-label="Resume upload panel">
      <header style={{ marginBottom: '12px' }}>
        <h3 id="resume-upload-title" style={{ margin: 0 }}>Upload or Paste Resume</h3>
        <p className="description" id="resume-upload-desc">
          Upload a single PDF/DOC/DOCX/TXT file, or paste your resume text below.
        </p>
      </header>

      {/* Drag-and-drop upload area */}
      <div
        role="button"
        tabIndex={0}
        aria-labelledby="resume-upload-title"
        aria-describedby="resume-upload-desc"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            chooseFile();
          }
        }}
        onClick={chooseFile}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="card"
        style={{
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: dragActive ? 'var(--color-primary)' : 'var(--color-border)',
          padding: '24px',
          background: dragActive ? 'var(--color-subtle)' : 'var(--color-surface)',
          cursor: 'pointer',
          marginBottom: '16px'
        }}
        aria-label="Resume file dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={onFileChange}
          aria-label="Choose resume file"
          style={{ display: 'none' }}
        />
        <div>
          <strong>{fileLabel}</strong>
          <div style={{ color: 'var(--color-text-muted)', marginTop: 6, fontSize: 14 }}>
            Max size {Math.round(maxFileSize / (1024 * 1024))}MB. Accepted: PDF, DOC, DOCX, TXT
          </div>
        </div>
      </div>

      {/* Or paste text */}
      <div className="card" style={{ marginBottom: 16 }}>
        <label htmlFor="resume-textarea" style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
          Or paste resume text
        </label>
        <textarea
          id="resume-textarea"
          aria-label="Paste resume text"
          placeholder="Paste your resume text here..."
          rows={8}
          value={resumeText}
          onChange={onPasteTextChange}
        />
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            color: 'var(--color-error)',
            marginBottom: 12,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="button" className="btn btn-primary" onClick={handleAnalyze} aria-label="Analyze resume">
          Analyze
        </button>
        <button type="button" className="btn btn-outline" onClick={clearAll} aria-label="Clear selection">
          Clear
        </button>
      </div>
    </section>
  );
}
