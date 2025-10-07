//
// File utilities for uploads, validation, and simple reading.
//
// This module centralizes file handling logic for the app.
// It avoids adding heavy parsing dependencies by providing a placeholder
// for PDF parsing that can be expanded later.
//
// PUBLIC_INTERFACE
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'text/plain', // .txt
];

// PUBLIC_INTERFACE
export const ACCEPTED_EXTENSIONS_REGEX = /\.(pdf|docx?|txt)$/i;

/**
 * PUBLIC_INTERFACE
 * validateFileType - Validates file type against allowed MIME types or extensions.
 * Returns a result object with ok:boolean and optional reason:string if invalid.
 *
 * @param {File} file - Browser File object
 * @returns {{ ok: boolean, reason?: string }}
 */
export function validateFileType(file) {
  /** This function validates if the file appears to be PDF, DOC, DOCX, or TXT. */
  if (!file) return { ok: false, reason: 'No file selected.' };
  const typeOk =
    ACCEPTED_MIME_TYPES.includes(file.type) ||
    ACCEPTED_EXTENSIONS_REGEX.test(file.name || '');
  if (!typeOk) {
    return {
      ok: false,
      reason: 'Unsupported file type. Please upload PDF, DOC, DOCX, or TXT.',
    };
  }
  return { ok: true };
}

/**
 * PUBLIC_INTERFACE
 * validateFileSize - Validates file size in bytes against a maxMB limit.
 *
 * @param {File} file - Browser File object
 * @param {number} [maxMB=5] - Max size in megabytes
 * @returns {{ ok: boolean, reason?: string }}
 */
export function validateFileSize(file, maxMB = 5) {
  /** Ensures the file is within the allowed size. */
  if (!file) return { ok: false, reason: 'No file selected.' };
  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      ok: false,
      reason: `File too large. Maximum size is ${Math.round(maxMB)}MB.`,
    };
  }
  return { ok: true };
}

/**
 * PUBLIC_INTERFACE
 * readFileAsText - Reads a text file (.txt) into a string.
 *
 * Note: This will read any file via FileReader as text; callers should ensure
 * they only pass text/plain files or accept best-effort results.
 *
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsText(file) {
  /** Reads the given File object as text using FileReader. */
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file as text.'));
      reader.onabort = () => reject(new Error('Reading file aborted.'));
      reader.onload = () => resolve(String(reader.result || ''));
      reader.readAsText(file);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * PUBLIC_INTERFACE
 * maybeReadPdfText - Placeholder for reading text from a PDF.
 *
 * Currently returns null without parsing, as proper PDF parsing requires additional deps.
 * TODO: Integrate a lightweight PDF parser (e.g., pdfjs-dist) if needed by product scope.
 *
 * @param {File} file
 * @returns {Promise<string|null>}
 */
export async function maybeReadPdfText(_file) {
  /** Placeholder, intentionally returns null to avoid heavy dependencies. */
  return null;
}

/**
 * PUBLIC_INTERFACE
 * buildFormData - Builds a FormData with a given file under a key (default: 'file').
 *
 * @param {File} file
 * @param {string} [fieldName='file']
 * @param {Record<string,string|Blob|File|number|boolean>} [extraFields]
 * @returns {FormData}
 */
export function buildFormData(file, fieldName = 'file', extraFields = undefined) {
  /** Creates FormData and appends file and any extra fields. */
  const fd = new FormData();
  if (file) fd.append(fieldName, file);
  if (extraFields && typeof extraFields === 'object') {
    Object.entries(extraFields).forEach(([k, v]) => {
      // Normalize non-Blob values to string
      if (v instanceof Blob || v instanceof File) {
        fd.append(k, v);
      } else if (v !== undefined && v !== null) {
        fd.append(k, String(v));
      }
    });
  }
  return fd;
}

/**
 * PUBLIC_INTERFACE
 * validateFile - Combined validator for type and size with configurable max size.
 *
 * @param {File} file
 * @param {number} [maxMB=5]
 * @returns {{ ok: boolean, reason?: string }}
 */
export function validateFile(file, maxMB = 5) {
  /** Applies both type and size validation and returns the first failure or ok. */
  const type = validateFileType(file);
  if (!type.ok) return type;
  const size = validateFileSize(file, maxMB);
  if (!size.ok) return size;
  return { ok: true };
}

export default {
  ACCEPTED_MIME_TYPES,
  ACCEPTED_EXTENSIONS_REGEX,
  validateFileType,
  validateFileSize,
  readFileAsText,
  maybeReadPdfText,
  buildFormData,
  validateFile,
};
