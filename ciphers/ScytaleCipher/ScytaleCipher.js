// Scytale cipher algorithm plug‑in for ReverseEngineer.
// Convention: key = number of rows (≥ 2).
// Encryption: write plaintext row-wise into a k×ceil(L/k) grid; read out column-wise.
// Decryption: inverse of the above. Brute force tries keys in [minKey..maxKey].
import { ReverseEngineer } from "../../ReverseEngineer.js";

export class ScytaleCipher extends ReverseEngineer {
  static name = 'Scytale Cipher';
  static version = '1.0.1';
  static description = 'Classical Spartan transposition cipher (key = rows).';
  static UI_POLICY = {
    requiresInit: false,
    directions: {
      init:    { input: false, args: true,  inputPh: '—',           argsPh: '—' },
      forward: { input: true,  args: true,  inputPh: 'Plaintext',   argsPh: 'key[, { "padChar":"X" }]' },
      reverse: { input: true,  args: true,  inputPh: 'Ciphertext',  argsPh: 'key | { "bruteForce":true, "minKey":2, "maxKey":20, "filter":".*" }' }
    }
  };
  static category = "Ciphers";
  static tags = ["Scytale", "Transposition", "Rows", "Columns", "PadChar", "Encrypt", "Decrypt"];
  constructor() {
    super();
  }

  /**
   * Encrypt (forward): Scytale transposition with key = number of rows.
   * @param {string} input Plaintext
   * @param {number} key   Number of rows (>=2)
   * @param {{padChar?:string}} [opts]
   * @returns {string} Ciphertext
   */
  addForwardAlgorithm(input, key, opts = {}) {
    const text = String(input ?? '');
    const k = this.#asInt(key);
    if (!Number.isInteger(k) || k < 2) {
      throw new Error('Scytale.forward: "key" must be an integer >= 2');
    }

    const L = text.length;
    const cols = Math.ceil(L / k);
    const padChar = (opts && typeof opts.padChar === 'string' && opts.padChar.length > 0)
      ? opts.padChar[0]
      : null;

    // Build matrix k x cols; write row-wise
    const matrix = Array.from({ length: k }, () => Array(cols).fill(undefined));
    let idx = 0;
    for (let r = 0; r < k; r++) {
      for (let c = 0; c < cols; c++) {
        if (idx < L) {
          matrix[r][c] = text[idx++];
        } else if (padChar !== null) {
          matrix[r][c] = padChar;
        }
      }
    }

    // Read column-wise -> ciphertext
    let out = '';
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < k; r++) {
        const ch = matrix[r][c];
        if (ch !== undefined) out += ch;
      }
    }
    return out;
  }

  /**
   * Decrypt (reverse): If "bruteForce" option is set (via options object),
   * tries keys within a range and returns all candidates.
   * @param {string} input Ciphertext
   * @param {number|object} keyOrOptions Either a numeric key or an options object
   * @param {object} [maybeOptions] Optional options if key is numeric
   * @returns {string|Array<{key:number, plaintext:string}>}
   */
  addReverseAlgorithm(input, keyOrOptions, maybeOptions = {}) {
    const cipher = String(input ?? '');
    const { isBrute, opts } = this.#normalizeReverseArgs(keyOrOptions, maybeOptions);

    if (isBrute) {
      const L = cipher.length;
      const minKey = Math.max(2, this.#asInt(opts.minKey ?? 2));
      const maxKey = Math.min(this.#asInt(opts.maxKey ?? L), L);

      const filterRegex = this.#toRegex(opts.filter);
      const results = [];
      for (let k = minKey; k <= maxKey; k++) {
        const candidate = this.#decodeWithKey(cipher, k, opts);
        if (!filterRegex || filterRegex.test(candidate)) {
          results.push({ key: k, plaintext: candidate });
        }
      }
      return results;
    }

    // Normal keyed decode
    const k = this.#asInt(keyOrOptions);
    if (!Number.isInteger(k) || k < 2) {
      throw new Error('Scytale.reverse: "key" must be an integer >= 2 (or pass { bruteForce:true })');
    }
    return this.#decodeWithKey(cipher, k, maybeOptions);
  }

  // -------------------- Internals --------------------

  #decodeWithKey(cipher, k, opts = {}) {
    const L = cipher.length;
    if (L === 0) return '';

    const cols = Math.ceil(L / k);
    const fullRows = Math.floor(L / cols);
    const remainder = L % cols;

    // Determine length of each row as in the encoder (row-wise write)
    const rowLens = Array.from({ length: k }, (_, r) => {
      if (r < fullRows) return cols;
      if (r === fullRows) return remainder === 0 ? 0 : remainder;
      return 0;
    });

    // Handle cases where message doesn't reach all rows
    // (e.g., k too large). No row should be negative; ensure total matches L.
    const totalCells = rowLens.reduce((a, b) => a + b, 0);
    if (totalCells !== L) {
      // If key is too large (more rows than filled), rows after needed ones will be 0,
      // still fine. If mismatch, adjust conservatively:
      // Fill rows from top with as many as possible.
      let remaining = L;
      for (let r = 0; r < k; r++) {
        const take = Math.min(remaining, cols);
        rowLens[r] = take;
        remaining -= take;
      }
    }

    // Build matrix shape
    const matrix = Array.from({ length: k }, (_, r) => Array(rowLens[r]).fill(undefined));

    // Fill matrix in the same order encryption *read* (column-wise),
    // so we invert by placing ciphertext characters along (c,r) traversal.
    let idx = 0;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < k; r++) {
        if (c < (matrix[r]?.length ?? 0)) {
          matrix[r][c] = cipher[idx++];
        }
      }
    }

    // Read row-wise to get plaintext
    let plain = '';
    for (let r = 0; r < k; r++) {
      for (let c = 0; c < (matrix[r]?.length ?? 0); c++) {
        const ch = matrix[r][c];
        if (ch !== undefined) plain += ch;
      }
    }

    // Optional pad stripping (from the tail only)
    if (opts && opts.stripPad) {
      const padChar = (typeof opts.stripPad === 'string' && opts.stripPad.length > 0)
        ? opts.stripPad[0]
        : (typeof opts.padChar === 'string' && opts.padChar.length > 0 ? opts.padChar[0] : null);
      if (padChar) {
        let end = plain.length;
        while (end > 0 && plain[end - 1] === padChar) end--;
        plain = plain.slice(0, end);
      }
    }

    return plain;
  }

  #normalizeReverseArgs(keyOrOptions, maybeOptions) {
    // If the first argument is an object, treat it as options with bruteForce flag.
    if (keyOrOptions && typeof keyOrOptions === 'object' && !Array.isArray(keyOrOptions)) {
      const opts = keyOrOptions;
      return { isBrute: !!opts.bruteForce, opts };
    }
    // Else numeric key with possible options
    return { isBrute: !!(maybeOptions && maybeOptions.bruteForce), opts: maybeOptions || {} };
  }

  #asInt(v) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : NaN;
  }

  #toRegex(v) {
    if (!v) return null;
    if (v instanceof RegExp) return v;
    if (typeof v === 'string') {
      try { return new RegExp(v); } catch { return null; }
    }
    return null;
  }
}