import { ReverseEngineer, CryptoUtils } from "../../ReverseEngineer.js";
import cryptoJs from "https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/+esm";

/**
 * AES (Web Crypto API + ESM CryptoJS fallback for ECB / CBC NoPadding)
 * Modes: ECB, CBC, CTR, GCM
 * Padding: PKCS5Padding (PKCS7) | None
 * Key sizes: 128, 192, 256 bits
 * Key formats: plain (UTF-8), base64, hex
 * IV: CBC/CTR/GCM require IV (auto-generated if omitted); ECB does not use IV
 * Output:
 *   - encrypt → base64 | hex   (pack: iv || ciphertext [+ tag for GCM])
 *   - decrypt → plain | base64
 */
export const AES = class extends ReverseEngineer {
  static name = "AES";
  static version = "2.2.1";
  static description =
    "AES using Web Crypto API with ESM CryptoJS.";
  static UI_POLICY = {
    requiresInit:true,
      directions:{
        init:{ input:false, args:true, inputPh:'—', argsPh:`AES init options (JSON). Example:\n{\n "secret": "<base64 key>",\n "secret_key_format": "base64",\n "mode": "GCM",\n "encrypt_output": "base64",\n "decrypt_output": "plain"\n}` },
        forward:{ input:true, args:true, inputPh:'Plaintext to encrypt', argsPh:'Optional AAD (string) for GCM, e.g. "header"' },
        reverse:{ input:true, args:true, inputPh:'Packed ciphertext (base64/hex: iv|ct[|tag])', argsPh:'Optional AAD (string) used during encrypt' }
      }
  }
  static category = "Symmetric";
  static tags = ["AES", "GCM", "CBC", "CTR", "ECB", "WebCrypto", "CryptoJS"];
  constructor() {
    super();
    this.getInstance();
  }

  /** @type {CryptoKey|null} */
  #key = null;

  // Keep raw key for CryptoJS fallback usages
  /** @type {Uint8Array|null} */
  #rawKeyBytes = null;

  // Configuration
  #mode = "GCM"; // 'GCM' | 'CBC' | 'CTR' | 'ECB'
  #padding = "PKCS5Padding"; // 'PKCS5Padding' | 'None'
  #keyBits = 256; // 128|192|256
  #secretKeyFormat = "base64"; // 'plain'|'base64'|'hex'
  #encryptOutput = "base64"; // 'base64'|'hex'
  #decryptOutput = "plain"; // 'plain'|'base64'
  #iv = null; // Uint8Array|null
  #ctrLength = 64; // bits used by counter in AES-CTR
  #gcmTagLength = 128; // bits

  // ---------- Utility helpers ----------
  #utf8ToBytes(str) {
    if (CryptoUtils?.utf8ToBytes) return CryptoUtils.utf8ToBytes(str);
    return new TextEncoder().encode(str);
  }
  #bytesToUtf8(bytes) {
    if (CryptoUtils?.bytesToUtf8) return CryptoUtils.bytesToUtf8(bytes);
    return new TextDecoder().decode(bytes);
  }
  #b64ToBytes(b64) {
    if (CryptoUtils?.b64ToBytes) return CryptoUtils.b64ToBytes(b64);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  #bytesToB64(bytes) {
    if (CryptoUtils?.bytesToB64) return CryptoUtils.bytesToB64(bytes);
    let s = "";
    bytes.forEach((b) => (s += String.fromCharCode(b)));
    return btoa(s);
  }
  #hexToBytes(hex) {
    const clean = hex.replace(/^0x/i, "").replace(/\s+/g, "");
    if (clean.length % 2 !== 0) throw new Error("Invalid hex length");
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
    return out;
  }
  #bytesToHex(bytes) {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  #randomBytes(n) {
    if (CryptoUtils?.randomBytes) return CryptoUtils.randomBytes(n);
    const arr = new Uint8Array(n);
    // Browser Web Crypto
    (globalThis.crypto || window.crypto).getRandomValues(arr);
    return arr;
  }

  #parseKey(secret, format) {
    switch (format) {
      case "base64":
        return this.#b64ToBytes(secret);
      case "hex":
        return this.#hexToBytes(secret);
      case "plain":
        return this.#utf8ToBytes(secret);
      default:
        throw new Error("secret_key_format must be 'plain', 'base64', or 'hex'");
    }
  }

  #normalizeKeyLength(keyBytes, keyBits) {
    const needed = keyBits / 8;
    const okLens = [16, 24, 32];
    if (okLens.includes(keyBytes.length) && keyBytes.length === needed) return keyBytes;
    throw new Error(
      `Key material must be exactly ${needed} bytes for AES-${keyBits}. ` +
        `Provide correct length secret in chosen format (plain/base64/hex).`
    );
  }

  #parseIV(iv, format) {
    if (iv == null) return null;
    if (typeof iv !== "string") throw new Error("iv must be a string in the selected format");
    switch (format) {
      case "base64":
        return this.#b64ToBytes(iv);
      case "hex":
        return this.#hexToBytes(iv);
      case "plain":
        return this.#utf8ToBytes(iv);
      default:
        throw new Error("iv_format must be 'plain', 'base64', or 'hex'");
    }
  }

  async #importKeyFor(mode, rawKey) {
    const subtle = (globalThis.crypto || window.crypto)?.subtle;
    if (!subtle) {
      throw new Error("Web Crypto API is not available (secure context required).");
    }
    let algoName = null;
    if (mode === "GCM") algoName = "AES-GCM";
    else if (mode === "CBC") algoName = "AES-CBC";
    else if (mode === "CTR") algoName = "AES-CTR";
    else return null; // ECB not supported by Web Crypto
    return subtle.importKey("raw", rawKey, { name: algoName }, false, ["encrypt", "decrypt"]);
  }

  #getCryptoJS() {
    // Use ESM import primarily; fallback to global if present
    return cryptoJs || (typeof window !== "undefined" ? window.CryptoJS : null) || null;
  }

  // ---------- Public API ----------

  /**
   * init(options)
   * Backward compatible with init({ keyB64 }).
   *
   * @param {Object} options
   * @param {string} [options.secret]                         Key material in chosen format
   * @param {'plain'|'base64'|'hex'} [options.secret_key_format='base64']
   * @param {'ECB'|'CBC'|'CTR'|'GCM'} [options.mode='GCM']
   * @param {'PKCS5Padding'|'None'} [options.padding='PKCS5Padding']  (CBC/ECB only)
   * @param {128|192|256} [options.keyBits=256]
   * @param {string} [options.iv]                             IV/counter in chosen format (CBC/CTR/GCM)
   * @param {'plain'|'base64'|'hex'} [options.iv_format='base64']
   * @param {'base64'|'hex'} [options.encrypt_output='base64']
   * @param {'plain'|'base64'} [options.decrypt_output='plain']
   * @param {number} [options.ctr_length=64]                  AES-CTR counter length (bits)
   * @param {number} [options.gcm_tag_length=128]             GCM tag length (bits)
   */
  async init(options) {
    // Backward compatibility with { keyB64 }
    if (options?.secret) {
      options = {
        ...options,
        secret: options.secret,
        secret_key_format: "base64",
        mode: "GCM",
        padding: "PKCS5Padding",
        keyBits: 256,
      };
    }

    const {
      secret,
      secret_key_format = "base64",
      mode = "GCM",
      padding = "PKCS5Padding",
      keyBits = 256,
      iv,
      iv_format = "base64",
      encrypt_output = "base64",
      decrypt_output = "plain",
      ctr_length = 64,
      gcm_tag_length = 128,
    } = options || {};

    if (!secret) throw new Error("init requires a 'secret'.");
    
    this.#mode = mode.toUpperCase();
    this.#padding = padding;
    this.#keyBits = keyBits;
    this.#secretKeyFormat = secret_key_format;
    this.#encryptOutput = encrypt_output;
    this.#decryptOutput = decrypt_output;
    this.#ctrLength = ctr_length;
    this.#gcmTagLength = gcm_tag_length;

    const rawKey = this.#normalizeKeyLength(
      this.#parseKey(secret, this.#secretKeyFormat),
      this.#keyBits
    );
    this.#rawKeyBytes = rawKey;

    // IV defaulting and enforcement by mode (fixed lengths for packing)
    let ivBytes = this.#parseIV(iv ?? null, iv_format);
    if (this.#mode === "GCM") {
      if (!ivBytes) ivBytes = this.#randomBytes(12);
      if (ivBytes.length !== 12)
        throw new Error("AES-GCM IV must be 12 bytes in this implementation.");
    } else if (this.#mode === "CBC") {
      if (!ivBytes) ivBytes = this.#randomBytes(16);
      if (ivBytes.length !== 16) throw new Error("AES-CBC IV must be 16 bytes.");
    } else if (this.#mode === "CTR") {
      if (!ivBytes) ivBytes = this.#randomBytes(16);
      if (ivBytes.length !== 16) throw new Error("AES-CTR counter must be 16 bytes.");
    } else if (this.#mode === "ECB") {
      ivBytes = null; // not used
    } else {
      throw new Error(`Unsupported mode: ${this.#mode}`);
    }
    this.#iv = ivBytes;


    // Import key for Web Crypto where applicable
    this.#key = await this.#importKeyFor(this.#mode, rawKey);

    // Mode/padding compatibility checks
    if (this.#mode === "GCM" || this.#mode === "CTR") {
      // No padding used; ignore requested padding
      if (this.#padding !== "PKCS5Padding" && this.#padding !== "None") {
        throw new Error(`Padding not applicable for ${this.#mode}`);
      }
    } else if (this.#mode === "CBC") {
      if (this.#padding === "None" && !this.#getCryptoJS()) {
        console.warn(
          "CBC NoPadding requested but CryptoJS (ESM) is not available; include the ESM import."
        );
      }
    } else if (this.#mode === "ECB") {
      if (!this.#getCryptoJS()) {
        console.warn("ECB mode requires CryptoJS (ESM) fallback; include the ESM import.");
      }
    }

    return this;
  }

  // ---------- Encryption ----------

  /**
   * addForwardAlgorithm(plaintext, aad="")
   * Packs and returns an encoded string:
   *   - GCM:  iv(12)  || ciphertext+tag
   *   - CTR:  counter(16) || ciphertext
   *   - CBC:  iv(16)  || ciphertext
   *   - ECB:  ciphertext
   * Encoded as base64 or hex per this.#encryptOutput
   */
  async addForwardAlgorithm(plaintext, aad = "") {
    if (!this.#mode) throw new Error("Call init(...) first");

    const subtle = (globalThis.crypto || window.crypto)?.subtle;
    if (!subtle) throw new Error("Web Crypto API not available (secure context required).");

    const data = this.#utf8ToBytes(plaintext);

    if (this.#mode === "GCM") {
      if (!this.#key) throw new Error("GCM key not initialized");
      const iv = this.#iv || this.#randomBytes(12);
      const ad = this.#utf8ToBytes(aad);
      const params = { name: "AES-GCM", iv, tagLength: this.#gcmTagLength, ...(ad ? { additionalData: ad } : {}) };

      const ctBuf = await subtle.encrypt(params, this.#key, data);
      const ct = new Uint8Array(ctBuf);
      const packed = new Uint8Array(iv.length + ct.length);
      packed.set(iv, 0);
      packed.set(ct, iv.length);
      return this.#encodeOut(packed);
    }

    if (this.#mode === "CTR") {
      if (!this.#key) throw new Error("CTR key not initialized");
      const counter = this.#iv || this.#randomBytes(16);
      const params = { name: "AES-CTR", counter, length: this.#ctrLength };
      const ctBuf = await subtle.encrypt(params, this.#key, data);
      const ct = new Uint8Array(ctBuf);
      const packed = new Uint8Array(counter.length + ct.length);
      packed.set(counter, 0);
      packed.set(ct, counter.length);
      return this.#encodeOut(packed);
    }

    if (this.#mode === "CBC") {
      const iv = this.#iv || this.#randomBytes(16);
      if (this.#padding === "PKCS5Padding") {
        if (!this.#key) throw new Error("CBC key not initialized");
        const ctBuf = await subtle.encrypt({ name: "AES-CBC", iv }, this.#key, data);
        const ct = new Uint8Array(ctBuf);
        const packed = new Uint8Array(iv.length + ct.length);
        packed.set(iv, 0);
        packed.set(ct, iv.length);
        return this.#encodeOut(packed);
      } else {
        // NoPadding via CryptoJS (ESM)
        const CryptoJS = this.#getCryptoJS();
        if (!CryptoJS) throw new Error("CBC NoPadding requires CryptoJS (ESM) fallback.");
        if (data.length % 16 !== 0) {
          throw new Error("CBC NoPadding requires plaintext length multiple of 16 bytes.");
        }
        const keyWA = CryptoJS.lib.WordArray.create(this.#rawKeyBytes);
        const ivWA = CryptoJS.lib.WordArray.create(iv);
        const dataWA = CryptoJS.lib.WordArray.create(data);
        const enc = CryptoJS.AES.encrypt(dataWA, keyWA, {
          iv: ivWA,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.NoPadding,
        });
        const ctHex = enc.ciphertext.toString(CryptoJS.enc.Hex);
        const ct = this.#hexToBytes(ctHex);
        const packed = new Uint8Array(iv.length + ct.length);
        packed.set(iv, 0);
        packed.set(ct, iv.length);
        return this.#encodeOut(packed);
      }
    }

    if (this.#mode === "ECB") {
      const CryptoJS = this.#getCryptoJS();
      if (!CryptoJS) throw new Error("ECB requires CryptoJS (ESM) fallback.");
      if (this.#padding === "None" && data.length % 16 !== 0) {
        throw new Error("ECB NoPadding requires plaintext length multiple of 16 bytes.");
      }
      const keyWA = CryptoJS.lib.WordArray.create(this.#rawKeyBytes);
      const dataWA = CryptoJS.lib.WordArray.create(data);
      const enc = CryptoJS.AES.encrypt(dataWA, keyWA, {
        mode: CryptoJS.mode.ECB,
        padding: this.#padding === "None" ? CryptoJS.pad.NoPadding : CryptoJS.pad.Pkcs7,
      });
      const ctHex = enc.ciphertext.toString(CryptoJS.enc.Hex);
      const ct = this.#hexToBytes(ctHex);
      return this.#encodeOut(ct); // no IV for ECB
    }

    throw new Error(`Unsupported mode: ${this.#mode}`);
  }

  // ---------- Decryption ----------

  /**
   * addReverseAlgorithm(packedEncoded, aad="")
   * Accepts the encoded string from addForwardAlgorithm.
   * Returns UTF-8 text ('plain') or base64 of raw bytes ('base64').
   */
  async addReverseAlgorithm(packedEncoded, aad = "") {
    if (!this.#mode) throw new Error("Call init(...) first");

    const subtle = (globalThis.crypto || window.crypto)?.subtle;
    if (!subtle) throw new Error("Web Crypto API not available (secure context required).");

    const packed = this.#decodeIn(packedEncoded);

    if (this.#mode === "GCM") {
      if (!this.#key) throw new Error("GCM key not initialized");
      if (packed.length < 13) throw new Error("Invalid GCM payload");
      const iv = packed.subarray(0, 12);
      const ct = packed.subarray(12);
      const ad = this.#utf8ToBytes(aad);
      const params = { name: "AES-GCM", iv, tagLength: this.#gcmTagLength, ...(ad ? { additionalData: ad } : {}) };
      try {
        const ptBuf = await crypto.subtle.decrypt(params, this.#key, ct);
        return this.#formatPlainOutput(new Uint8Array(ptBuf));
      } catch (err) {
        throw new Error('Decryption failed: invalid key/IV/tag/AAD or corrupted ciphertext.', { cause: err });
      }
    }

    if (this.#mode === "CTR") {
      if (!this.#key) throw new Error("CTR key not initialized");
      if (packed.length < 17) throw new Error("Invalid CTR payload");
      const counter = packed.subarray(0, 16);
      const ct = packed.subarray(16);
      const ptBuf = await subtle.decrypt(
        { name: "AES-CTR", counter, length: this.#ctrLength },
        this.#key,
        ct
      );
      return this.#formatPlainOutput(new Uint8Array(ptBuf));
    }

    if (this.#mode === "CBC") {
      if (packed.length < 17) throw new Error("Invalid CBC payload");
      const iv = packed.subarray(0, 16);
      const ct = packed.subarray(16);

      if (this.#padding === "PKCS5Padding") {
        if (!this.#key) throw new Error("CBC key not initialized");
        const ptBuf = await subtle.decrypt({ name: "AES-CBC", iv }, this.#key, ct);
        return this.#formatPlainOutput(new Uint8Array(ptBuf));
      } else {
        const CryptoJS = this.#getCryptoJS();
        if (!CryptoJS) throw new Error("CBC NoPadding requires CryptoJS (ESM) fallback.");
        if (ct.length % 16 !== 0) {
          throw new Error("CBC NoPadding requires ciphertext length multiple of 16 bytes.");
        }
        const keyWA = CryptoJS.lib.WordArray.create(this.#rawKeyBytes);
        const ivWA = CryptoJS.lib.WordArray.create(iv);
        const ctWA = CryptoJS.enc.Hex.parse(this.#bytesToHex(ct));
        const dec = CryptoJS.AES.decrypt({ ciphertext: ctWA }, keyWA, {
          iv: ivWA,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.NoPadding,
        });
        const ptHex = dec.toString(CryptoJS.enc.Hex);
        const ptBytes = this.#hexToBytes(ptHex);
        return this.#formatPlainOutput(ptBytes);
      }
    }

    if (this.#mode === "ECB") {
      const CryptoJS = this.#getCryptoJS();
      if (!CryptoJS) throw new Error("ECB requires CryptoJS (ESM) fallback.");
      const ct = packed; // ECB has no IV prefix
      if (this.#padding === "None" && ct.length % 16 !== 0) {
        throw new Error("ECB NoPadding requires ciphertext length multiple of 16 bytes.");
      }
      const keyWA = CryptoJS.lib.WordArray.create(this.#rawKeyBytes);
      const ctWA = CryptoJS.enc.Hex.parse(this.#bytesToHex(ct));
      const dec = CryptoJS.AES.decrypt({ ciphertext: ctWA }, keyWA, {
        mode: CryptoJS.mode.ECB,
        padding: this.#padding === "None" ? CryptoJS.pad.NoPadding : CryptoJS.pad.Pkcs7,
      });
      const ptHex = dec.toString(CryptoJS.enc.Hex);
      const ptBytes = this.#hexToBytes(ptHex);
      return this.#formatPlainOutput(ptBytes);
    }

    throw new Error(`Unsupported mode: ${this.#mode}`);
  }

  // ---------- Helpers for encoding/decoding & outputs ----------

  #encodeOut(bytes) {
    return this.#encryptOutput === "hex" ? this.#bytesToHex(bytes) : this.#bytesToB64(bytes);
  }

  #decodeIn(str) {
    // Auto-detect hex vs base64 for decrypt input
    const looksHex = /^[0-9a-fA-F\s]+$/.test(str) && str.replace(/\s+/g, "").length % 2 === 0;
    return looksHex ? this.#hexToBytes(str) : this.#b64ToBytes(str);
  }

  #formatPlainOutput(ptBytes) {
    return this.#decryptOutput === "base64" ? this.#bytesToB64(ptBytes) : this.#bytesToUtf8(ptBytes);
  }
};