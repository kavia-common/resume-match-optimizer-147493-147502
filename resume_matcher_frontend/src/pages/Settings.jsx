import React, { useMemo } from 'react';
import Container from '../components/Layout/Container';
import { getApiBaseUrl } from '../constants/config';

// PUBLIC_INTERFACE
export default function Settings() {
  /**
   * Settings - Shows runtime configuration and simple controls (placeholders).
   * - Displays resolved API base URL using runtime config
   * - Includes clear instructions to configure public/config.js
   * - Does not persist or call APIs yet
   */
  const apiBase = useMemo(() => getApiBaseUrl(), []);

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
              <div style={{ color: 'var(--color-text-muted)' }}>API Base URL (resolved)</div>
              <code style={{ display: 'block', marginTop: 4 }}>{apiBase}</code>
            </div>

            <div>
              <div style={{ color: 'var(--color-text-muted)' }}>How to change API Base URL</div>
              <div className="card" style={{ marginTop: 8 }}>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Open the file: <code>public/config.js</code></li>
                  <li>Set <code>window._CONFIG.API_BASE_URL</code> to your backend URL (no trailing slash)</li>
                  <li>Example: <code>window._CONFIG = {{ API_BASE_URL: 'http://localhost:8000' }}</code></li>
                  <li>Reload the app to apply changes</li>
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
