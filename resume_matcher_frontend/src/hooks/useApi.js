import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * PUBLIC_INTERFACE
 * useApi - A reusable hook to manage async API calls with loading, error, cancellation, and timeouts.
 *
 * Aligns returned error objects with the standardized ApiError shape used in src/api/client.js:
 * { code: 'NETWORK_ERROR'|'TIMEOUT'|'HTTP_ERROR'|'PARSING_ERROR'|string, message: string, status?: number, details?: any }
 *
 * fn signature:
 *   - The provided fn must be an async function that returns data and should accept an options object:
 *       async function fn(args, options?: { signal?: AbortSignal, timeout?: number }): Promise<any>
 *   - The hook will pass an AbortSignal and optional timeout to fn for cancellation/timeout support.
 *
 * @template TArgs, TData
 * @param {(args?: TArgs, options?: { signal?: AbortSignal, timeout?: number }) => Promise<TData>} fn
 *   Async function that performs the request and returns data (NOT the raw fetch Response).
 * @param {{ auto?: boolean, initialArgs?: TArgs, timeout?: number }} [config]
 *   - auto: when true, will run once on mount using initialArgs (default: false)
 *   - initialArgs: arguments to pass when auto is true
 *   - timeout: optional timeout in ms; passed through to fn (fn may implement)
 *
 * @returns {{
 *   isLoading: boolean,
 *   error: null | { code: string, message: string, status?: number, details?: any },
 *   data: TData | null,
 *   request: (args?: TArgs, options?: { timeout?: number }) => Promise<{ data: TData | null, error: any }>,
 *   reset: () => void
 * }}
 *
 * @example
 * import { get, postJson } from '../api/client';
 * import useApi from '../hooks/useApi';
 *
 * // Example 1: Using with GET helper
 * function JobsSuggest() {
 *   const suggestFn = useCallback(async (args = {}, { signal, timeout } = {}) => {
 *     // Our api/client.get returns { data }, we only need to return data
 *     const { data } = await get('/api/jobs/suggest', args, { signal, timeout });
 *     return data;
 *   }, []);
 *
 *   const { isLoading, error, data, request, reset } = useApi(suggestFn);
 *
 *   useEffect(() => {
 *     request({ q: 'frontend', location: 'remote' });
 *   }, [request]);
 *
 *   if (isLoading) return <p>Loading…</p>;
 *   if (error) return <p>Error: {error.message}</p>;
 *   return (
 *     <div>
 *       <button onClick={reset}>Reset</button>
 *       <pre>{JSON.stringify(data, null, 2)}</pre>
 *     </div>
 *   );
 * }
 *
 * // Example 2: Using with POST JSON helper
 * function AnalyzeResume({ resumeText, jobDescription }) {
 *   const analyzeFn = useCallback(async (payload, { signal, timeout } = {}) => {
 *     const { data } = await postJson('/api/resumes/analyze', payload, { signal, timeout });
 *     return data;
 *   }, []);
 *
 *   const { isLoading, error, data, request } = useApi(analyzeFn);
 *
 *   const onAnalyze = () => request({ resumeText, jobDescription }, { timeout: 30000 });
 *
 *   return (
 *     <div>
 *       <button className="btn btn-primary" onClick={onAnalyze} disabled={isLoading}>
 *         {isLoading ? 'Analyzing…' : 'Analyze'}
 *       </button>
 *       {error && <p style={{ color: 'red' }}>{error.message}</p>}
 *       {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
 *     </div>
 *   );
 * }
 */
function useApi(fn, config = {}) {
  const { auto = false, initialArgs, timeout } = config;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // standardized error or null
  const [data, setData] = useState(null);

  const abortRef = useRef(null);
  const mountedRef = useRef(true);
  const latestArgsRef = useRef(initialArgs);

  // Normalize errors to align with ApiError shape from api/client.js
  const toApiError = useCallback((err) => {
    if (err && typeof err === 'object' && err.code && err.message) {
      // Already standardized by api/client.js
      return err;
    }
    // Coerce into standardized shape
    const message = (err && err.message) ? String(err.message) : 'Unexpected error';
    return { code: 'UNKNOWN_ERROR', message };
  }, []);

  // Cleanup on unmount: cancel any in-flight request
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch (_) {}
      }
    };
  }, []);

  const reset = useCallback(() => {
    if (!mountedRef.current) return;
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  const request = useCallback(
    async (args, options = {}) => {
      // Cancel previous if any
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch (_) {}
      }
      const controller = new AbortController();
      abortRef.current = controller;

      const effectiveTimeout = options.timeout ?? timeout;

      setIsLoading(true);
      setError(null);

      // Allow fn to handle timeout through its own mechanism if supported via options
      const run = async () => {
        try {
          const result = await fn(args, { signal: controller.signal, timeout: effectiveTimeout });
          if (!mountedRef.current || controller.signal.aborted) return { data: null, error: null };
          setData(result ?? null);
          setIsLoading(false);
          return { data: result ?? null, error: null };
        } catch (err) {
          if (!mountedRef.current || controller.signal.aborted) {
            // Swallow errors from aborted requests
            setIsLoading(false);
            return { data: null, error: null };
          }
          const apiErr = toApiError(err);
          setError(apiErr);
          setIsLoading(false);
          return { data: null, error: apiErr };
        } finally {
          // Clear only if this controller is the current one
          if (abortRef.current === controller) {
            abortRef.current = null;
          }
        }
      };

      return run();
    },
    [fn, timeout, toApiError]
  );

  // Auto-run on mount if requested
  useEffect(() => {
    if (!auto) return;
    latestArgsRef.current = initialArgs;
    request(initialArgs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  return { isLoading, error, data, request, reset };
}

export default useApi;
