// PlayfairCipher.js
// A plugin algorithm for the ReverseEngineer engine.
// Usage: re.use(PlayfairCipher) then re.init('PlayfairCipher', 'keyword', { ...options })

import { ReverseEngineer } from "../../ReverseEngineer.js";
export class PlayfairCipher extends ReverseEngineer{
  // --- Metadata (used by ReverseEngineer GUI/listing) ---
  static name = 'Playfair Cipher';
  static version = '1.1.1';
  static description = 'Classical 5×5 Playfair digraph substitution cipher with smart unpadding and better spacing support.';
  // --- UI policy so the GUI knows how to render controls ---
  // Requires init() to set the keyword; forward/reverse then only need input.
  static UI_POLICY = {
    requiresInit: true,
    directions: {
      init: {
        input: false,
        args: true,
        inputPh: '—',
        argsPh: '["keyword", { "mergeIJ": true, "filler": "X", "autoUnpad": true, "keepSpaces": true }]',
      },
      forward: {
        input: true,
        args: false,
        inputPh: 'Plaintext to encrypt',
        argsPh: '—',
      },
      reverse: {
        input: true,
        args: false,
        inputPh: 'Ciphertext to decrypt',
        argsPh: '—',
      },
    },
  };
  
  static category = 'Ciphers';
  static tags = [
    'playfair', 'digraph', 'substitution', 'polygraphic', 'classical',
    '5x5', 'keyword', 'alphabet', 'mergeij',
    'filler', 'autounpad', 'keepspaces', 'keeppunct', 'keepcase',
    'encrypt', 'decrypt'
  ];
  constructor() {
    super();
    this._opts = this._defaultOptions();
    this._keyword = null;
    this._square = null;      // 5×5 array
    this._pos = new Map();    // letter -> [row, col]
  }

  // -------------------- Public API expected by ReverseEngineer --------------------

  /**
   * Initialize with a keyword and optional options.
   * @param {string} keyword
   * @param {Object} [options]
   * @returns {Object} diagnostic output (also returns __ui_policy for GUI persistence)
   */
  init(keyword, options = {}) {
    this._opts = { ...this._defaultOptions(), ...(options || {}) };
    this._buildSquare(String(keyword || ''));
    return {
      message: 'Playfair initialized',
      keyword: this._keyword,
      keySquare: this._square.map(r => r.join(' ')),
      __ui_policy: PlayfairCipher.UI_POLICY,
    };
  }

  /**
   * Encrypt (forward).
   * @param {string} input Plaintext.
   * @param {...any} args Fallback: [keyword, options] if init() wasn't called.
   * @returns {string}
   */
  addForwardAlgorithm(input, ...args) {
    this._ensureReadyOrArgs(args);
    return this._crypt(String(input ?? ''), 'enc');
  }

  /**
   * Decrypt (reverse).
   * @param {string} input Ciphertext.
   * @param {...any} args Fallback: [keyword, options] if init() wasn't called.
   * @returns {string}
   */
  addReverseAlgorithm(input, ...args) {
    this._ensureReadyOrArgs(args);
    return this._crypt(String(input ?? ''), 'dec');
  }

  /**
   * Optional cleanup.
   */
  dispose() {
    this._keyword = null;
    this._square = null;
    this._pos.clear();
  }

  // ------------------------------- Internal helpers -------------------------------

  _defaultOptions() {
    return {
      mergeIJ: true,       // Map J -> I (classic). If false, you’ll need an alternative 25-letter scheme.
      filler: 'X',         // Filler for repeated letters / padding
      fillerAlt: 'Q',      // Alternate filler used when the letter itself is the filler, e.g., "X"
      padOdd: true,        // Pad last dangling letter
      stripNonLetters: true,  // Remove non A–Z before processing (traditional)
      keepSpaces: false,      // Keep original spaces (best with stripNonLetters=false). Now also reinserts when true.
      keepPunct: false,       // Keep punctuation in place (best with stripNonLetters=false). Now also reinserts when true.
      keepCase: false,        // Preserve original casing in the output
      alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      autoUnpad: true,        // NEW: Smart removal of padding/fillers during decrypt
    };
  }

  _ensureReadyOrArgs(args) {
    if (this._square) return; // already initialized
    if (args && args.length) {
      const [kw, options] = args;
      this.init(kw ?? '', options ?? {});
      return;
    }
    // No init and no fallback args -> make it explicit
    throw new Error(
      'PlayfairCipher is not initialized. Call init("keyword", options) first, or pass [keyword, options] as extra args.'
    );
  }

  _normLetter(ch) {
    const A = this._opts.alphabet;
    const up = ch.toUpperCase();
    if (!A.includes(up)) return null;
    if (this._opts.mergeIJ && up === 'J') return 'I';
    return up;
  }

  _sanitizeKeyword(keyword) {
    const A = this._opts.alphabet;
    const seen = new Set();
    const out = [];
    for (const ch of String(keyword).toUpperCase()) {
      if (!A.includes(ch)) continue;
      const L = this._normLetter(ch);
      if (!L) continue;
      if (!seen.has(L)) {
        seen.add(L);
        out.push(L);
      }
    }
    return out.join('');
  }

  _buildSquare(keyword) {
    const A = this._opts.alphabet;
    const usedAlphabet = this._opts.mergeIJ ? A.replace('J', '') : A; // 25 symbols
    const key = this._sanitizeKeyword(keyword);
    const seen = new Set();
    const letters = [];

    // from keyword
    for (const ch of key) {
      if (!seen.has(ch) && usedAlphabet.includes(ch)) {
        seen.add(ch);
        letters.push(ch);
      }
    }
    // then remaining alphabet
    for (const ch of usedAlphabet) {
      if (!seen.has(ch)) {
        seen.add(ch);
        letters.push(ch);
      }
    }

    // 5x5 square
    this._square = [];
    this._pos.clear();
    for (let r = 0; r < 5; r++) {
      const row = letters.slice(r * 5, r * 5 + 5);
      this._square.push(row);
      for (let c = 0; c < 5; c++) {
        this._pos.set(row[c], [r, c]);
      }
    }
    this._keyword = keyword;
  }

  _prepareText(raw, mode) {
    const { stripNonLetters, keepSpaces, keepPunct, keepCase } = this._opts;
    const chars = [...String(raw)];

    // Track positions of non-letters if we want to re-insert them
    const nonLetterMap = [];
    const letters = [];

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const L = this._normLetter(ch);
      if (L) {
        letters.push({ L, orig: ch });
      } else {
        nonLetterMap.push({ index: i, ch });
      }
    }

    if (stripNonLetters) {
      // Only letters processed, non-letters dropped unless we explicitly preserve
      return {
        letters,
        nonLetterMap: (keepSpaces || keepPunct) ? nonLetterMap : [],
        keepCase,
      };
    }

    // If we are not stripping non-letters, we’ll rebuild full string later; for the
    // Playfair operation itself, we still use only the letters.
    return { letters, nonLetterMap, keepCase };
  }

  _pairsForEncryption(letters) {
    // letters: array of { L, orig }
    const { filler, fillerAlt, padOdd } = this._opts;
    const chosenFiller = (ch) => (ch === filler ? (this._opts.fillerAlt || 'Q') : filler);

    const out = [];
    let i = 0;

    while (i < letters.length) {
      const a = letters[i]?.L;
      const aOrig = letters[i]?.orig;
      if (a === undefined) break;

      const b = letters[i + 1]?.L;
      const bOrig = letters[i + 1]?.orig;

      if (b === undefined) {
        // dangling last letter
        if (padOdd) {
          const f = chosenFiller(a);
          out.push([{ L: a, orig: aOrig }, { L: f, orig: f }]);
        } else {
          out.push([{ L: a, orig: aOrig }]);
        }
        i += 1;
        break;
      }

      if (a === b) {
        // repeated in a pair -> insert filler between them
        const f = chosenFiller(a);
        out.push([{ L: a, orig: aOrig }, { L: f, orig: f }]);
        i += 1; // only advance by 1 so b will be reconsidered
      } else {
        out.push([{ L: a, orig: aOrig }, { L: b, orig: bOrig }]);
        i += 2;
      }
    }
    return out;
  }

  _pairsForDecryption(letters) {
    // For decryption we just chunk 2-by-2
    const out = [];
    for (let i = 0; i < letters.length; i += 2) {
      const a = letters[i]; const b = letters[i + 1];
      if (a && b) out.push([a, b]);
      else if (a) out.push([a]); // odd count; rare if ciphertext was valid
    }
    return out;
  }

  _encodePair(a, b) {
    const [r1, c1] = this._pos.get(a);
    const [r2, c2] = this._pos.get(b);
    if (r1 === r2) {
      // same row -> shift right
      return [this._square[r1][(c1 + 1) % 5], this._square[r2][(c2 + 1) % 5]];
    }
    if (c1 === c2) {
      // same column -> shift down
      return [this._square[(r1 + 1) % 5][c1], this._square[(r2 + 1) % 5][c2]];
    }
    // rectangle -> swap columns
    return [this._square[r1][c2], this._square[r2][c1]];
  }

  _decodePair(a, b) {
    const [r1, c1] = this._pos.get(a);
    const [r2, c2] = this._pos.get(b);
    if (r1 === r2) {
      // same row -> shift left
      return [this._square[r1][(c1 + 5 - 1) % 5], this._square[r2][(c2 + 5 - 1) % 5]];
    }
    if (c1 === c2) {
      // same column -> shift up
      return [this._square[(r1 + 5 - 1) % 5][c1], this._square[(r2 + 5 - 1) % 5][c2]];
    }
    // rectangle -> swap columns
    return [this._square[r1][c2], this._square[r2][c1]];
  }

  // NEW: remove inserted fillers after decryption (between doubled letters and final pad)
  _removeFillersAfterDecrypt(outLetters) {
    const f = this._opts.filler;
    const alt = this._opts.fillerAlt || 'Q';
    const chosenFillerFor = (ch) => (ch === f ? alt : f);

    // Remove filler between doubled letters: A f A -> AA
    const res = [];
    for (let i = 0; i < outLetters.length; i++) {
      const prev = res.length ? res[res.length - 1] : undefined;
      const curr = outLetters[i];
      const next = outLetters[i + 1];

      if (prev && next && prev === next && curr === chosenFillerFor(prev)) {
        // Skip this filler
        continue;
      }
      res.push(curr);
    }

    // Remove trailing filler (odd-length padding): ... B [chosenFiller(B)] -> ... B
    if (res.length >= 2) {
      const last = res[res.length - 1];
      const before = res[res.length - 2];
      if (last === chosenFillerFor(before)) res.pop();
    }
    return res;
  }

  _crypt(input, mode) {
    const prep = this._prepareText(input, mode);
    const letters = prep.letters.map(x => ({ L: x.L, orig: x.orig }));

    const pairs = mode === 'enc'
      ? this._pairsForEncryption(letters)
      : this._pairsForDecryption(letters);

    const outLetters = [];
    for (const pair of pairs) {
      if (pair.length < 2) {
        // odd leftover — copy as-is
        outLetters.push(pair[0].L);
        continue;
      }
      const a = pair[0].L;
      const b = pair[1].L;
      const [A, B] = mode === 'enc' ? this._encodePair(a, b) : this._decodePair(a, b);
      outLetters.push(A, B);
    }

    // NEW: smart unpadding on decrypt
    let resultLetters = outLetters;
    if (mode === 'dec' && this._opts.autoUnpad) {
      resultLetters = this._removeFillersAfterDecrypt(outLetters);
    }

    // Reinsert non-letters/spaces/punct if requested; otherwise join letters only
    let result = resultLetters.join('');

    if (prep.keepCase) {
      // restore case using original letters’ casing pattern where feasible
      const origLettersOnly = prep.letters.map(o => o.orig);
      const resultChars = [...result];
      for (let i = 0; i < Math.min(origLettersOnly.length, resultChars.length); i++) {
        if (/[a-z]/.test(origLettersOnly[i])) {
          resultChars[i] = resultChars[i].toLowerCase();
        }
      }
      result = resultChars.join('');
    }

    // Updated: reinsert when either keepSpaces or keepPunct is true (regardless of stripNonLetters)
    if (this._opts.keepSpaces || this._opts.keepPunct) {
      const resChars = [];
      let li = 0;
      const A = this._opts.alphabet;
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        const up = ch.toUpperCase();
        const isLetter = A.includes(up) || (this._opts.mergeIJ && up === 'J');
        if (isLetter) {
          resChars.push(result[li++] ?? '');
        } else {
          if (this._opts.keepSpaces && ch === ' ') resChars.push(ch);
          else if (this._opts.keepPunct && !/\s/.test(ch)) resChars.push(ch);
          // else skip
        }
      }
      // Append any remaining letters (e.g., from padding removal differences)
      while (li < result.length) resChars.push(result[li++]);
      result = resChars.join('');
    }

    return result;
  }
}