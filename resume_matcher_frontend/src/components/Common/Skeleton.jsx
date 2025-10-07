import React from 'react';

/**
 * PUBLIC_INTERFACE
 * SkeletonBlock
 * A rectangular skeleton placeholder with a subtle shimmer animation.
 */
export function SkeletonBlock({
  width = '100%',
  height = 16,
  radius = 8,
  className = '',
  style = {},
  'aria-label': ariaLabel = 'Loading',
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={`skeleton-block ${className}`}
      style={{
        width,
        height,
        borderRadius: radius,
        ...style,
      }}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * SkeletonText
 * A text line skeleton placeholder. Use multiple lines for paragraph effects.
 */
export function SkeletonText({
  width = '100%',
  height = 14,
  lines = 1,
  gap = 8,
  className = '',
  style = {},
  'aria-label': ariaLabel = 'Loading content',
}) {
  const arr = Array.from({ length: lines });
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={`skeleton-text ${className}`}
      style={style}
    >
      {arr.map((_, i) => (
        <div
          key={i}
          className="skeleton-block"
          style={{
            width: i === arr.length - 1 && lines > 1 ? (typeof width === 'string' ? width : `${width}px`) : width,
            height,
            borderRadius: 6,
            marginBottom: i !== arr.length - 1 ? gap : 0,
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * PUBLIC_INTERFACE
 * SkeletonCircle
 * A circular skeleton placeholder for avatars or icons.
 */
export function SkeletonCircle({
  size = 40,
  className = '',
  style = {},
  'aria-label': ariaLabel = 'Loading avatar',
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={`skeleton-block ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '9999px',
        ...style,
      }}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default {
  SkeletonBlock,
  SkeletonText,
  SkeletonCircle,
};
