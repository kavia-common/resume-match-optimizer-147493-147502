import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Container - Centers page content and applies responsive padding/max-width.
 * Uses classes consistent with App.css and index.css:
 * - "content" for page section spacing
 * - "container" for max width and horizontal padding
 *
 * Props:
 * - children: React.ReactNode
 * - as?: keyof JSX.IntrinsicElements (default 'div')
 * - role?: string (optional ARIA role)
 * - ariaLabel?: string (optional ARIA label)
 */
export default function Container({ children, as: Tag = 'div', role, ariaLabel }) {
  return (
    <Tag className="content container" role={role} aria-label={ariaLabel}>
      {children}
    </Tag>
  );
}
