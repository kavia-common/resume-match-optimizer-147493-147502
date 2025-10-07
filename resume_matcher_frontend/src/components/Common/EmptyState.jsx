import React from 'react';
import { theme } from '../../constants/theme';

/**
 * PUBLIC_INTERFACE
 * EmptyState
 * A friendly empty state with icon, title, description, and optional primary/secondary actions.
 */
export default function EmptyState({
  title = 'Nothing here yet',
  description = 'There is no data to display.',
  icon = null,
  primaryActionText,
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
  children,
  className = '',
  'aria-label': ariaLabel = 'Empty state',
}) {
  const handleKey = (cb) => (e) => {
    if (cb && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      cb();
    }
  };

  return (
    <section
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={`empty-state ${className}`}
      style={{
        background: '#ffffff',
        border: '1px solid rgba(17, 24, 39, 0.06)',
        borderRadius: 12,
        padding: 24,
        textAlign: 'center',
        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
      }}
    >
      {icon && (
        <div
          aria-hidden="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(249,250,251,1))',
            color: theme.primary,
            marginBottom: 12,
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          margin: '8px 0',
          color: theme.text,
          fontSize: 18,
          fontWeight: 600,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: '0 auto 16px',
          color: '#6B7280',
          fontSize: 14,
          maxWidth: 480,
        }}
      >
        {description}
      </p>
      {children}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {secondaryActionText && (
          <button
            type="button"
            onClick={onSecondaryAction}
            onKeyDown={handleKey(onSecondaryAction)}
            className="btn-secondary"
            style={{
              border: `1px solid rgba(37, 99, 235, 0.3)`,
              color: theme.primary,
              background: '#fff',
              borderRadius: 10,
              padding: '10px 14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all .2s ease',
            }}
          >
            {secondaryActionText}
          </button>
        )}
        {primaryActionText && (
          <button
            type="button"
            onClick={onPrimaryAction}
            onKeyDown={handleKey(onPrimaryAction)}
            className="btn-primary"
            style={{
              border: 'none',
              color: '#fff',
              background: theme.primary,
              borderRadius: 10,
              padding: '10px 14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all .2s ease',
              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
            }}
          >
            {primaryActionText}
          </button>
        )}
      </div>
    </section>
  );
}
