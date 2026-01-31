import { ReverseEngineer } from "../../ReverseEngineer.js";

export const Base32 = class extends ReverseEngineer {

  constructor() {
    super();
    this.getInstance();
    this.description = "Encodes and decodes strings to/from Base32";
    this.version = "1.1.0";
  }
  /**
   * Execute on initialize
   */
  init(){
    this.debug('INFO','Base32 algorithm successfully loaded!');
  }
  /**
   * Encodes the string to Base32 (RFC 4648 alphabet)
   * @param {String} message Message to encode
   * @param {boolean} [sanitize=false] If true: remove padding and lowercase
   * @param {Object} [sanitizeOptions] Options for sanitization
   * @param {boolean} [sanitizeOptions.lower=true] Lowercase sanitized output
   * @returns {String} Encoded string
   */
  addForwardAlgorithm(message, sanitize = false, sanitizeOptions = { lower: true }) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    const bytes = new TextEncoder().encode(message);
    /**
     * Convert Base32 output into a sanitized representation:
     * - remove padding "="
     * - remove whitespace
     * - optionally lowercase (more "transport safe")
     */
    const sanitizeBase32 = (str, { lower = true } = {})=>{
        const cleaned = str.replace(/=+$/g, "").replace(/\s+/g, "");
        return lower ? cleaned.toLowerCase() : cleaned;
    }
    let bits = 0;   // bits currently in buffer
    let value = 0;  // bit buffer
    let output = "";

    for (const byte of bytes) {
      value = (value << 8) | byte;
      bits += 8;

      while (bits >= 5) {
        const index = (value >>> (bits - 5)) & 31;
        output += alphabet[index];
        bits -= 5;
      }
    }

    if (bits > 0) {
      const index = (value << (5 - bits)) & 31;
      output += alphabet[index];
    }

    // RFC 4648 padding (optional for many real-world uses)
    while (output.length % 8 !== 0) output += "=";

    // Apply sanitize if requested
    return sanitize ? sanitizeBase32(output, sanitizeOptions) : output;
  }

  /**
   * Decode Base32
   * @param {String} base32 Base32 string
   * @param {boolean} [isSanitized=false] If true: normalize common sanitized variants (0->O, 1/L->I, remove -/_)
   * @returns {String} Decoded string
   */
  addReverseAlgorithm(base32, isSanitized = false) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    /**
     * Normalize an incoming Base32 string so it can be decoded:
     * - remove whitespace
     * - accept lowercase
     * - if sanitized (human/URL safe), fix common substitutions:
     *    0 -> O, 1 -> I, L -> I
     * - strip any padding (we don't require it for decoding)
     */
    const normalizeForDecode = (str, isSanitized = false) => {
        let clean = String(str)
        .trim()
        .replace(/\s+/g, "")
        .replace(/=+$/g, "")
        .toUpperCase();

        if (isSanitized) {
            // Common human-entry normalization
            clean = clean
                .replace(/0/g, "O")
                .replace(/[1L]/g, "I");
            // If you also allow separators like '-' or '_' in sanitized strings:
            clean = clean.replace(/[-_]/g, "");
        }

        return clean;
    }

    const clean = normalizeForDecode(base32, isSanitized);

    let bits = 0;
    let value = 0;
    const bytes = [];

    for (const ch of clean) {
      const idx = alphabet.indexOf(ch);
      if (idx === -1) {
        throw new Error(`Invalid Base32 character: "${ch}"`);
      }

      value = (value << 5) | idx;
      bits += 5;

      while (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return new TextDecoder().decode(new Uint8Array(bytes));
  }
};