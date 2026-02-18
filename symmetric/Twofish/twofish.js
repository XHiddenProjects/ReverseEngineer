// twofish-plugin.js
// Requires: CryptoUtils from your ReverseEngineer module (ESM)
// Do NOT extend ReverseEngineer; the engine will instantiate this as a plug-in.

import { CryptoUtils, ReverseEngineer } from "../../ReverseEngineer.js";

export class Twofish extends ReverseEngineer{
  static version = '1.0.0';
  static category = 'Symmetric';
  static TAGS = ['cipher', 'twofish', 'block-cipher', 'cbc', 'ecb'];
  static description = 'Twofish block cipher (ECB/CBC, 128-bit block, zero padding)';

  // Optional: policy for GUI
  // Optional: policy for GUI
  static UI_POLICY = {
    requiresInit: false,
    directions: {
      init: {
        input: false,
        args: true,
        inputPh: '—',
        argsPh: '{"mode":"CBC","inputEncoding":"utf8","outputEncoding":"base64","trimNulls":true}',
        allowFile: false
      },
      forward: {
        input: true,
        args: true,
        inputPh: 'Plain input (utf8/hex/base64/bytes)',
        argsPh: '{"key":"<utf8|hex|base64|bytes>","keyEncoding":"utf8|hex|base64|bytes","mode":"CBC|ECB","iv":"<hex|base64|bytes>(CBC only; optional)","ivEncoding":"hex|base64|bytes","inputEncoding":"utf8|hex|base64|bytes","outputEncoding":"base64|hex|utf8|bytes","returnMeta":true}',
        allowFile: true
      },
      reverse: {
        input: true,
        args: true,
        inputPh: 'Cipher input (base64/hex/bytes)',
        argsPh: '{"key":"<utf8|hex|base64|bytes>","keyEncoding":"utf8|hex|base64|bytes","mode":"CBC|ECB","iv":"<hex|base64|bytes>(CBC only; required)","ivEncoding":"hex|base64|bytes","inputEncoding":"base64|hex|bytes","outputEncoding":"utf8|hex|base64|bytes","trimNulls":true,"returnMeta":true}',
        allowFile: true
      },
    },
  };

  constructor() {
    super();
    this._defaults = {
      mode: 'CBC',
      inputEncoding: 'utf8',
      outputEncoding: 'base64',
      trimNulls: true,
    };
  }

  /**
   * Optional init: set default options (persist until dispose)
   * @param {object} opts
   */
  init(opts = {}) {
    if (opts && typeof opts === 'object') {
      this._defaults = { ...this._defaults, ...opts };
    }
    // Tell GUI to enable file zone for forward/reverse
    return { __ui_policy: Twofish.UI_POLICY, ok: true };
  }

  dispose() {
    // nothing to release
  }

  /* ================================================
   * Engine required API
   * ================================================ */

  /**
   * Encrypt
   * @param {string|Uint8Array|ArrayBuffer|DataView|object} input
   * @param {object|...any} args
   * @returns {string|Uint8Array|object}
   */
  addForwardAlgorithm(input, ...args) {
    const opts = this.#normalizeOptions(args, { forDirection: 'forward' });

    const { keyBytes, ivBytes, mode, inputEncoding, outputEncoding, returnMeta } = opts;

    const inBytes = this.#coerceInputToBytes(input, inputEncoding);
    if (inBytes.length === 0) return outputEncoding === 'bytes' ? new Uint8Array() : '';

    const tf = this.#createTwofishCore(ivBytes);
    const outBytes = (mode === 'ECB')
      ? this.#encryptECB(tf, keyBytes, inBytes)
      : this.#encryptCBC(tf, keyBytes, inBytes);

    const data = this.#formatOutput(outBytes, outputEncoding);
    if (returnMeta) {
      return {
        data,
        meta: {
          mode,
          iv: ivBytes ? this.#toEncoding(ivBytes, 'hex') : null,
          outputEncoding,
        },
      };
    }
    return data;
  }

  /**
   * Decrypt
   * @param {string|Uint8Array|ArrayBuffer|DataView|object} input
   * @param {object|...any} args
   * @returns {string|Uint8Array|object}
   */
  addReverseAlgorithm(input, ...args) {
    const opts = this.#normalizeOptions(args, { forDirection: 'reverse' });

    const { keyBytes, ivBytes, mode, inputEncoding, outputEncoding, trimNulls, returnMeta } = opts;

    const inBytes = this.#coerceInputToBytes(input, inputEncoding);
    if (inBytes.length === 0) return outputEncoding === 'bytes' ? new Uint8Array() : '';

    const tf = this.#createTwofishCore(ivBytes);
    const outBytes = (mode === 'ECB')
      ? this.#decryptECB(tf, keyBytes, inBytes)
      : this.#decryptCBC(tf, keyBytes, inBytes);

    const finalBytes = trimNulls ? this.#rtrimZeros(outBytes) : outBytes;
    const data = this.#formatOutput(finalBytes, outputEncoding);

    if (returnMeta) {
      return {
        data,
        meta: {
          mode,
          iv: ivBytes ? this.#toEncoding(ivBytes, 'hex') : null,
          outputEncoding,
          trimNulls,
        },
      };
    }
    return data;
  }

  /* ================================================
   * Helpers (encodings + args)
   * ================================================ */

  #normalizeOptions(args, { forDirection }) {
    // Support: object, array, or positional (key, mode, iv, inEnc, outEnc)
    let opts = {};
    if (args.length === 1 && args[0] && typeof args[0] === 'object') {
      opts = args[0];
    } else if (args.length > 0) {
      const [key, mode, iv, inputEncoding, outputEncoding] = args;
      opts = { key, mode, iv, inputEncoding, outputEncoding };
    }

    const merged = {
      ...this._defaults,
      ...opts,
    };

    // Directional defaults
    if (forDirection === 'forward') {
      merged.inputEncoding ??= 'utf8';
      merged.outputEncoding ??= 'base64';
    } else {
      merged.inputEncoding ??= 'base64';
      merged.outputEncoding ??= 'utf8';
      merged.trimNulls = (merged.trimNulls !== false);
    }

    const mode = String(merged.mode || 'CBC').toUpperCase();
    if (!['CBC', 'ECB'].includes(mode)) {
      throw new Error(`Twofish: unsupported mode "${merged.mode}". Use "CBC" or "ECB".`);
    }

    // Key required
    if (!merged.key) throw new Error('Twofish: "key" is required.');

    const keyBytes = this.#coerceToBytes(merged.key, merged.keyEncoding || this.#guessKeyEncoding(merged.key));
    if (keyBytes.length === 0) throw new Error('Twofish: key is empty.');

    let ivBytes = null;
    if (mode === 'CBC') {
      if (merged.iv) {
        ivBytes = this.#coerceToBytes(merged.iv, merged.ivEncoding || this.#guessKeyEncoding(merged.iv));
      } else {
        ivBytes = CryptoUtils.randomBytes(16);
      }
      if (ivBytes.length !== 16) {
        throw new Error(`Twofish: IV must be 16 bytes (got ${ivBytes.length}).`);
      }
    }

    const inputEncoding = this.#normalizeEncoding(merged.inputEncoding, forDirection === 'forward' ? 'utf8' : 'base64');
    const outputEncoding = this.#normalizeEncoding(merged.outputEncoding, forDirection === 'forward' ? 'base64' : 'utf8');

    const returnMeta = !!merged.returnMeta;

    return { keyBytes, ivBytes, mode, inputEncoding, outputEncoding, trimNulls: !!merged.trimNulls, returnMeta };
  }

  #normalizeEncoding(enc, fallback) {
    const e = String(enc || fallback).toLowerCase();
    const ok = ['utf8', 'hex', 'base64', 'bytes'];
    if (!ok.includes(e)) return fallback;
    return e;
  }

  #guessKeyEncoding(val) {
    if (val instanceof Uint8Array || val instanceof ArrayBuffer) return 'bytes';
    const s = typeof val === 'string' ? val.trim() : '';
    if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) return 'hex';
    if (/^[A-Za-z0-9+/=]+$/.test(s) && s.length >= 16) return 'base64';
    return 'utf8';
  }

  #coerceToBytes(value, encoding = 'utf8') {
    if (value == null) return new Uint8Array();
    if (value instanceof Uint8Array) return value;
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    if (typeof File !== 'undefined' && value instanceof File) {
      throw new Error('Twofish: File must be pre-read by GUI (bytes/text/dataUrl).');
    }
    if (typeof value === 'object' && value.bytes instanceof Uint8Array) {
      return value.bytes; // from GUI file read (read-mode bytes)
    }
    if (typeof value !== 'string') {
      // Last resort -> JSON to utf8
      const s = JSON.stringify(value);
      return CryptoUtils.utf8ToBytes(s);
    }
    const s = value;
    switch (encoding) {
      case 'utf8': return CryptoUtils.utf8ToBytes(s);
      case 'base64': return CryptoUtils.b64ToBytes(s);
      case 'hex': return this.#hexToBytes(s);
      case 'bytes': {
        // 'bytes' + string => try base64 first, else utf8
        try { return CryptoUtils.b64ToBytes(s); } catch {}
        return CryptoUtils.utf8ToBytes(s);
      }
      default: return CryptoUtils.utf8ToBytes(s);
    }
  }

  #coerceInputToBytes(input, inputEncoding) {
    // The GUI may pass either: string from textarea, or File payload, or typed arrays
    if (input && typeof input === 'object') {
      if (input.bytes instanceof Uint8Array) return input.bytes;   // from file read
      if (input.file instanceof File && input.text) return CryptoUtils.utf8ToBytes(String(input.text));
      if (input.file instanceof File && input.dataUrl) {
        // If needed, strip prefix and base64-decode
        const m = String(input.dataUrl).split(',');
        return CryptoUtils.b64ToBytes(m[m.length - 1] || '');
      }
      if (input instanceof Uint8Array || input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
        return this.#coerceToBytes(input, 'bytes');
      }
    }
    return this.#coerceToBytes(input, inputEncoding);
  }

  #formatOutput(bytes, outputEncoding) {
    switch (outputEncoding) {
      case 'bytes': return bytes;
      case 'hex':   return this.#bytesToHex(bytes);
      case 'base64':return CryptoUtils.bytesToB64(bytes);
      case 'utf8':  return CryptoUtils.bytesToUtf8(bytes);
      default:      return CryptoUtils.bytesToB64(bytes);
    }
  }

  #toEncoding(bytes, encoding = 'hex') {
    const enc = String(encoding || 'hex').toLowerCase();
    switch (enc) {
      case 'hex':    return this.#bytesToHex(bytes);
      case 'base64': return CryptoUtils.bytesToB64(bytes);
      case 'utf8':   return CryptoUtils.bytesToUtf8(bytes);
      case 'bytes':  return bytes;
      default:       return this.#bytesToHex(bytes);
    }
  }

  #bytesToHex(u8) {
    let s = '';
    for (let i = 0; i < u8.length; i++) s += u8[i].toString(16).padStart(2, '0');
    return s;
  }
  #hexToBytes(hex) {
    const clean = hex.replace(/\s+/g, '');
    if (clean.length % 2 !== 0) throw new Error('Invalid hex length');
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return out;
  }

  #padZero(data) {
    const bs = 16;
    const rem = data.length % bs;
    if (rem === 0) return data;
    const out = new Uint8Array(data.length + (bs - rem));
    out.set(data, 0);
    // trailing zeros already present by default
    return out;
  }
  #rtrimZeros(data) {
    let end = data.length;
    while (end > 0 && data[end - 1] === 0) end--;
    if (end === data.length) return data;
    return data.subarray(0, end);
  }

  /* ================================================
   * Twofish core (based on the provided reference)
   * ================================================ */

  #createTwofishCore(ivBytesNullable) {
    // (Same as your version; omitted here for brevity)
    // -- BEGIN CORE --
    const P0 = new Uint8Array([
      0xA9,0x67,0xB3,0xE8,0x04,0xFD,0xA3,0x76,0x9A,0x92,0x80,0x78,0xE4,0xDD,0xD1,0x38,
      0x0D,0xC6,0x35,0x98,0x18,0xF7,0xEC,0x6C,0x43,0x75,0x37,0x26,0xFA,0x13,0x94,0x48,
      0xF2,0xD0,0x8B,0x30,0x84,0x54,0xDF,0x23,0x19,0x5B,0x3D,0x59,0xF3,0xAE,0xA2,0x82,
      0x63,0x01,0x83,0x2E,0xD9,0x51,0x9B,0x7C,0xA6,0xEB,0xA5,0xBE,0x16,0x0C,0xE3,0x61,
      0xC0,0x8C,0x3A,0xF5,0x73,0x2C,0x25,0x0B,0xBB,0x4E,0x89,0x6B,0x53,0x6A,0xB4,0xF1,
      0xE1,0xE6,0xBD,0x45,0xE2,0xF4,0xB6,0x66,0xCC,0x95,0x03,0x56,0xD4,0x1C,0x1E,0xD7,
      0xFB,0xC3,0x8E,0xB5,0xE9,0xCF,0xBF,0xBA,0xEA,0x77,0x39,0xAF,0x33,0xC9,0x62,0x71,
      0x81,0x79,0x09,0xAD,0x24,0xCD,0xF9,0xD8,0xE5,0xC5,0xB9,0x4D,0x44,0x08,0x86,0xE7,
      0xA1,0x1D,0xAA,0xED,0x06,0x70,0xB2,0xD2,0x41,0x7B,0xA0,0x11,0x31,0xC2,0x27,0x90,
      0x20,0xF6,0x60,0xFF,0x96,0x5C,0xB1,0xAB,0x9E,0x9C,0x52,0x1B,0x5F,0x93,0x0A,0xEF,
      0x91,0x85,0x49,0xEE,0x2D,0x4F,0x8F,0x3B,0x47,0x87,0x6D,0x46,0xD6,0x3E,0x69,0x64,
      0x2A,0xCE,0xCB,0x2F,0xFC,0x97,0x05,0x7A,0xAC,0x7F,0xD5,0x1A,0x4B,0x0E,0xA7,0x5A,
      0x28,0x14,0x3F,0x29,0x88,0x3C,0x4C,0x02,0xB8,0xDA,0xB0,0x17,0x55,0x1F,0x8A,0x7D,
      0x57,0xC7,0x8D,0x74,0xB7,0xC4,0x9F,0x72,0x7E,0x15,0x22,0x12,0x58,0x07,0x99,0x34,
      0x6E,0x50,0xDE,0x68,0x65,0xBC,0xDB,0xF8,0xC8,0xA8,0x2B,0x40,0xDC,0xFE,0x32,0xA4,
      0xCA,0x10,0x21,0xF0,0xD3,0x5D,0x0F,0x00,0x6F,0x9D,0x36,0x42,0x4A,0x5E,0xC1,0xE0
    ]);
    const P1 = new Uint8Array([
      0x75,0xF3,0xC6,0xF4,0xDB,0x7B,0xFB,0xC8,0x4A,0xD3,0xE6,0x6B,0x45,0x7D,0xE8,0x4B,
      0xD6,0x32,0xD8,0xFD,0x37,0x71,0xF1,0xE1,0x30,0x0F,0xF8,0x1B,0x87,0xFA,0x06,0x3F,
      0x5E,0xBA,0xAE,0x5B,0x8A,0x00,0xBC,0x9D,0x6D,0xC1,0xB1,0x0E,0x80,0x5D,0xD2,0xD5,
      0xA0,0x84,0x07,0x14,0xB5,0x90,0x2C,0xA3,0xB2,0x73,0x4C,0x54,0x92,0x74,0x36,0x51,
      0x38,0xB0,0xBD,0x5A,0xFC,0x60,0x62,0x96,0x6C,0x42,0xF7,0x10,0x7C,0x28,0x27,0x8C,
      0x13,0x95,0x9C,0xC7,0x24,0x46,0x3B,0x70,0xCA,0xE3,0x85,0xCB,0x11,0xD0,0x93,0xB8,
      0xA6,0x83,0x20,0xFF,0x9F,0x77,0xC3,0xCC,0x03,0x6F,0x08,0xBF,0x40,0xE7,0x2B,0xE2,
      0x79,0x0C,0xAA,0x82,0x41,0x3A,0xEA,0xB9,0xE4,0x9A,0xA4,0x97,0x7E,0xDA,0x7A,0x17,
      0x66,0x94,0xA1,0x1D,0x3D,0xF0,0xDE,0xB3,0x0B,0x72,0xA7,0x1C,0xEF,0xD1,0x53,0x3E,
      0x8F,0x33,0x26,0x5F,0xEC,0x76,0x2A,0x49,0x81,0x88,0xEE,0x21,0xC4,0x1A,0xEB,0xD9,
      0xC5,0x39,0x99,0xCD,0xAD,0x31,0x8B,0x01,0x18,0x23,0xDD,0x1F,0x4E,0x2D,0xF9,0x48,
      0x4F,0xF2,0x65,0x8E,0x78,0x5C,0x58,0x19,0x8D,0xE5,0x98,0x57,0x67,0x7F,0x05,0x64,
      0xAF,0x63,0xB6,0xFE,0xF5,0xB7,0x3C,0xA5,0xCE,0xE9,0x68,0x44,0xE0,0x4D,0x43,0x69,
      0x29,0x2E,0xAC,0x15,0x59,0xA8,0x0A,0x9E,0x6E,0x47,0xDF,0x34,0x35,0x6A,0xCF,0xDC,
      0x22,0xC9,0xC0,0x9B,0x89,0xD4,0xED,0xAB,0x12,0xA2,0x0D,0x52,0xBB,0x02,0x2F,0xA9,
      0xD7,0x61,0x1E,0xB4,0x50,0x04,0xF6,0xC2,0x16,0x25,0x86,0x56,0x55,0x09,0xBE,0x91
    ]);
    const P = [P0, P1];
    const BLOCK_SIZE = 16;
    const ROUNDS = 16;
    const SK_STEP = 0x02020202;
    const SK_BUMP = 0x01010101;
    const SK_ROTL = 9;
    const INPUT_WHITEN = 0;
    const OUTPUT_WHITEN = INPUT_WHITEN + BLOCK_SIZE / 4;
    const ROUND_SUBKEYS = OUTPUT_WHITEN + BLOCK_SIZE / 4;

    const P_00 = 1, P_01 = 0, P_02 = 0, P_03 = P_01 ^ 1, P_04 = 1;
    const P_10 = 0, P_11 = 0, P_12 = 1, P_13 = P_11 ^ 1, P_14 = 0;
    const P_20 = 1, P_21 = 1, P_22 = 0, P_23 = P_21 ^ 1, P_24 = 0;
    const P_30 = 0, P_31 = 1, P_32 = 1, P_33 = P_31 ^ 1, P_34 = 1;
    const GF256_FDBK_2 = Math.floor(0x169 / 2);
    const GF256_FDBK_4 = Math.floor(0x169 / 4);
    const RS_GF_FDBK = 0x14D;

    const b0 = (x) => (x & 0xFF);
    const b1 = (x) => ((x >>> 8) & 0xFF);
    const b2 = (x) => ((x >>> 16) & 0xFF);
    const b3 = (x) => ((x >>> 24) & 0xFF);
    const chooseB = (x, N) => [b0(x), b1(x), b2(x), b3(x)][N % 4];

    const lfsr1 = (x) => (x >>> 1) ^ (((x & 0x01) !== 0) ? GF256_FDBK_2 : 0);
    const lfsr2 = (x) => (x >>> 2)
      ^ (((x & 0x02) !== 0) ? GF256_FDBK_2 : 0)
      ^ (((x & 0x01) !== 0) ? GF256_FDBK_4 : 0);
    const mxX = (x) => (x ^ lfsr2(x));
    const mxY = (x) => (x ^ lfsr1(x) ^ lfsr2(x));

    const MDS = (() => {
      const localMDS = [[], [], [], []];
      const m1 = [], mX = [], mY = [];
      for (let i = 0; i < 256; i++) {
        let j = P[0][i] & 0xFF;
        m1[0] = j; mX[0] = mxX(j) & 0xFF; mY[0] = mxY(j) & 0xFF;
        j = P[1][i] & 0xFF;
        m1[1] = j; mX[1] = mxX(j) & 0xFF; mY[1] = mxY(j) & 0xFF;
        localMDS[0][i] = (m1[P_00] << 0) | (mX[P_00] << 8) | (mY[P_00] << 16) | (mY[P_00] << 24);
        localMDS[1][i] = (mY[P_10] << 0) | (mY[P_10] << 8) | (mX[P_10] << 16) | (m1[P_10] << 24);
        localMDS[2][i] = (mX[P_20] << 0) | (mY[P_20] << 8) | (m1[P_20] << 16) | (mY[P_20] << 24);
        localMDS[3][i] = (mX[P_30] << 0) | (m1[P_30] << 8) | (mY[P_30] << 16) | (mX[P_30] << 24);
      }
      return [
        new Uint32Array(localMDS[0]),
        new Uint32Array(localMDS[1]),
        new Uint32Array(localMDS[2]),
        new Uint32Array(localMDS[3]),
      ];
    })();

    const rsRem = (x) => {
      const b = (x >>> 24) & 0xFF;
      const g2 = ((b << 1) ^ (((b & 0x80) !== 0) ? RS_GF_FDBK : 0)) & 0xFF;
      const g3 = (b >>> 1) ^ (((b & 0x01) !== 0) ? (RS_GF_FDBK >>> 1) : 0) ^ g2;
      return (x << 8) ^ (g3 << 24) ^ (g2 << 16) ^ (g3 << 8) ^ b;
    };
    const rsMDSEncode = (k0, k1) => {
      for (let i = 0; i < 4; i++) k1 = rsRem(k1);
      k1 ^= k0;
      for (let i = 0; i < 4; i++) k1 = rsRem(k1);
      return k1;
    };

    const f32 = (k64Cnt, x, k32) => {
      let lB0 = b0(x), lB1 = b1(x), lB2 = b2(x), lB3 = b3(x);
      const k0 = k32[0] || 0, k1 = k32[1] || 0, k2 = k32[2] || 0, k3 = k32[3] || 0;
      let result = 0;
      switch (k64Cnt & 3) {
        case 1:
          result =
            MDS[0][P[P_01][lB0] & 0xFF ^ b0(k0)] ^
            MDS[1][P[P_11][lB1] & 0xFF ^ b1(k0)] ^
            MDS[2][P[P_21][lB2] & 0xFF ^ b2(k0)] ^
            MDS[3][P[P_31][lB3] & 0xFF ^ b3(k0)];
          break;
        case 0:
          lB0 = P[P_04][lB0] & 0xFF ^ b0(k3);
          lB1 = P[P_14][lB1] & 0xFF ^ b1(k3);
          lB2 = P[P_24][lB2] & 0xFF ^ b2(k3);
          lB3 = P[P_34][lB3] & 0xFF ^ b3(k3);
        case 3:
          lB0 = P[P_03][lB0] & 0xFF ^ b0(k2);
          lB1 = P[P_13][lB1] & 0xFF ^ b1(k2);
          lB2 = P[P_23][lB2] & 0xFF ^ b2(k2);
          lB3 = P[P_33][lB3] & 0xFF ^ b3(k2);
        case 2:
          result =
            MDS[0][P[P_01][P[P_02][lB0] & 0xFF ^ b0(k1)] & 0xFF ^ b0(k0)] ^
            MDS[1][P[P_11][P[P_12][lB1] & 0xFF ^ b1(k1)] & 0xFF ^ b1(k0)] ^
            MDS[2][P[P_21][P[P_22][lB2] & 0xFF ^ b2(k1)] & 0xFF ^ b2(k0)] ^
            MDS[3][P[P_31][P[P_32][lB3] & 0xFF ^ b3(k1)] & 0xFF ^ b3(k0)];
          break;
      }
      return result >>> 0;
    };

    const fe32 = (sBox, x, R) => {
      const t =
        sBox[2 * chooseB(x, R)] ^
        sBox[2 * chooseB(x, R + 1) + 1] ^
        sBox[0x200 + 2 * chooseB(x, R + 2)] ^
        sBox[0x200 + 2 * chooseB(x, R + 3) + 1];
      return new Uint32Array([t])[0];
    };

    const makeKey = (aKeyBytes) => {
      if (!(aKeyBytes instanceof Uint8Array)) {
        aKeyBytes = new Uint8Array(aKeyBytes);
      }
      let aKey = aKeyBytes;
      if (aKey.length < 8 || (aKey.length > 8 && aKey.length < 16) ||
          (aKey.length > 16 && aKey.length < 24) || (aKey.length > 24 && aKey.length < 32)) {
        const need = Math.ceil(aKey.length / 8) * 8;
        const tmp = new Uint8Array(need);
        tmp.set(aKey);
        aKey = tmp;
      } else if (aKey.length > 32) {
        aKey = aKey.subarray(0, 32);
      }
      const keyLength = aKey.length;
      const k64Cnt = keyLength / 8;
      const subkeyCnt = ROUND_SUBKEYS + 2 * ROUNDS;
      const k32e = [], k32o = [], sBoxKey = [];
      let offset = 0;
      for (let i = 0, j = k64Cnt - 1; i < 4 && offset < keyLength; i++, j--) {
        k32e[i] = (aKey[offset++] & 0xFF) | ((aKey[offset++] & 0xFF) << 8) |
                  ((aKey[offset++] & 0xFF) << 16) | ((aKey[offset++] & 0xFF) << 24);
        k32o[i] = (aKey[offset++] & 0xFF) | ((aKey[offset++] & 0xFF) << 8) |
                  ((aKey[offset++] & 0xFF) << 16) | ((aKey[offset++] & 0xFF) << 24);
        sBoxKey[j] = rsMDSEncode(k32e[i], k32o[i]);
      }
      const subKeys = [];
      for (let i = 0, q = 0; i < subkeyCnt / 2; i++, q += SK_STEP) {
        let A = f32(k64Cnt, q, k32e);
        let B = f32(k64Cnt, q + SK_BUMP, k32o);
        B = (B << 8) | (B >>> 24);
        A = (A + B) >>> 0;           subKeys[2 * i] = A;
        A = (A + B) >>> 0;
        subKeys[2 * i + 1] = ((A << SK_ROTL) | (A >>> (32 - SK_ROTL))) >>> 0;
      }
      const sBox = [];
      const k0 = sBoxKey[0] || 0, k1 = sBoxKey[1] || 0, k2 = sBoxKey[2] || 0, k3 = sBoxKey[3] || 0;
      for (let i = 0; i < 256; i++) {
        let lB0 = i, lB1 = i, lB2 = i, lB3 = i;
        switch (k64Cnt & 3) {
          case 1:
            sBox[2 * i] = MDS[0][P[P_01][lB0] & 0xFF ^ b0(k0)];
            sBox[2 * i + 1] = MDS[1][P[P_11][lB1] & 0xFF ^ b1(k0)];
            sBox[0x200 + 2 * i] = MDS[2][P[P_21][lB2] & 0xFF ^ b2(k0)];
            sBox[0x200 + 2 * i + 1] = MDS[3][P[P_31][lB3] & 0xFF ^ b3(k0)];
            break;
          case 0:
            lB0 = P[P_04][lB0] & 0xFF ^ b0(k3);
            lB1 = P[P_14][lB1] & 0xFF ^ b1(k3);
            lB2 = P[P_24][lB2] & 0xFF ^ b2(k3);
            lB3 = P[P_34][lB3] & 0xFF ^ b3(k3);
          case 3:
            lB0 = P[P_03][lB0] & 0xFF ^ b0(k2);
            lB1 = P[P_13][lB1] & 0xFF ^ b1(k2);
            lB2 = P[P_23][lB2] & 0xFF ^ b2(k2);
            lB3 = P[P_33][lB3] & 0xFF ^ b3(k2);
          case 2:
            sBox[2 * i]            = MDS[0][P[P_01][P[P_02][lB0] & 0xFF ^ b0(k1)] & 0xFF ^ b0(k0)];
            sBox[2 * i + 1]        = MDS[1][P[P_11][P[P_12][lB1] & 0xFF ^ b1(k1)] & 0xFF ^ b1(k0)];
            sBox[0x200 + 2 * i]    = MDS[2][P[P_21][P[P_22][lB2] & 0xFF ^ b2(k1)] & 0xFF ^ b2(k0)];
            sBox[0x200 + 2 * i + 1]= MDS[3][P[P_31][P[P_32][lB3] & 0xFF ^ b3(k1)] & 0xFF ^ b3(k0)];
            break;
        }
      }
      return [sBox, subKeys];
    };

    const blockEncrypt = (input, inOffset, sessionKey) => {
      const sBox = sessionKey[0], sKey = sessionKey[1];
      const dv = new Uint8Array(input);
      let idx = inOffset;
      let x0 = dv[idx++] & 0xFF | (dv[idx++] & 0xFF) << 8 | (dv[idx++] & 0xFF) << 16 | (dv[idx++] & 0xFF) << 24;
      let x1 = dv[idx++] & 0xFF | (dv[idx++] & 0xFF) << 8 | (dv[idx++] & 0xFF) << 16 | (dv[idx++] & 0xFF) << 24;
      let x2 = dv[idx++] & 0xFF | (dv[idx++] & 0xFF) << 8 | (dv[idx++] & 0xFF) << 16 | (dv[idx++] & 0xFF) << 24;
      let x3 = dv[idx++] & 0xFF | (dv[idx++] & 0xFF) << 8 | (dv[idx++] & 0xFF) << 16 | (dv[idx++] & 0xFF) << 24;
      let t0, t1, k = ROUND_SUBKEYS;

      x0 ^= sKey[INPUT_WHITEN]; x1 ^= sKey[INPUT_WHITEN + 1];
      x2 ^= sKey[INPUT_WHITEN + 2]; x3 ^= sKey[INPUT_WHITEN + 3];

      for (let R = 0; R < ROUNDS; R += 2) {
        t0 = fe32(sBox, x0, 0); t1 = fe32(sBox, x1, 3);
        x2 ^= (t0 + t1 + sKey[k++]) >>> 0;
        x2 = (x2 >>> 1) | (x2 << 31);
        x3 = (x3 << 1) | (x3 >>> 31);
        x3 ^= (t0 + 2 * t1 + sKey[k++]) >>> 0;

        t0 = fe32(sBox, x2, 0); t1 = fe32(sBox, x3, 3);
        x0 ^= (t0 + t1 + sKey[k++]) >>> 0;
        x0 = (x0 >>> 1) | (x0 << 31);
        x1 = (x1 << 1) | (x1 >>> 31);
        x1 ^= (t0 + 2 * t1 + sKey[k++]) >>> 0;
      }

      x2 ^= sKey[OUTPUT_WHITEN]; x3 ^= sKey[OUTPUT_WHITEN + 1];
      x0 ^= sKey[OUTPUT_WHITEN + 2]; x1 ^= sKey[OUTPUT_WHITEN + 3];

      return new Uint8Array([
        x2 & 0xFF, (x2 >>> 8) & 0xFF, (x2 >>> 16) & 0xFF, (x2 >>> 24) & 0xFF,
        x3 & 0xFF, (x3 >>> 8) & 0xFF, (x3 >>> 16) & 0xFF, (x3 >>> 24) & 0xFF,
        x0 & 0xFF, (x0 >>> 8) & 0xFF, (x0 >>> 16) & 0xFF, (x0 >>> 24) & 0xFF,
        x1 & 0xFF, (x1 >>> 8) & 0xFF, (x1 >>> 16) & 0xFF, (x1 >>> 24) & 0xFF,
      ]);
    };

    const blockDecrypt = (input, inOffset, sessionKey) => {
      const sBox = sessionKey[0], sKey = sessionKey[1];
      const dv = new Uint8Array(input);
      let idx = inOffset;
      let x2 = dv[idx++] & 0xFF | (dv[idx++] & 0xFF) << 8 | (dv[idx++] & 0xFF) << 16 | (dv[idx++] & 0xFF) << 24;
      let x3 = dv[idx++] & 0xFF | (dv[idx++] & 0xFF) << 8 | (dv[idx++] & 0xFF) << 16 | (dv[idx++] & 0xFF) << 24;
      let x0 = dv[idx++] & 0xFF | (dv[idx++] & 0xFF) << 8 | (dv[idx++] & 0xFF) << 16 | (dv[idx++] & 0xFF) << 24;
      let x1 = dv[idx++] & 0xFF | (dv[idx++] & 0xFF) << 8 | (dv[idx++] & 0xFF) << 16 | (dv[idx++] & 0xFF) << 24;

      let k = ROUND_SUBKEYS + 2 * ROUNDS - 1, t0, t1;

      x2 ^= sKey[OUTPUT_WHITEN]; x3 ^= sKey[OUTPUT_WHITEN + 1];
      x0 ^= sKey[OUTPUT_WHITEN + 2]; x1 ^= sKey[OUTPUT_WHITEN + 3];

      for (let R = 0; R < ROUNDS; R += 2) {
        t0 = fe32(sBox, x2, 0); t1 = fe32(sBox, x3, 3);
        x1 ^= (t0 + 2 * t1 + sKey[k--]) >>> 0;
        x1 = (x1 >>> 1) | (x1 << 31);
        x0 = (x0 << 1) | (x0 >>> 31);
        x0 ^= (t0 + t1 + sKey[k--]) >>> 0;

        t0 = fe32(sBox, x0, 0); t1 = fe32(sBox, x1, 3);
        x3 ^= (t0 + 2 * t1 + sKey[k--]) >>> 0;
        x3 = (x3 >>> 1) | (x3 << 31);
        x2 = (x2 << 1) | (x2 >>> 31);
        x2 ^= (t0 + t1 + sKey[k--]) >>> 0;
      }

      x0 ^= sKey[INPUT_WHITEN]; x1 ^= sKey[INPUT_WHITEN + 1];
      x2 ^= sKey[INPUT_WHITEN + 2]; x3 ^= sKey[INPUT_WHITEN + 3];

      return new Uint8Array([
        x0 & 0xFF, (x0 >>> 8) & 0xFF, (x0 >>> 16) & 0xFF, (x0 >>> 24) & 0xFF,
        x1 & 0xFF, (x1 >>> 8) & 0xFF, (x1 >>> 16) & 0xFF, (x1 >>> 24) & 0xFF,
        x2 & 0xFF, (x2 >>> 8) & 0xFF, (x2 >>> 16) & 0xFF, (x2 >>> 24) & 0xFF,
        x3 & 0xFF, (x3 >>> 8) & 0xFF, (x3 >>> 16) & 0xFF, (x3 >>> 24) & 0xFF,
      ]);
    };

    const xorBuffers = (a, b) => {
      if (a.length !== b.length) throw new Error('Twofish CBC: xor buffers length mismatch');
      const out = new Uint8Array(a.length);
      for (let i = 0; i < a.length; i++) out[i] = (a[i] ^ b[i]) & 0xFF;
      return out;
    };

    const encrypt = (key, plainBytes) => {
      const sk = makeKey(key);
      const out = new Uint8Array(plainBytes.length);
      for (let off = 0; off < plainBytes.length; off += 16) {
        const blk = blockEncrypt(plainBytes, off, sk);
        out.set(blk, off);
      }
      return out;
    };
    const decrypt = (key, cipherBytes) => {
      const sk = makeKey(key);
      const out = new Uint8Array(cipherBytes.length);
      for (let off = 0; off < cipherBytes.length; off += 16) {
        const blk = blockDecrypt(cipherBytes, off, sk);
        out.set(blk, off);
      }
      return out;
    };

    const encryptCBC = (key, plainBytes, iv) => {
      const sk = makeKey(key);
      const out = new Uint8Array(plainBytes.length);
      let vector = iv;
      for (let pos = 0; pos < plainBytes.length; pos += 16) {
        const cBuffer = plainBytes.subarray(pos, pos + 16);
        const xored = xorBuffers(cBuffer, vector);
        const enc = blockEncrypt(xored, 0, sk);
        out.set(enc, pos);
        vector = enc;
      }
      return out;
    };
    const decryptCBC = (key, cipherBytes, iv) => {
      const sk = makeKey(key);
      const out = new Uint8Array(cipherBytes.length);
      let vector = iv;
      for (let pos = 0; pos < cipherBytes.length; pos += 16) {
        const cBuffer = cipherBytes.subarray(pos, pos + 16);
        const dec = blockDecrypt(cBuffer, 0, sk);
        const plain = xorBuffers(dec, vector);
        out.set(plain, pos);
        vector = cBuffer;
      }
      return out;
    };

    return {
      BLOCK_SIZE,
      encrypt,
      decrypt,
      encryptCBC,
      decryptCBC,
      iv: ivBytesNullable || null,
    };
    // -- END CORE --
  }

  #encryptECB(tf, keyBytes, inputBytes) {
    const padded = this.#padZero(inputBytes);
    return tf.encrypt(keyBytes, padded);
  }
  #decryptECB(tf, keyBytes, inputBytes) {
    if (inputBytes.length % 16 !== 0) throw new Error('Twofish ECB: ciphertext length must be multiple of 16 bytes');
    return tf.decrypt(keyBytes, inputBytes);
  }
  #encryptCBC(tf, keyBytes, inputBytes) {
    if (!tf.iv) throw new Error('Twofish CBC: missing IV');
    const padded = this.#padZero(inputBytes);
    return tf.encryptCBC(keyBytes, padded, tf.iv);
  }
  #decryptCBC(tf, keyBytes, inputBytes) {
    if (!tf.iv) throw new Error('Twofish CBC: missing IV for decryption');
    if (inputBytes.length % 16 !== 0) throw new Error('Twofish CBC: ciphertext must be multiple of 16 bytes');
    return tf.decryptCBC(keyBytes, inputBytes, tf.iv);
  }
}