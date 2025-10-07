import React, { useEffect, useMemo, useState } from 'react';
import Container from '../components/Layout/Container';
import { getApiBaseUrl } from '../constants/config';
import { apiUrl, endpoints } from '../api/endpoints';
import { clearDrafts } from '../utils/storage';
import { getLastError, subscribe } from '../api/errorStore';
import { get, postJson } from '../api/client';

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

  const [clearMessage, setClearMessage] = useState('');

  // Diagnostics state
  const [health, setHealth] = useState({ status: 'idle', lastCheckedAt: null, details: null });
  const [lastErr, setLastErr] = useState(() => getLastError());
  const [diagRunning, setDiagRunning] = useState(false);
  const [diagResults, setDiagResults] = useState({
    health: null,
    matchTest: null,
  });

  // Subscribe to last error updates
  useEffect(() => {
    const unsub = subscribe((err) => setLastErr(err));
    return () => { try { unsub(); } catch (_) {} };
  }, []);

  // Helpers to classify likely issue
  const errorHint = useMemo(() => {
    if (!lastErr) return null;
    const msg = String(lastErr.message || '').toLowerCase();
    if (msg.includes('cors') || msg.includes('preflight') || msg.includes('access-control-allow-origin')) {
      return 'Hint: This looks like a CORS issue. Ensure the backend allows this frontend origin and handles OPTIONS.';
    }
    if (msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network error')) {
      return 'Hint: Likely a network/connectivity issue. Verify API_BASE_URL, backend is reachable, and schemes (http/https) match.';
    }
    if (msg.includes('timeout')) {
      return 'Hint: Backend may be slow or unreachable. Check server status and increase timeouts if necessary.';
    }
    return null;
  }, [lastErr]);

  // Run health check
  const runHealthCheck = async () => {
    setHealth({ status: 'checking', lastCheckedAt: null, details: null });
    try {
      const { data, status } = await get('/api/health', undefined, { timeout: 8000 });
      setHealth({ status: status === 200 ? 'ok' : 'fail', lastCheckedAt: Date.now(), details: { data, status } });
    } catch (e) {
      setHealth({ status: 'fail', lastCheckedAt: Date.now(), details: e });
    }
  };

  // Run full diagnostics
  const runDiagnostics = async () => {
    setDiagRunning(true);
    const results = { health: null, matchTest: null, meta: {
      apiBaseUrl: apiBase,
      endpoints: {
        analyze: endpoints.resumesAnalyze(),
        match: endpoints.jobsMatch(),
        suggest: endpoints.jobsSuggest(),
        health: apiUrl('/api/health'),
      },
      ts: Date.now(),
      origin: typeof window !== 'undefined' ? window.location.origin : 'n/a',
    } };

    // Health GET
    try {
      const { status } = await get('/api/health', undefined, { timeout: 8000 });
      results.health = { ok: status === 200, status, statusText: status === 200 ? 'OK' : 'Non-200', url: apiUrl('/api/health'), method: 'GET' };
    } catch (e) {
      results.health = {
        ok: false,
        status: e?.status ?? 0,
        statusText: e?.message || 'Error',
        url: apiUrl('/api/health'),
        method: 'GET',
        code: e?.code,
      };
    }

    // Minimal match POST (backend should validate; we only test connectivity + status)
    const minimalMatchBody = { resumeId: 'diag', jobIds: [] };
    try {
      const { status } = await postJson('/api/jobs/match', minimalMatchBody, { timeout: 8000 });
      results.matchTest = { ok: status >= 200 && status < 300, status, statusText: 'OK', url: endpoints.jobsMatch(), method: 'POST' };
    } catch (e) {
      results.matchTest = {
        ok: false,
        status: e?.status ?? 0,
        statusText: e?.message || 'Error',
        url: endpoints.jobsMatch(),
        method: 'POST',
        code: e?.code,
      };
    }

    setDiagResults(results);
    setDiagRunning(false);
  };

  const copyDiagnostics = async () => {
    try {
      const payload = {
        meta: {
          apiBaseUrl: apiBase,
          origin: typeof window !== 'undefined' ? window.location.origin : 'n/a',
          ts: Date.now(),
        },
        endpoints: {
          analyze: endpoints.resumesAnalyze(),
          match: endpoints.jobsMatch(),
          suggest: endpoints.jobsSuggest(),
          health: apiUrl('/api/health'),
        },
        health,
        lastError: lastErr,
        runResults: diagResults,
      };
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      alert('Diagnostics copied to clipboard.');
    } catch {
      alert('Failed to copy diagnostics.');
    }
  };

  return (
    <Container as="section" role="region" ariaLabel="Settings">
      <div className="panel">
        <header style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Settings</h2>
          <p className="description">View runtime configuration and adjust preferences.</p>
        </header>

        {/* Diagnostics */}
        <div className="card" aria-label="Connectivity diagnostics">
          <h3 style={{ marginTop: 0 }}>Connectivity Diagnostics</h3>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            <div>
              <div style={{ color: 'var(--color-text-muted)' }}>Resolved endpoints</div>
              <div className="card" style={{ marginTop: 8 }}>
                <div>API Base URL:</div>
                <code style={{ display: 'block', marginTop: 4 }}>{apiBase}</code>
                <div style={{ marginTop: 8 }}>Analyze (POST):</div>
                <code style={{ display: 'block', marginTop: 4 }}>{endpoints.resumesAnalyze()}</code>
                <div style={{ marginTop: 8 }}>Match (POST):</div>
                <code style={{ display: 'block', marginTop: 4 }}>{endpoints.jobsMatch()}</code>
                <div style={{ marginTop: 8 }}>Suggest (GET/POST path):</div>
                <code style={{ display: 'block', marginTop: 4 }}>{endpoints.jobsSuggest()}</code>
                <div style={{ marginTop: 8 }}>Health (GET):</div>
                <code style={{ display: 'block', marginTop: 4 }}>{apiUrl('/api/health')}</code>
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--color-text-muted)' }}>Quick health check</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={runHealthCheck} aria-label="Run health check">
                  {health.status === 'checking' ? 'Checking…' : 'Check health'}
                </button>
                {health.status !== 'idle' && (
                  <span aria-live="polite" style={{ fontSize: 14 }}>
                    Status:{' '}
                    <strong style={{ color: health.status === 'ok' ? 'var(--color-primary)' : 'var(--color-error)' }}>
                      {health.status === 'ok' ? 'OK' : 'Fail'}
                    </strong>
                    {health.lastCheckedAt && (
                      <span style={{ marginLeft: 8, color: 'var(--color-text-muted)' }}>
                        at {new Date(health.lastCheckedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </span>
                )}
                <a href={apiUrl('/api/health')} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto' }}>
                  Open /api/health
                </a>
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--color-text-muted)' }}>Last network/API error</div>
              {!lastErr ? (
                <div className="card" style={{ marginTop: 8 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>No errors captured yet.</span>
                </div>
              ) : (
                <div className="card" style={{ marginTop: 8 }}>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <div><strong>Code:</strong> {lastErr.code}</div>
                    <div><strong>Message:</strong> {lastErr.message}</div>
                    {lastErr.status !== undefined && <div><strong>Status:</strong> {lastErr.status}</div>}
                    {lastErr.method && <div><strong>Method:</strong> {lastErr.method}</div>}
                    {lastErr.url && <div><strong>URL:</strong> <code>{lastErr.url}</code></div>}
                    {lastErr.ts && (
                      <div><strong>When:</strong> {new Date(lastErr.ts).toLocaleString()}</div>
                    )}
                    {errorHint && (
                      <div role="note" style={{ color: 'var(--color-text-muted)', marginTop: 6 }}>
                        {errorHint}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div style={{ color: 'var(--color-text-muted)' }}>Full diagnostics</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={runDiagnostics}
                  disabled={diagRunning}
                  aria-label="Run diagnostics"
                >
                  {diagRunning ? 'Running…' : 'Run diagnostics'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={copyDiagnostics}
                  aria-label="Copy diagnostics JSON"
                  title="Copy diagnostics JSON"
                >
                  Copy as JSON
                </button>
              </div>
              <div className="card" style={{ marginTop: 8, padding: 12 }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  <code>
                    {JSON.stringify(
                      {
                        meta: {
                          apiBaseUrl: apiBase,
                          origin: typeof window !== 'undefined' ? window.location.origin : 'n/a',
                        },
                        results: diagResults,
                      },
                      null,
                      2
                    )}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>

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

        {/* Draft management */}
        <div className="card" aria-label="Draft management" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Drafts</h3>
          <p className="description" style={{ marginTop: 4 }}>
            Manage locally saved drafts for Resume and Job forms. Drafts are stored in your browser only.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                const res = clearDrafts();
                const count = (res?.removed || []).length;
                setClearMessage(count > 0 ? `Cleared ${count} draft key(s).` : 'No drafts found to clear.');
                // Auto-hide message after a moment
                setTimeout(() => setClearMessage(''), 2500);
              }}
              aria-label="Clear all saved drafts"
              title="Clear all saved drafts"
            >
              Clear All Drafts
            </button>
            {clearMessage && (
              <span aria-live="polite" style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                {clearMessage}
              </span>
            )}
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
