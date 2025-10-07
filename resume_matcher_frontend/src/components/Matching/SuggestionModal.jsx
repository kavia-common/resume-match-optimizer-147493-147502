import React, { useCallback, useEffect, useMemo, useRef } from 'react';

/**
 * PUBLIC_INTERFACE
 * SuggestionModal - Accessible modal dialog for reviewing and applying a suggestion.
 *
 * Props:
 * - isOpen: boolean - controls visibility
 * - title: string - modal title (used for aria-labelledby)
 * - suggestion: { id?: string|number, title?: string, detail?: string } | null
 * - onClose: () => void - callback when modal should close (overlay click, ESC, close button)
 * - onApplySuggestion?: (suggestion) => void - action when user confirms/apply
 * - children?: React.ReactNode - optional custom content; when provided, it's rendered in body
 *
 * Accessibility features:
 * - role="dialog" aria-modal="true"
 * - labelled by title via aria-labelledby
 * - Focus trap within modal when open
 * - ESC key to close
 * - Overlay click to close
 * - Initial focus moved to the close button; Tab cycles within dialog
 *
 * Notes:
 * - Purely presentational; no API calls inside.
 * - Styled using existing Ocean Professional classes and inline styles aligned with theme.
 */
export default function SuggestionModal({
  isOpen = false,
  title = 'Suggestion',
  suggestion = null,
  onClose,
  onApplySuggestion,
  children,
}) {
  const overlayRef = useRef(null);
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);

  // Collect focusable elements inside dialog
  const getFocusable = useCallback(() => {
    if (!dialogRef.current) return [];
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input[type="text"]:not([disabled])',
      'input[type="radio"]:not([disabled])',
      'input[type="checkbox"]:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    const nodes = dialogRef.current.querySelectorAll(selectors);
    return Array.prototype.slice.call(nodes);
  }, []);

  // Focus trap and initial focus
  useEffect(() => {
    if (!isOpen) return;

    // Save the previously focused element to restore on close
    const prevFocused = document.activeElement;

    // Move focus to close button (or dialog)
    const toFocus = closeBtnRef.current || dialogRef.current;
    toFocus && toFocus.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = getFocusable();
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const current = document.activeElement;
        const goingBackward = e.shiftKey;

        if (goingBackward && (current === first || current === dialogRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!goingBackward && (current === last)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      if (prevFocused && typeof prevFocused.focus === 'function') {
        try { prevFocused.focus(); } catch (_) {}
      }
    };
  }, [isOpen, onClose, getFocusable]);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === overlayRef.current) {
      onClose?.();
    }
  }, [onClose]);

  const handleApply = useCallback(() => {
    if (onApplySuggestion && suggestion) {
      onApplySuggestion(suggestion);
    }
  }, [onApplySuggestion, suggestion]);

  const dialogTitleId = useMemo(() => 'suggestion-modal-title', []);
  const dialogDescId = useMemo(() => 'suggestion-modal-desc', []);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      aria-hidden={false}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--color-overlay, rgba(17, 24, 39, 0.5))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        aria-describedby={dialogDescId}
        className="card"
        style={{
          width: '100%',
          maxWidth: 560,
          outline: 'none',
          boxShadow: 'var(--shadow-lg)',
        }}
        tabIndex={-1}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h3 id={dialogTitleId} style={{ margin: 0 }}>
            {title}
          </h3>
          <button
            ref={closeBtnRef}
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close"
          >
            Close
          </button>
        </div>

        <div id={dialogDescId} style={{ marginTop: 8, color: 'var(--color-text-muted)' }}>
          Review and apply the suggestion below.
        </div>

        <hr className="hr" />

        <div>
          {children ? (
            children
          ) : (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                {suggestion?.title || 'Suggestion'}
              </div>
              {suggestion?.detail && (
                <div style={{ color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
                  {suggestion.detail}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            aria-label="Cancel and close"
          >
            Cancel
          </button>
          {onApplySuggestion && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleApply}
              aria-label="Apply suggestion"
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
