import React, { useEffect, useRef } from 'react';


const LoadingIndicator = ({
  isLoading = false,
  message = 'Loading...',
  overlay = false,
  bar = false,
  size = 'default',
  className = '',
}) => {
  const announcerRef = useRef(null);

  useEffect(() => {
    if (isLoading && announcerRef?.current) {
      announcerRef.current.textContent = message || 'Loading content, please wait.';
    } else if (!isLoading && announcerRef?.current) {
      announcerRef.current.textContent = 'Content loaded.';
    }
  }, [isLoading, message]);

  if (!isLoading) return null;

  const spinnerSizes = {
    sm: 16,
    default: 24,
    lg: 36,
  };

  const spinnerPx = spinnerSizes?.[size] || spinnerSizes?.default;

  /* Screen reader announcer - always rendered when loading */
  const Announcer = (
    <span
      ref={announcerRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );

  /* Top progress bar variant */
  if (bar) {
    return (
      <>
        {Announcer}
        <div className="loading-bar" aria-hidden="true">
          <div className="loading-bar-fill" />
        </div>
      </>
    );
  }

  /* Full overlay variant */
  if (overlay) {
    return (
      <>
        {Announcer}
        <div
          className={`loading-overlay ${className}`}
          role="alert"
          aria-busy="true"
          aria-label={message}
        >
          <div
            className="loading-spinner"
            style={{ width: spinnerPx * 1.5, height: spinnerPx * 1.5 }}
            aria-hidden="true"
          />
          {message && (
            <p
              style={{
                fontFamily: 'var(--font-caption)',
                fontSize: '0.9rem',
                color: 'var(--color-muted-foreground)',
                margin: 0,
              }}
            >
              {message}
            </p>
          )}
        </div>
      </>
    );
  }

  /* Inline / contextual variant (default) */
  return (
    <>
      {Announcer}
      <div
        className={`loading-inline ${className}`}
        role="status"
        aria-busy="true"
        aria-label={message}
      >
        <div
          className="loading-spinner"
          style={{ width: spinnerPx, height: spinnerPx, borderWidth: size === 'sm' ? 2 : 3 }}
          aria-hidden="true"
        />
        {message && (
          <span
            style={{
              fontFamily: 'var(--font-caption)',
              fontSize: size === 'sm' ? '0.8rem' : '0.875rem',
              color: 'var(--color-muted-foreground)',
            }}
          >
            {message}
          </span>
        )}
      </div>
    </>
  );
};

export default React.memo(LoadingIndicator);