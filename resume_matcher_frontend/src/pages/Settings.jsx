import React, { useMemo } from 'react';
import Container from '../components/Layout/Container';
import { getApiBaseUrl } from '../constants/config';
import { apiUrl } from '../api/endpoints';

// PUBLIC_INTERFACE
export default function Settings() {
  /**
   * Settings - Shows runtime configuration and simple controls (placeholders).
   * - Displays resolved API base URL using runtime config
   * - Includes clear instructions to configure public/config.js
   * - Does not persist or call APIs yet
   *
   * Note: When displaying runtime config objects, never render the object directly
   * as JSX children (e.g., {window._CONFIG}). Use strings or JSON.stringify inside <pre>.
   */
  const apiBase = useMemo(() => getApiBaseUrl(), []);

  const { rawConfigJson, hasConfigObject, isConfigEmpty } = useMemo(() => {
    try {
      const obj = typeof window !== 'undefined' && window._CONFIG ? window._CONFIG : null;
      return {
        rawConfigJson: JSON.stringify(obj || {}, null, 2),
        hasConfigObject: !!obj,
        isConfigEmpty: !obj || (obj && Object.keys(obj).length === 0),
      };
    } catch {
      return { rawConfigJson: '{}', hasConfigObject: false, isConfigEmpty: true };
    }
  }, []);

  return (
    <Container as="section" role="region" ariaLabel="Settings">
      <div className="panel">
        <header style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Settings</h2>
          <p className="description">View runtime configuration and adjust preferences.</p>
        </header>

        <div className="card" aria-label="Runtime configuration">
          <h3 style={{ marginTop: 0 }}>Runtime Configuration</h3>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            <div>
              <div style={{ color: 'var(--color-text-muted)' }}>API Base URL (resolved via getApiBaseUrl)</div>
              <code style={{ display: 'block', marginTop: 4 }}>{apiBase}</code>
              <p className="description" style={{ marginTop: 6 }}>
                This value is the source of truth for all API requests. It prefers window._CONFIG.API_BASE_URL and
                falls back to http://localhost:8000 if not set.
              </p>
            </div>

            <div>
              <div style={{ color: 'var(--color-text-muted)' }}>Endpoint resolution</div>
              <div className="card" style={{ marginTop: 8 }}>
                <div>Analyze endpoint (POST):</div>
                <code style={{ display: 'block', marginTop: 4 }}>{apiUrl('/api/resumes/analyze')}</code>
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--color-text-muted)' }}>Connectivity quick check</div>
              <div className="card" style={{ marginTop: 8 }}>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Open this URL in a new tab to test backend reachability and CORS:
                    {' '}
                    <a href={apiUrl('/api/health')} target="_blank" rel="noreferrer">
                      {apiUrl('/api/health')}
                    </a>
                  </li>
                  <li>Expected: HTTP 200 OK with a small JSON like {"{ \"status\": \"ok\" }"} and CORS allows this origin.</li>
                  <li>If it fails in preview, ensure API_BASE_URL is not localhost but the backend's reachable URL, and backend binds to 0.0.0.0:8000.</li>
                </ol>
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--color-text-muted)' }}>Current raw runtime config (window._CONFIG)</div>
              {!hasConfigObject && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="card"
                  style={{ color: 'var(--color-error)', marginTop: 8, fontWeight: 600 }}
                >
                  Runtime config object not found; ensure public/config.js is loaded before the app bundle.
                </div>
              )}
              {hasConfigObject && isConfigEmpty && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="card"
                  style={{ color: 'var(--color-error)', marginTop: 8, fontWeight: 600 }}
                >
                  Runtime config object is empty; make sure public/config.js sets window._CONFIG with API_BASE_URL.
                </div>
              )}
              <div
                className="card"
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: '#fff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  <code>{rawConfigJson}</code>
                </pre>
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--color-text-muted)' }}>How to change API Base URL</div>
              <div className="card" style={{ marginTop: 8 }}>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Open the file: <code>public/config.js</code></li>
                  <li>Set <code>window._CONFIG.API_BASE_URL</code> to your backend URL (no trailing slash)</li>
                  <li>Example snippet:</li>
                </ol>
                <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>
{String(`<script>
  window._CONFIG = window._CONFIG || { API_BASE_URL: "http://localhost:8000" };
</script>`)}
                </pre>
                <ol start={4} style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Ensure <code>&lt;script src="/config.js"&gt;&lt;/script&gt;</code> loads before the React bundle in <code>public/index.html</code>.</li>
                  <li>Reload the app to apply changes.</li>
                </ol>
                <p className="description" style={{ marginTop: 8 }}>
                  Note: No environment variables are required; use public/config.js for runtime configuration.
                </p>
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--color-text-muted)' }}>Theme</div>
              <div>Use the header toggle to switch between Light/Dark modes.</div>
            </div>
          </div>
        </div>

        <div className="card" aria-label="Preferences" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Preferences (Placeholders)</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" aria-label="Enable tips" />
              Enable tips and guidance
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" aria-label="Show advanced controls" />
              Show advanced controls
            </label>
            <div>
              <label htmlFor="default-location" style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
                Default Location (for job suggestions)
              </label>
              <input id="default-location" type="text" placeholder="e.g., Remote" aria-label="Default location" />
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
