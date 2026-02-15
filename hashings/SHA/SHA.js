import { ReverseEngineer } from "../../ReverseEngineer.js";

export class SHA extends ReverseEngineer{
  /** Public metadata for the engine list */
  static name = 'Secure Hash Algorithms';
  static version = '1.2.0';
  static description = 'SHA hashing via Web Crypto (SHA-1, SHA-256, SHA-384, SHA-512)';
  static category = 'Hashing';
  static TAGS = ['SHA', 'hash', 'crypto', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

  /**
   * Accessible UI policy for ReverseEngineerGUI.
   * - `init`: args to set defaults, input disabled.
   * - `forward`: input required; args optional: ["SHA-256","hex"] | ["SHA-512","base64"] | ["SHA-384","bytes"]
   * - `reverse`: input = expected digest (hex/base64); args disabled; allow file upload.
   */
  static UI_POLICY = {
    requiresInit: false,
    directions: {
      init:    { input: false, args: true,  inputPh: '—', argsPh: 'Defaults: ["SHA-256","hex"]', allowFile:false },
      forward: { input: true,  args: true,  inputPh: 'Text to hash', argsPh: '["SHA-256","hex"|"base64"|"bytes"] (optional)', allowFile:false },
      reverse: { input: true,  args: false, inputPh: 'Expected digest (hex/base64)', argsPh: '—', allowFile:true }
    },
  };

  constructor() {
    super();
    this._defaultAlgo = 'SHA-256';
    this._defaultEncoding = 'hex';
  }

  getUIPolicy() { return SHA.UI_POLICY; }

  /**
   * Optional init — set defaults used when forward() args are omitted.
   */
  init(algo = 'SHA-256', encoding = 'hex') {
    const a = this.#normalizeAlgo(algo);
    const e = this.#normalizeEncoding(encoding);
    this._defaultAlgo = a;
    this._defaultEncoding = e;
    return { ok: true, defaults: { algo: a, encoding: e } };
  }

    /**
     * Forward — compute a digest of text/bytes.
     * Robust arg handling:
     *  - addForwardAlgorithm(input, "SHA-256", "hex")
     *  - addForwardAlgorithm(input, { algo:"SHA-256", encoding:"hex" })
     *  - addForwardAlgorithm(input, "base64")   // treated as encoding, algo = default
     */
    async addForwardAlgorithm(input, algo, encoding) {
    // Normalize flexible args coming from the GUI
    let a = algo;
    let e = encoding;

    // If the first arg is an options object, pull fields out
    if (a && typeof a === 'object') {
        const obj = a;
        a = obj.algo ?? obj.algorithm ?? obj.name ?? this._defaultAlgo;
        e = obj.encoding ?? obj.output ?? e ?? this._defaultEncoding;
    }

    // If the second arg is an options object, pull encoding out
    if (e && typeof e === 'object') {
        const obj = e;
        e = obj.encoding ?? obj.output ?? this._defaultEncoding;
    }

    // If only one string arg is provided and it matches a known encoding, treat it as encoding
    const encSet = new Set(['hex', 'base64', 'bytes']);
    if (typeof a === 'string' && encSet.has(a.toLowerCase()) && (e === undefined || e === null)) {
        e = a;            // a was actually the encoding
        a = undefined;    // algo falls back to default
    }

    // Fall back to defaults if anything is missing or nullish
    const algoName = this.#normalizeAlgo(a ?? this._defaultAlgo);
    const outEnc   = this.#normalizeEncoding(e ?? this._defaultEncoding);

    // Proceed with hashing
    const data = this.#toBytes(input);
    const buf  = await this.#digest(algoName, data);

    if (outEnc === 'bytes')  return new Uint8Array(buf);
    if (outEnc === 'base64') return this.#bytesToBase64(new Uint8Array(buf));
    return this.#bytesToHex(new Uint8Array(buf)); // default hex
    }

    // Add inside the SHA class (keep this if already added previously)
    #inferAlgoFromHash(expected, enc) {
        const s = String(expected ?? '').trim();
    if (!s) return null;

    if (enc === 'hex') {
        const len = s.length;
        if (len === 40)  return 'SHA-1';
        if (len === 64)  return 'SHA-256';
        if (len === 96)  return 'SHA-384';
        if (len === 128) return 'SHA-512';
        return null;
    }

    if (enc === 'base64') {
        const len = s.length; // 20B→28, 32B→44, 48B→64, 64B→88 (incl. padding)
        if (len === 28) return 'SHA-1';
        if (len === 44) return 'SHA-256';
        if (len === 64) return 'SHA-384';
        if (len === 88) return 'SHA-512';
        return null;
    }

    return null;
    }

    // NEW: Try to find and verify the plaintext that pairs with the digest in a text line
    async #findPlaintextPairedWithDigest(rawText, expected, algoName, enc) {
    const lines = String(rawText ?? '').split(/\r?\n/);
    const esc = expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const expRe = new RegExp(esc, enc === 'hex' ? 'i' : ''); // hex is case-insensitive

    for (const line of lines) {
        if (!expRe.test(line)) continue;

        // Prioritize immediate neighbors around the digest
        const startIdx = line.search(expRe);
        const before = line.slice(0, startIdx).trimEnd();
        const after  = line.slice(startIdx + expected.length).trimStart();

        const leftNeighbor  = (before.match(/[^ \t\r\n,;:"'(){}\[\]<>]+$/) || [null])[0];
        const rightNeighbor = (after.match(/^[^ \t\r\n,;:"'(){}\[\]<>]+/) || [null])[0];

        // Collect candidates on the line (excluding the digest itself)
        const tokens = line.match(/[^ \t\r\n,;:"'(){}\[\]<>]+/g) || [];
        const candidates = [];
        if (leftNeighbor)  candidates.push(leftNeighbor);
        if (rightNeighbor) candidates.push(rightNeighbor);
        for (const t of tokens) if (t && t !== expected && !candidates.includes(t)) candidates.push(t);

        // Verify each candidate by hashing it with the inferred algorithm
        for (const cand of candidates) {
        const buf = await this.#digest(algoName, this.#toBytes(cand));
        const cmp = (enc === 'base64')
            ? this.#bytesToBase64(new Uint8Array(buf))
            : this.#bytesToHex(new Uint8Array(buf));
        if (this.#compareDigests(expected, cmp, enc)) {
            return cand; // ← return the plaintext
        }
        }
    }
    return null;
    }

    // REPLACE your addReverseAlgorithm with this version
    async addReverseAlgorithm(expectedHash, ...args) {
    const expected = String(expectedHash ?? '').trim();
    if (!expected) {
        return { ok: false, message: 'No expected digest provided.' };
    }

    // Resolve source (capture rawText if text file)
    const { bytes: sourceBytes, meta, rawText } = await this.#resolveSourceFromArgs(args);
    if (!sourceBytes) {
        return { ok: false, message: 'No file or byte source provided to verify against.' };
    }

    // Detect encoding and infer best algorithm from digest length
    const expectedEncoding = this.#detectHashEncoding(expected); // 'hex' | 'base64'
    const inferredAlgo = this.#inferAlgoFromHash(expected, expectedEncoding);
    const algoName = inferredAlgo ?? this._defaultAlgo;

    // If it's a text file, try to find the paired plaintext on the same line as the digest
    if (meta?.mode === 'text' && typeof rawText === 'string' && rawText.length) {
        const paired = await this.#findPlaintextPairedWithDigest(rawText, expected, algoName, expectedEncoding);
        if (paired !== null) {
        return { ok: true, message: paired }; // ← return the plaintext (e.g., "Hello")
        }
        // If not found, continue to generic verification below.
    }

    // Generic verification: hash the whole content and compare
    const digestBuf = await this.#digest(algoName, sourceBytes);
    const computed = (expectedEncoding === 'base64')
        ? this.#bytesToBase64(new Uint8Array(digestBuf))
        : this.#bytesToHex(new Uint8Array(digestBuf));

    if (this.#compareDigests(expected, computed, expectedEncoding)) {
        // For non-text/binary or when no paired plaintext was found, return a succinct note
        return { ok: true, message: `[binary/text content matched ${algoName}]` };
    }

    return { ok: false, message: 'Hash does not match the provided content.' };
    }

  /* ========================= Internals ========================= */

  #normalizeAlgo(algo) {
    if (!algo) return 'SHA-256';
    const s = String(algo).replace(/[\s_]/g, '').toUpperCase();
    switch (s) {
      case 'SHA1':   return 'SHA-1';
      case 'SHA256': return 'SHA-256';
      case 'SHA384':
      case 'SHA385': return 'SHA-384'; // lenient/alias
      case 'SHA512': return 'SHA-512';
      case 'SHA-1':
      case 'SHA-256':
      case 'SHA-384':
      case 'SHA-512':
        return s;
      default:
        throw new Error(`Unsupported algorithm "${algo}". Use SHA-1, SHA-256, SHA-384, or SHA-512.`);
    }
  }

  #normalizeEncoding(enc) {
    const e = String(enc || 'hex').toLowerCase();
    if (e === 'hex' || e === 'base64' || e === 'bytes') return e;
    throw new Error(`Unsupported encoding "${enc}". Use "hex", "base64", or "bytes".`);
  }

  #toBytes(input) {
    if (input instanceof Uint8Array) return input;
    if (input instanceof ArrayBuffer) return new Uint8Array(input);
    return new TextEncoder().encode(String(input ?? ''));
  }

  async #digest(algoName, dataBytes) {
    const subtle = globalThis?.crypto?.subtle;
    if (subtle && typeof subtle.digest === 'function') {
      return await subtle.digest(algoName, dataBytes);
    }
    // Node fallback
    try {
      // eslint-disable-next-line global-require
      const nodeCrypto = require?.('crypto');
      if (nodeCrypto?.createHash) {
        const normalized = algoName.replace('-', '').toLowerCase(); // sha256, sha384...
        const h = nodeCrypto.createHash(normalized);
        // eslint-disable-next-line no-undef
        h.update(Buffer.from(dataBytes));
        const out = h.digest(); // Buffer
        return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
      }
    } catch {}
    throw new Error('No cryptographic digest API available. A modern browser or Node.js is required.');
  }

  #bytesToHex(bytes) {
    const lut = [];
    for (let i = 0; i < 256; i++) lut[i] = (i + 256).toString(16).slice(1);
    let out = '';
    for (let i = 0; i < bytes.length; i++) out += lut[bytes[i]];
    return out;
  }

  #bytesToBase64(bytes) {
    if (typeof btoa === 'function') {
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return btoa(bin);
    }
    // Node fallback
    try {
      // eslint-disable-next-line no-undef
      return Buffer.from(bytes).toString('base64');
    } catch {
      throw new Error('Base64 encoding not available in this environment.');
    }
  }

  #detectHashEncoding(s) {
    const str = String(s || '');
    const isHex = /^[0-9a-fA-F]+$/.test(str) && (str.length % 2 === 0);
    if (isHex) return 'hex';
    const isB64 = /^[A-Za-z0-9+/]+={0,2}$/.test(str) && str.length > 0;
    if (isB64) return 'base64';
    // default to hex (most CLI outputs are hex)
    return 'hex';
  }

  #compareDigests(expected, computed, enc) {
    if (enc === 'hex') return String(expected).toLowerCase() === String(computed).toLowerCase();
    return String(expected) === String(computed);
  }

  async #resolveSourceFromArgs(args) {
    let blobOrFile = null;
    let bytes = null;

    // 1) Search args for bytes/blob/file descriptors
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

    // 2) Fall back to default GUI input (#re-file)
    if (!blobOrFile && !bytes) {
      const f = this.#resolveFileFromInput('#re-file');
      if (f) blobOrFile = f;
    }

    // 3) Read with mode detection (also return raw text if mode='text')
    if (blobOrFile) {
      const mime = blobOrFile.type || '';
      const name = blobOrFile.name || '';
      const mode = this.#decideReadModeByType(mime, name);
      if (mode === 'text' && typeof blobOrFile.text === 'function') {
        const txt = await blobOrFile.text();
        return {
          bytes: new TextEncoder().encode(txt),
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

  /**
   * Decide text vs binary read based on MIME/extension.
   * Returns 'text' | 'binary'.
   */
  #decideReadModeByType(mime, name) {
    const m = String(mime || '').toLowerCase();
    const ext = (String(name || '').toLowerCase().match(/\.(\w+)$/)?.[1]) || '';

    // MIME switch
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

    // Extension fallback (plain text-ish)
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
}