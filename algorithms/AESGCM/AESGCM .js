import { ReverseEngineer, CryptoUtils } from "../../ReverseEngineer.js";
export const AESGCM = class  extends ReverseEngineer {
  //Configuration
  version = "1.0.0";
  description = "AES-GCM using Web Crypto API (browser). Output = base64(iv|ciphertext+tag).";
  constructor(){
    super();
    this.getInstance();
  }
  /** @type {CryptoKey|null} */
  #key = null;

  /**
   * init({ keyB64 }) where keyB64 decodes to 16/24/32 bytes (AES-128/192/256)
   * You can generate a 32-byte key with: bytesToB64(randomBytes(32))
   */
  async init({ keyB64 }) {
    if (!keyB64) throw new Error("AESGCM.init requires { keyB64 }");
    const raw = CryptoUtils.b64ToBytes(keyB64);
    if (![16, 24, 32].includes(raw.length))
      throw new Error("AESGCM key must be 16/24/32 bytes (base64-encoded).");

    this.#key = await crypto.subtle.importKey(
      "raw",
      raw,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
    return this;
  }

  /**
   * addForwardAlgorithm(plaintext, aad="")
   * @returns Promise<string base64>
   */
  async addForwardAlgorithm(plaintext, aad = "") {
    if (!this.#key) throw new Error("Call init({keyB64}) first");

    const iv = CryptoUtils.randomBytes(12); // recommended IV size for GCM
    const data = CryptoUtils.utf8ToBytes(plaintext);
    const aadBytes = CryptoUtils.utf8ToBytes(aad);

    const ct = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: aadBytes },
      this.#key,
      data
    );

    // Pack: iv | ciphertext+tag
    const ctBytes = new Uint8Array(ct);
    const packed = new Uint8Array(iv.length + ctBytes.length);
    packed.set(iv, 0);
    packed.set(ctBytes, iv.length);

    return CryptoUtils.bytesToB64(packed);
  }

  /**
   * addReverseAlgorithm(packedB64, aad="")
   * @returns Promise<string plaintext>
   */
  async addReverseAlgorithm(packedB64, aad = "") {
    if (!this.#key) throw new Error("Call init({keyB64}) first");
    const packed = CryptoUtils.b64ToBytes(packedB64);
    if (packed.length < 13) throw new Error("Invalid AESGCM payload");

    const iv = packed.subarray(0, 12);
    const ct = packed.subarray(12);
    const aadBytes = CryptoUtils.utf8ToBytes(aad);

    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: aadBytes },
      this.#key,
      ct
    );

    return CryptoUtils.bytesToUtf8(new Uint8Array(pt));
  }
}