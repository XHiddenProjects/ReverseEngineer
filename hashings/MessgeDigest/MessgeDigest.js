import { ReverseEngineer } from "../../ReverseEngineer.js";

export class MessageDigest extends ReverseEngineer{
  static name = "Message Digest";
  static version = '1.1.1';
  static description = 'MD2 / MD4 / MD5 hashing (legacy; for testing/compat only)';
  static category = 'Hashing';
  static TAGS = ['hash', 'digest', 'md2', 'md4', 'md5', 'legacy'];

  // Presents nicer hints in your ReverseEngineerGUI
  static UI_POLICY = {
    requiresInit: false,
    directions: {
      init:    { 
        input: false, 
        args: true, 
        inputPh: '—', 
        argsPh: 'No init options required',
        allowFile:false 
      },
      forward: {
        input: true, args: true,
        inputPh: 'Plaintext to hash (UTF‑8)',
        argsPh:  'algo, encoding  (e.g.  MD5, hex  |  MD4, base64  |  MD2, bytes)',
        allowFile:false
      },
      reverse: {
        input: true,  args: false,
        inputPh: 'Expected digest (hex/base64)',
        argsPh:  '—', 
        allowFile:true
      }
    }
  };

  /** Optional: surface policy to engine sniffing */
  static getUIPolicy() { return MessageDigest.UI_POLICY; }
  getUIPolicy() { return MessageDigest.UI_POLICY; }

  // ----- Public API required by ReverseEngineer -----

  /**
   * Hash the input (positional-only: input, algo, encoding). No object args.
   * @param {string|Uint8Array} input UTF‑8 string or bytes
   * @param {string} [algo]  'MD5'|'MD4'|'MD2' (default 'MD5')
   * @param {string} [encoding] 'hex'|'base64'|'bytes'|'b64' (default 'hex')
   * @returns {string|Uint8Array}
   */
  addForwardAlgorithm(input, algo, encoding) {
    // Normalize positional params only (no object support)
    const isEnc = (v) => typeof v === 'string' && ['hex','base64','b64','bytes'].includes(v.toLowerCase());

    let a = (typeof algo === 'string') ? algo : undefined;
    let e = (typeof encoding === 'string') ? encoding : undefined;

    // Convenience: allow addForwardAlgorithm(input, 'base64') → encoding only
    if (!a && isEnc(algo)) { e = algo; }

    a = String(a ?? 'MD5');
    e = String(e ?? 'hex').toLowerCase();
    if (e === 'b64') e = 'base64';

    const bytes = input instanceof Uint8Array ? input : this.#utf8ToBytes(String(input));

    let digest;
    switch (a.toUpperCase()) {
      case 'MD5': digest = this.#md5(bytes); break;
      case 'MD4': digest = this.#md4(bytes); break;
      case 'MD2': digest = this.#md2(bytes); break;
      default: throw new Error(`Unsupported algo "${a}". Use MD5, MD4, or MD2.`);
    }
    return this.#encode(digest, e);
  }

  /**
   * Reverse — verify against file/bytes and return the paired plaintext if present.
   * Input: expected digest (hex/base64). GUI adds {file: File} automatically.
   * Returns: { ok:boolean, message:string }
   */
  async addReverseAlgorithm(expectedHash, ...args) {
    const expected = String(expectedHash ?? '').trim();
    if (!expected) {
      return { ok: false, message: 'No expected digest provided.' };
    }

    // Resolve bytes (and raw text if text file)
    const { bytes: sourceBytes, meta, rawText } = await this.#resolveSourceFromArgs(args);
    if (!sourceBytes) {
      return { ok: false, message: 'No file or byte source provided to verify against.' };
    }

    // Detect encoding (hex/base64). We cannot infer MD2/MD4/MD5 by length (all 16B),
    // so we will try all algorithms when verifying.
    const enc = this.#detectHashEncoding(expected);

    // If text: try to find plaintext paired with the digest on the line and return it
    if (meta?.mode === 'text' && typeof rawText === 'string' && rawText.length) {
      const paired = await this.#findPlaintextPairedWithDigest(rawText, expected, enc);
      if (paired !== null) return { ok: true, message: paired };
      // else fall through to generic verification
    }

    // Generic verification path: hash entire content with MD5/MD4/MD2 and compare
    const ALGOS = ['MD5', 'MD4', 'MD2'];
    for (const algo of ALGOS) {
      let digestBytes;
      if (algo === 'MD5') digestBytes = this.#md5(sourceBytes);
      else if (algo === 'MD4') digestBytes = this.#md4(sourceBytes);
      else digestBytes = this.#md2(sourceBytes);

      const computed = (enc === 'base64')
        ? this.#bytesToBase64(digestBytes)
        : this.#bytesToHex(digestBytes);

      if (this.#compareDigests(expected, computed, enc)) {
        return { ok: true, message: `[binary/text content matched ${algo}]` };
      }
    }

    return { ok: false, message: 'Hash does not match the provided content.' };
  }

  // ----- Utilities -----

  #utf8ToBytes(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    // minimal fallback
    const arr = [];
    for (let i = 0; i < str.length; i++) {
      let c = str.charCodeAt(i);
      if (c < 0x80) arr.push(c);
      else if (c < 0x800) { arr.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)); }
      else if (c >= 0xd800 && c <= 0xdbff) {
        // surrogate pair
        const c2 = str.charCodeAt(++i);
        c = 0x10000 + (((c & 0x3ff) << 10) | (c2 & 0x3ff));
        arr.push(
          0xf0 | (c >> 18),
          0x80 | ((c >> 12) & 0x3f),
          0x80 | ((c >> 6) & 0x3f),
          0x80 | (c & 0x3f)
        );
      } else {
        arr.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
      }
    }
    return new Uint8Array(arr);
  }

  #bytesToHex(bytes) {
    const tab = '0123456789abcdef';
    let s = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      s += tab[b >> 4] + tab[b & 0x0f];
    }
    return s;
  }

  #bytesToBase64(bytes) {
    if (typeof btoa === 'function') {
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return btoa(bin);
    }
    if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
    throw new Error('Base64 not supported in this environment');
  }

  #encode(bytes, out = 'hex') {
    switch (String(out).toLowerCase()) {
      case 'hex': return this.#bytesToHex(bytes);
      case 'base64': case 'b64': return this.#bytesToBase64(bytes);
      case 'bytes': return bytes;
      default: throw new Error(`Unknown output format "${out}". Use hex|base64|bytes`);
    }
  }

  #timingSafeEq(a, b) {
    if (a.length !== b.length) return false;
    let res = 0;
    for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return res === 0;
  }

  #detectHashEncoding(s) {
    const str = String(s || '');
    const isHex = /^[0-9a-fA-F]+$/.test(str) && (str.length % 2 === 0);
    if (isHex) return 'hex';
    const isB64 = /^[A-Za-z0-9+/]+={0,2}$/.test(str) && str.length > 0;
    if (isB64) return 'base64';
    return 'hex';
  }

  #compareDigests(expected, computed, enc) {
    if (enc === 'hex') return String(expected).toLowerCase() === String(computed).toLowerCase();
    return String(expected) === String(computed);
  }

  #escapeRegex(lit) {
    return String(lit).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async #resolveSourceFromArgs(args) {
    let blobOrFile = null;
    let bytes = null;

    for (const a of args) {
      if (!a) continue;
      if (a instanceof Uint8Array) { bytes = a; break; }
      if (a instanceof ArrayBuffer) { bytes = new Uint8Array(a); break; }
      if (typeof Blob !== 'undefined' && a instanceof Blob) { blobOrFile = a; break; }
      if (typeof a === 'object') {
        if (typeof Blob !== 'undefined' && a.file instanceof Blob) { blobOrFile = a.file; break; }
        if (a.bytes instanceof Uint8Array) { bytes = a.bytes; break; }
        if (a.bytes instanceof ArrayBuffer) { bytes = new Uint8Array(a.bytes); break; }
        if (a.fileInput) {
          const f = this.#resolveFileFromInput(a.fileInput);
          if (f) { blobOrFile = f; break; }
        }
      }
    }

    if (!blobOrFile && !bytes) {
      const f = this.#resolveFileFromInput('#re-file');
      if (f) blobOrFile = f;
    }

    if (blobOrFile) {
      const mime = blobOrFile.type || '';
      const name = blobOrFile.name || '';
      const mode = this.#decideReadModeByType(mime, name);
      if (mode === 'text' && typeof blobOrFile.text === 'function') {
        const txt = await blobOrFile.text();
        return {
          bytes: this.#utf8ToBytes(txt),
          meta: { kind:'blob', name, type:mime, mode:'text' },
          rawText: txt
        };
      }
      const ab = await blobOrFile.arrayBuffer();
      return {
        bytes: new Uint8Array(ab),
        meta: { kind:'blob', name, type:mime, mode:'binary' },
        rawText: undefined
      };
    }

    if (bytes) return { bytes, meta: { kind:'bytes', mode:'binary' }, rawText: undefined };
    return { bytes: null, meta: { kind:'unknown', mode:'binary' }, rawText: undefined };
  }

  #resolveFileFromInput(elOrSelector) {
    try {
      if (typeof document === 'undefined') return null;
      const el = (typeof elOrSelector === 'string') ? document.querySelector(elOrSelector) : elOrSelector;
      if (el && el.files && el.files[0]) return el.files[0];
    } catch {}
    return null;
  }

  #decideReadModeByType(mime, name) {
    const m = String(mime || '').toLowerCase();
    const ext = (String(name || '').toLowerCase().match(/\.(\w+)$/)?.[1]) || '';

    switch (true) {
      case m.startsWith('text/'):
      case m === 'application/json':
      case m === 'application/xml':
      case m === 'application/javascript':
      case m === 'application/xhtml+xml':
      case m === 'application/x-www-form-urlencoded':
      case m === 'application/sql':
      case m === 'application/csv':
        return 'text';
      case m.startsWith('image/'):
      case m.startsWith('video/'):
      case m.startsWith('audio/'):
      case m === 'application/pdf':
      case m === 'application/zip':
      case m === 'application/gzip':
      case m === 'application/x-7z-compressed':
      case m === 'application/octet-stream':
        return 'binary';
      default:
        break;
    }

    switch (ext) {
      case 'txt': case 'md': case 'csv': case 'tsv':
      case 'json': case 'xml': case 'html': case 'htm':
      case 'js': case 'mjs': case 'ts': case 'css':
      case 'scss': case 'sass': case 'less':
      case 'yml': case 'yaml': case 'ini': case 'env': case 'sql': case 'log':
        return 'text';
      default:
        return 'binary';
    }
  }

  /** Try to locate the plaintext on the same line as the digest and verify it. */
  async #findPlaintextPairedWithDigest(rawText, expected, enc) {
    const lines = String(rawText ?? '').split(/\r?\n/);
    const expRe = new RegExp(this.#escapeRegex(expected), enc === 'hex' ? 'i' : '');

    // Candidate algorithms to try (MD hashes are always 16 bytes; cannot disambiguate by length)
    const ALGOS = ['MD5', 'MD4', 'MD2'];

    for (const line of lines) {
      if (!expRe.test(line)) continue;

      const startIdx = line.search(expRe);
      const before = line.slice(0, startIdx).trimEnd();
      const after  = line.slice(startIdx + expected.length).trimStart();

      const leftNeighbor  = (before.match(/[^ \t\r\n,;:"'(){}\[\]<>]+$/) || [null])[0];
      const rightNeighbor = (after.match(/^[^ \t\r\n,;:"'(){}\[\]<>]+/) || [null])[0];

      const tokens = line.match(/[^ \t\r\n,;:"'(){}\[\]<>]+/g) || [];
      const candidates = [];
      if (leftNeighbor)  candidates.push(leftNeighbor);
      if (rightNeighbor) candidates.push(rightNeighbor);
      for (const t of tokens) if (t && t !== expected && !candidates.includes(t)) candidates.push(t);

      for (const cand of candidates) {
        const candBytes = this.#utf8ToBytes(cand);
        for (const algo of ALGOS) {
          let digestBytes;
          if (algo === 'MD5') digestBytes = this.#md5(candBytes);
          else if (algo === 'MD4') digestBytes = this.#md4(candBytes);
          else digestBytes = this.#md2(candBytes);

          const cmp = (enc === 'base64')
            ? this.#bytesToBase64(digestBytes)
            : this.#bytesToHex(digestBytes);

          if (this.#compareDigests(expected, cmp, enc)) {
            return cand;
          }
        }
      }
    }
    return null;
  }

  // ======== MD5 (RFC 1321) — aligned with js-md5 ========
  #md5(msgBytes) {
    const S = new Uint8Array([
        7,12,17,22,  7,12,17,22,  7,12,17,22,  7,12,17,22,
        5, 9,14,20,  5, 9,14,20,  5, 9,14,20,  5, 9,14,20,
        4,11,16,23,  4,11,16,23,  4,11,16,23,  4,11,16,23,
        6,10,15,21,  6,10,15,21,  6,10,15,21,  6,10,15,21
    ]);

    const K = new Uint32Array([
        0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
        0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
        0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
        0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
        0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
        0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
        0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
        0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
        0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
        0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
        0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
        0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
        0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
        0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
        0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
        0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
    ]);

    const rotl = (x, n) => (((x << n) | (x >>> (32 - n))) >>> 0);

    const len = msgBytes.length >>> 0;
    const bitLenLo = (len << 3) >>> 0;
    const bitLenHi = (len >>> 29) >>> 0;

    const with1 = new Uint8Array(len + 1);
    with1.set(msgBytes, 0);
    with1[len] = 0x80;

    let padLen = 56 - (with1.length % 64);
    if (padLen < 0) padLen += 64;

    const padded = new Uint8Array(with1.length + padLen + 8);
    padded.set(with1, 0);
    const L = padded.length - 8;
    padded[L + 0] =  bitLenLo         & 0xff;
    padded[L + 1] = (bitLenLo >>>  8) & 0xff;
    padded[L + 2] = (bitLenLo >>> 16) & 0xff;
    padded[L + 3] = (bitLenLo >>> 24) & 0xff;
    padded[L + 4] =  bitLenHi         & 0xff;
    padded[L + 5] = (bitLenHi >>>  8) & 0xff;
    padded[L + 6] = (bitLenHi >>> 16) & 0xff;
    padded[L + 7] = (bitLenHi >>> 24) & 0xff;

    let a = 0x67452301 >>> 0;
    let b = 0xefcdab89 >>> 0;
    let c = 0x98badcfe >>> 0;
    let d = 0x10325476 >>> 0;

    const M = new Uint32Array(16);

    for (let off = 0; off < padded.length; off += 64) {
      for (let j = 0; j < 16; j++) {
        const i = off + j * 4;
        M[j] = (padded[i] | (padded[i + 1] << 8) | (padded[i + 2] << 16) | (padded[i + 3] << 24)) >>> 0;
      }

      let A = a, B = b, C = c, D = d;

      for (let i = 0; i < 64; i++) {
        let f, g;
        if (i < 16) {                          // F
          f = (B & C) | (~B & D);  g = i;
        } else if (i < 32) {                   // G
          f = (B & D) | (C & ~D);  g = (5 * i + 1) % 16;
        } else if (i < 48) {                   // H
          f = B ^ C ^ D;           g = (3 * i + 5) % 16;
        } else {                               // I
          f = C ^ (B | ~D);        g = (7 * i) % 16;
        }

        f = (f + A + K[i] + M[g]) >>> 0;

        A = D;
        D = C;
        C = B;
        B = (B + rotl(f, S[i])) >>> 0;
      }

      a = (a + A) >>> 0;
      b = (b + B) >>> 0;
      c = (c + C) >>> 0;
      d = (d + D) >>> 0;
    }

    const out = new Uint8Array(16);
    const words = [a, b, c, d];
    for (let i = 0; i < 4; i++) {
      const w = words[i] >>> 0;
      out[i * 4 + 0] =  w         & 0xff;
      out[i * 4 + 1] = (w >>>  8) & 0xff;
      out[i * 4 + 2] = (w >>> 16) & 0xff;
      out[i * 4 + 3] = (w >>> 24) & 0xff;
    }
    return out;
  }

  // ======== MD4 (RFC 1320) — aligned with js-md4 ========
  #md4(msgBytes) {
    const rotl = (x, n) => (((x << n) | (x >>> (32 - n))) >>> 0);
    const F = (x, y, z) => ((x & y) | (~x & z)) >>> 0;
    const G = (x, y, z) => ((x & y) | (x & z) | (y & z)) >>> 0;
    const H = (x, y, z) => (x ^ y ^ z) >>> 0;

    const len = msgBytes.length >>> 0;
    const bitLenLo = (len << 3) >>> 0;
    const bitLenHi = (len >>> 29) >>> 0;

    const with1 = new Uint8Array(len + 1);
    with1.set(msgBytes, 0);
    with1[len] = 0x80;

    let padLen = 56 - (with1.length % 64);
    if (padLen < 0) padLen += 64;

    const padded = new Uint8Array(with1.length + padLen + 8);
    padded.set(with1, 0);

    padded[padded.length - 8] =  bitLenLo         & 0xff;
    padded[padded.length - 7] = (bitLenLo >>> 8)  & 0xff;
    padded[padded.length - 6] = (bitLenLo >>> 16) & 0xff;
    padded[padded.length - 5] = (bitLenLo >>> 24) & 0xff;
    padded[padded.length - 4] =  bitLenHi         & 0xff;
    padded[padded.length - 3] = (bitLenHi >>> 8)  & 0xff;
    padded[padded.length - 2] = (bitLenHi >>> 16) & 0xff;
    padded[padded.length - 1] = (bitLenHi >>> 24) & 0xff;

    let a = 0x67452301 >>> 0;
    let b = 0xefcdab89 >>> 0;
    let c = 0x98badcfe >>> 0;
    let d = 0x10325476 >>> 0;

    const X = new Uint32Array(16);

    for (let off = 0; off < padded.length; off += 64) {
      for (let j = 0; j < 16; j++) {
        const i = off + j * 4;
        X[j] = (padded[i] | (padded[i + 1] << 8) | (padded[i + 2] << 16) | (padded[i + 3] << 24)) >>> 0;
      }

      let A = a, B = b, C = c, D = d;

      // Round 1
      A = rotl((A + F(B, C, D) + X[ 0]) >>> 0, 3);
      D = rotl((D + F(A, B, C) + X[ 1]) >>> 0, 7);
      C = rotl((C + F(D, A, B) + X[ 2]) >>> 0,11);
      B = rotl((B + F(C, D, A) + X[ 3]) >>> 0,19);

      A = rotl((A + F(B, C, D) + X[ 4]) >>> 0, 3);
      D = rotl((D + F(A, B, C) + X[ 5]) >>> 0, 7);
      C = rotl((C + F(D, A, B) + X[ 6]) >>> 0,11);
      B = rotl((B + F(C, D, A) + X[ 7]) >>> 0,19);

      A = rotl((A + F(B, C, D) + X[ 8]) >>> 0, 3);
      D = rotl((D + F(A, B, C) + X[ 9]) >>> 0, 7);
      C = rotl((C + F(D, A, B) + X[10]) >>> 0,11);
      B = rotl((B + F(C, D, A) + X[11]) >>> 0,19);

      A = rotl((A + F(B, C, D) + X[12]) >>> 0, 3);
      D = rotl((D + F(A, B, C) + X[13]) >>> 0, 7);
      C = rotl((C + F(D, A, B) + X[14]) >>> 0,11);
      B = rotl((B + F(C, D, A) + X[15]) >>> 0,19);

      // Round 2 (+0x5a827999)
      A = rotl((A + G(B, C, D) + X[ 0] + 0x5a827999) >>> 0, 3);
      D = rotl((D + G(A, B, C) + X[ 4] + 0x5a827999) >>> 0, 5);
      C = rotl((C + G(D, A, B) + X[ 8] + 0x5a827999) >>> 0, 9);
      B = rotl((B + G(C, D, A) + X[12] + 0x5a827999) >>> 0,13);

      A = rotl((A + G(B, C, D) + X[ 1] + 0x5a827999) >>> 0, 3);
      D = rotl((D + G(A, B, C) + X[ 5] + 0x5a827999) >>> 0, 5);
      C = rotl((C + G(D, A, B) + X[ 9] + 0x5a827999) >>> 0, 9);
      B = rotl((B + G(C, D, A) + X[13] + 0x5a827999) >>> 0,13);

      A = rotl((A + G(B, C, D) + X[ 2] + 0x5a827999) >>> 0, 3);
      D = rotl((D + G(A, B, C) + X[ 6] + 0x5a827999) >>> 0, 5);
      C = rotl((C + G(D, A, B) + X[10] + 0x5a827999) >>> 0, 9);
      B = rotl((B + G(C, D, A) + X[14] + 0x5a827999) >>> 0,13);

      A = rotl((A + G(B, C, D) + X[ 3] + 0x5a827999) >>> 0, 3);
      D = rotl((D + G(A, B, C) + X[ 7] + 0x5a827999) >>> 0, 5);
      C = rotl((C + G(D, A, B) + X[11] + 0x5a827999) >>> 0, 9);
      B = rotl((B + G(C, D, A) + X[15] + 0x5a827999) >>> 0,13);

      // Round 3 (+0x6ed9eba1)
      A = rotl((A + H(B, C, D) + X[ 0] + 0x6ed9eba1) >>> 0, 3);
      D = rotl((D + H(A, B, C) + X[ 8] + 0x6ed9eba1) >>> 0, 9);
      C = rotl((C + H(D, A, B) + X[ 4] + 0x6ed9eba1) >>> 0,11);
      B = rotl((B + H(C, D, A) + X[12] + 0x6ed9eba1) >>> 0, 15);

      A = rotl((A + H(B, C, D) + X[ 2] + 0x6ed9eba1) >>> 0, 3);
      D = rotl((D + H(A, B, C) + X[10] + 0x6ed9eba1) >>> 0, 9);
      C = rotl((C + H(D, A, B) + X[ 6] + 0x6ed9eba1) >>> 0, 11);
      B = rotl((B + H(C, D, A) + X[14] + 0x6ed9eba1) >>> 0, 15);

      A = rotl((A + H(B, C, D) + X[ 1] + 0x6ed9eba1) >>> 0, 3);
      D = rotl((D + H(A, B, C) + X[ 9] + 0x6ed9eba1) >>> 0, 9);
      C = rotl((C + H(D, A, B) + X[ 5] + 0x6ed9eba1) >>> 0, 11);
      B = rotl((B + H(C, D, A) + X[13] + 0x6ed9eba1) >>> 0, 15);

      A = rotl((A + H(B, C, D) + X[ 3] + 0x6ed9eba1) >>> 0, 3);
      D = rotl((D + H(A, B, C) + X[11] + 0x6ed9eba1) >>> 0, 9);
      C = rotl((C + H(D, A, B) + X[ 7] + 0x6ed9eba1) >>> 0, 11);
      B = rotl((B + H(C, D, A) + X[15] + 0x6ed9eba1) >>> 0, 15);

      a = (a + A) >>> 0;
      b = (b + B) >>> 0;
      c = (c + C) >>> 0;
      d = (d + D) >>> 0;
    }

    const out = new Uint8Array(16);
    const words = [a, b, c, d];
    for (let i = 0; i < 4; i++) {
      const w = words[i] >>> 0;
      out[i * 4 + 0] =  w         & 0xff;
      out[i * 4 + 1] = (w >>>  8) & 0xff;
      out[i * 4 + 2] = (w >>> 16) & 0xff;
      out[i * 4 + 3] = (w >>> 24) & 0xff;
    }
    return out;
  }

  // ======== MD2 (RFC 1319) ========
  #md2(msgBytes) {
    const S = Uint8Array.from([
      41,46,67,201,162,216,124,1,61,54,84,161,236,240,6,19,
      98,167,5,243,192,199,115,140,152,147,43,217,188,76,130,202,
      30,155,87,60,253,212,224,22,103,66,111,24,138,23,229,18,
      190,78,196,214,218,158,222,73,160,251,245,142,187,47,238,122,
      169,104,121,145,21,178,7,63,148,194,16,137,11,34,95,33,
      128,127,93,154,90,144,50,39,53,62,204,231,191,247,151,3,
      255,25,48,179,72,165,181,209,215,94,146,42,172,86,170,198,
      79,184,56,210,150,164,125,182,118,252,107,226,156,116,4,241,
      69,157,112,89,100,113,135,32,134,91,207,101,230,45,168,2,
      27,96,37,173,174,176,185,246,28,70,97,105,52,64,126,15,
      85,71,163,35,221,81,175,58,195,92,249,206,186,197,234,38,
      44,83,13,110,133,40,132,9,211,223,205,244,65,129,77,82,
      106,220,55,200,108,193,171,250,36,225,123,8,12,189,177,74,
      120,136,149,139,227,99,232,109,233,203,213,254,59,0,29,57,
      242,239,183,14,102,88,208,228,166,119,114,248,235,117,75,10,
      49,68,80,180,143,237,31,26,219,153,141,51,159,17,131,20
    ]);

    const rem = msgBytes.length % 16;
    const padLen = (16 - rem) || 16;
    const padded = new Uint8Array(msgBytes.length + padLen);
    padded.set(msgBytes, 0);
    padded.fill(padLen, msgBytes.length);

    const C = new Uint8Array(16);
    let L = 0;
    for (let i = 0; i < padded.length; i += 16) {
      for (let j = 0; j < 16; j++) {
        const c = padded[i + j];
        C[j] ^= S[c ^ L];
        L = C[j];
      }
    }

    const M = new Uint8Array(padded.length + 16);
    M.set(padded, 0);
    M.set(C, padded.length);

    const X = new Uint8Array(48);

    for (let i = 0; i < M.length; i += 16) {
      for (let j = 0; j < 16; j++) {
        X[16 + j] = M[i + j];
        X[32 + j] = X[j] ^ X[16 + j];
      }
      let t = 0;
      for (let j = 0; j < 18; j++) {
        for (let k = 0; k < 48; k++) {
          t = X[k] = X[k] ^ S[t];
        }
        t = (t + j) & 0xff;
      }
    }

    return X.slice(0, 16);
  }
}