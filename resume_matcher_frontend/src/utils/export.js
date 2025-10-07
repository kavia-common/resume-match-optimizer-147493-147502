//
// Utility functions for exporting data and copying text with user feedback.
// No backend calls are made; all operations occur client-side.
//
// PUBLIC_INTERFACE
export function exportJSON(filename, data) {
  /** Export a JS object as a JSON file.
   * - filename: suggested filename like 'results.json'
   * - data: any serializable object
   * Provides basic error handling and user feedback via alert().
   */
  try {
    if (!filename || typeof filename !== 'string') {
      filename = 'export.json';
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    // Create a temporary link to trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    // Lightweight user feedback
    // eslint-disable-next-line no-alert
    alert('Download started: ' + filename);
  } catch (err) {
    // eslint-disable-next-line no-alert
    alert('Failed to export JSON: ' + (err?.message || String(err)));
    // Also log to console for developer insight
    // eslint-disable-next-line no-console
    console.error('exportJSON error:', err);
  }
}

// PUBLIC_INTERFACE
export async function copyToClipboard(text) {
  /** Copy provided text to clipboard.
   * Uses the async Clipboard API with a fallback for older browsers.
   * Provides user feedback via alert().
   */
  if (!text) {
    // eslint-disable-next-line no-alert
    alert('Nothing to copy.');
    return false;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      // eslint-disable-next-line no-alert
      alert('Copied to clipboard.');
      return true;
    }

    // Fallback: create a hidden textarea and execCommand
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    // eslint-disable-next-line no-alert
    alert(ok ? 'Copied to clipboard.' : 'Copy failed.');
    return ok;
  } catch (err) {
    // eslint-disable-next-line no-alert
    alert('Failed to copy: ' + (err?.message || String(err)));
    // eslint-disable-next-line no-console
    console.error('copyToClipboard error:', err);
    return false;
  }
}
