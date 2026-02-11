import { ReverseEngineer } from "../../ReverseEngineer.js";

export const Base64 = class extends ReverseEngineer {
  //Configuration
  description = "Encodes and decodes strings to/from Base64";
  version = "1.0.0";
  constructor() {
    super();
    this.getInstance();
  }
  /**
   * Execute on initialize
   */
  init(){
    this.debug('INFO','Base64 algorithm successfully loaded!');
  }

  /**
   * Encodes the string to Base64
   * @param {String} message Message to encode
   * @param {boolean} [sanitize=false] If true: remove padding/whitespace and optionally lowercase
   * @param {Object} [sanitizeOptions] Options for sanitization
   * @param {boolean} [sanitizeOptions.lower=false] Lowercase sanitized output (not typical for Base64, but supported)
   * @param {boolean} [sanitizeOptions.urlSafe=false] Convert to Base64URL (- and _ instead of + and /)
   * @returns {String} Encoded string
   */
  addForwardAlgorithm(message,sanitize = false,sanitizeOptions = { lower: false, urlSafe: false }) {
    /**
     * Convert Base64 output into a sanitized representation:
     * - optionally convert to URL-safe base64
     * - remove padding "="
     * - remove whitespace
     * - optionally lowercase
     */
    const sanitizeBase64 = (str, { lower = false, urlSafe = false } = {}) => {
      let cleaned = str.replace(/\s+/g, "");

      if (urlSafe) {
        cleaned = cleaned.replace(/\+/g, "-").replace(/\//g, "_");
      }

      cleaned = cleaned.replace(/=+$/g, "");

      return lower ? cleaned.toLowerCase() : cleaned;
    };

    // Encode to UTF-8 bytes
    const bytes = new TextEncoder().encode(message);

    // Convert bytes -> binary string (safe for btoa)
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);

    // Standard Base64
    const encoded = btoa(binary);

    return sanitize ? sanitizeBase64(encoded, sanitizeOptions) : encoded;
  }

  /**
   * Decode Base64
   * @param {String} base64 Base64 string
   * @param {boolean} [isSanitized=false] If true: normalize missing padding, URL-safe chars, whitespace, etc.
   * @param {Object} [decodeOptions] Options for decode normalization
   * @param {boolean} [decodeOptions.urlSafe=true] Treat '-' and '_' as URL-safe Base64 and normalize to + and /
   * @returns {String} Decoded string
   */
  addReverseAlgorithm(base64, isSanitized = false, decodeOptions = { urlSafe: true }) {
    /**
     * Normalize an incoming Base64 string so it can be decoded:
     * - trim & remove whitespace
     * - if sanitized: normalize URL-safe chars (-, _) -> (+, /)
     * - restore missing padding to multiple of 4
     */
    const normalizeForDecode = (str, isSanitized = false, { urlSafe = true } = {}) => {
      let clean = String(str).trim().replace(/\s+/g, "");

      if (isSanitized && urlSafe) {
        clean = clean.replace(/-/g, "+").replace(/_/g, "/");
      }

      // If someone lowercased it, Base64 is case-sensitive.
      // We do NOT auto-upcase here because it would corrupt data.
      // We just decode exactly as provided after normalization.

      // Remove any existing padding then re-pad correctly
      clean = clean.replace(/=+$/g, "");
      const padLen = (4 - (clean.length % 4)) % 4;
      if (padLen) clean += "=".repeat(padLen);

      return clean;
    };

    const clean = normalizeForDecode(base64, isSanitized, decodeOptions);

    // atob -> binary string
    let binary;
    try {
      binary = atob(clean);
    } catch (e) {
      throw new Error("Invalid Base64 input (after normalization).");
    }

    // binary string -> bytes
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // bytes -> UTF-8 string
    return new TextDecoder().decode(bytes);
  }
}