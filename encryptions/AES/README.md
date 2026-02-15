# AES Usage

**Modes:** `GCM`, `CTR`, `CBC`, `ECB`  
**Padding:** `PKCS5Padding` (PKCS7) or `None` (CBC/ECB only)  
**Key sizes:** `128`, `192`, `256` bits  
**Key formats:** `plain` (UTF‑8), `base64`, `hex`  
**IV/Counter:** Required for `GCM`/`CTR`/`CBC` (auto-generated if omitted). `ECB` does not use IV.  
**Output:**  
- **encrypt →** `base64` | `hex` of **packed** bytes  
- **decrypt →** `plain` (UTF‑8) | `base64` of raw bytes  

> Includes a CryptoJS ESM fallback for:  
> • **ECB** (not supported by Web Crypto)  
> • **CBC NoPadding** (Web Crypto only supports PKCS7)

---

## ✅ Requirements

- A modern browser with **`window.crypto.subtle`** (Web Crypto API).
- Serve files over **HTTP(S)** or `http://localhost` (not `file://`).
- Your project should include:
  - `./algorithms/AES/AES.js`
  - `./ReverseEngineer.js` (exports both `ReverseEngineer` and `CryptoUtils`)

> The module imports CryptoJS via ESM CDN:
> ```js
> import cryptoJs from "https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/+esm";
> ```
> This enables **ECB** and **CBC NoPadding**.

---

## 📁 Recommended Project Structure

```
/your-project
  /algorithms
    /AES
      AES.js
  ReverseEngineer.js
  index.html
```

---

## 🚀 Quick Start (HTML + ES Modules)

Create an `index.html` and open it via a local HTTP server.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>AES Demo (Browser)</title>
  </head>
  <body>
    <h1>AES Demo (Browser)</h1>

    <script type="module">
      import { AES } from "./algorithms/AES/AES.js";
      import { ReverseEngineer, CryptoUtils } from "./ReverseEngineer.js";

      // Register the algorithm class with the orchestrator
      const engineer = new ReverseEngineer();
      engineer.getInstance();
      engineer.add(AES);

      // Generate a Base64 key (32 bytes → AES‑256)
      const secretB64 = CryptoUtils.generateB64Key(32);

      // Initialize AES (GCM default). You can change mode/padding later.
      await engineer.init(AES, {
        secret: secretB64,
        secret_key_format: "base64",  // 'plain' | 'base64' | 'hex'
        mode: "GCM",                  // 'GCM' | 'CTR' | 'CBC' | 'ECB'
        padding: "PKCS5Padding",      // CBC/ECB only: 'PKCS5Padding' | 'None'
        keyBits: 256,                 // 128 | 192 | 256
        encrypt_output: "base64",     // 'base64' | 'hex'
        decrypt_output: "plain",      // 'plain' | 'base64'
        // iv: ...,                   // optional: auto-generated if omitted
        // iv_format: "base64",       // 'plain' | 'base64' | 'hex'
        // ctr_length: 64,            // AES‑CTR counter length (bits)
        // gcm_tag_length: 128,       // GCM tag length (bits)
        // aad: "optional-aad",       // default AAD for GCM if you want
      });

      // ✅ Encrypt (GCM example, with AAD)
      const encrypted = await engineer.forward(AES, "Hello, World!", "optional-aad");
      console.log("Encrypted:", encrypted); // base64 (packed: iv(12) || ciphertext+tag)

      // ✅ Decrypt (must use the same AAD if used during encryption)
      const decrypted = await engineer.reverse(AES, encrypted, "optional-aad");
      console.log("Decrypted:", decrypted); // "Hello, World!"
    </script>
  </body>
</html>
```

> **No top‑level await?** Wrap in an async IIFE.

---

## 🔧 Direct API (without `ReverseEngineer`)

```js
import { AES } from "./algorithms/AES/AES.js";

const aes = new AES();
await aes.init({
  secret: "zYh7...==",          // your Base64 key here
  secret_key_format: "base64",
  mode: "CBC",
  padding: "PKCS5Padding",
  keyBits: 256,
  encrypt_output: "hex",
});

const ct = await aes.addForwardAlgorithm("Top secret");
const pt = await aes.addReverseAlgorithm(ct);
```

---

## 🧩 Options Reference

- `secret` **(required)**: Key material string.
- `secret_key_format`: `'plain' | 'base64' | 'hex'` (default: `'base64'`)
- `mode`: `'GCM' | 'CTR' | 'CBC' | 'ECB'` (default: `'GCM'`)
- `padding`: `'PKCS5Padding' | 'None'` (CBC/ECB only; default: `'PKCS5Padding'`)
- `keyBits`: `128 | 192 | 256` (default: `256`)
- `iv`: IV/counter string in `iv_format` (auto-generated if omitted; not used for ECB)
- `iv_format`: `'plain' | 'base64' | 'hex'` (default: `'base64'`)
- `encrypt_output`: `'base64' | 'hex'` (default: `'base64'`)
- `decrypt_output`: `'plain' | 'base64'` (default: `'plain'`)
- `ctr_length`: number of counter bits for AES‑CTR (default: `64`)
- `gcm_tag_length`: GCM tag length in bits (default: `128`)
- `aad`: default AAD (UTF‑8 string) for GCM (optional)

> **Key length:** must be exactly 16/24/32 bytes for AES‑128/192/256. If it’s not the exact length when decoded in the chosen format, `init(...)` throws.

---

## 📦 Payload Format (what `encrypt` returns)

Depending on the mode, the ciphertext is **packed** before encoding (`base64` or `hex`):

- **GCM:** `iv(12)` **||** `ciphertext+tag`
- **CTR:** `counter(16)` **||** `ciphertext`
- **CBC:** `iv(16)` **||** `ciphertext`
- **ECB:** `ciphertext` (no IV)

During **decrypt**, the input is auto‑detected as **hex** or **base64**.  
`decrypt_output: 'plain'` returns UTF‑8; `'base64'` returns raw bytes as Base64.

---

## ✳️ Examples by Mode

### 1) AES‑GCM (recommended)

```js
await engineer.init(AES, {
  secret: CryptoUtils.generateB64Key(32),
  secret_key_format: "base64",
  mode: "GCM",
  gcm_tag_length: 128, // 96 or 128 typical; 128 default here
});

const aad = "invoice:1234";
const enc = await engineer.forward(AES, "Pay $100", aad);
// enc is base64 of: iv(12) || ciphertext+tag
const dec = await engineer.reverse(AES, enc, aad); // "Pay $100"
```

> **GCM IV:** Always use a **unique 12‑byte IV per key**. The module auto‑generates one if omitted.

---

### 2) AES‑CTR

```js
await engineer.init(AES, {
  secret: CryptoUtils.generateB64Key(16), // AES‑128
  secret_key_format: "base64",
  mode: "CTR",
  ctr_length: 64, // bits of the counter field
});

const enc = await engineer.forward(AES, "stream-like mode");
const dec = await engineer.reverse(AES, enc);
```

> **CTR IV/Counter:** Never reuse the **same counter with the same key**.

---

### 3) AES‑CBC (PKCS5/PKCS7)

```js
await engineer.init(AES, {
  secret: CryptoUtils.generateB64Key(32), // AES‑256
  secret_key_format: "base64",
  mode: "CBC",
  padding: "PKCS5Padding",
});

const enc = await engineer.forward(AES, "Block mode with PKCS7");
const dec = await engineer.reverse(AES, enc);
```

---

### 4) AES‑CBC (NoPadding) — **CryptoJS fallback**

```js
await engineer.init(AES, {
  secret: "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
  secret_key_format: "hex",
  mode: "CBC",
  padding: "None",
  iv: "000102030405060708090a0b0c0d0e0f",
  iv_format: "hex",
});

// Plaintext must be a multiple of 16 bytes
const enc = await engineer.forward(AES, "16-byte-block...."); // length % 16 === 0
const dec = await engineer.reverse(AES, enc);
```

---

### 5) AES‑ECB — **CryptoJS fallback; not recommended**

```js
await engineer.init(AES, {
  secret: CryptoUtils.generateB64Key(24), // AES‑192
  secret_key_format: "base64",
  mode: "ECB",
  padding: "PKCS5Padding", // or 'None' if data % 16 === 0
});

const enc = await engineer.forward(AES, "avoid ECB in production");
const dec = await engineer.reverse(AES, enc);
```

> ⚠️ **Security note:** **ECB** leaks patterns; avoid it for real‑world data.

---

## 🔐 Keys, IVs, and AAD

- **Key size:** Use 16/24/32 bytes for AES‑128/192/256.  
  Generate Base64 keys via: `CryptoUtils.generateB64Key(lengthBytes)`.
- **IV/Nonce:**  
  - `GCM` → 12 bytes (required; auto if omitted).  
  - `CBC` → 16 bytes.  
  - `CTR` → 16 bytes (full counter block).  
  - `ECB` → not used.  
- **AAD:** (GCM only) Optional additional authenticated data; must match on both encrypt/decrypt.

---

## 🔄 Output Encoding

- **Encryption:** `encrypt_output` → `'base64'` (default) or `'hex'`.
- **Decryption:** `decrypt_output` → `'plain'` (UTF‑8, default) or `'base64'` (raw bytes).

**Auto‑detect on decrypt:** The module detects whether input is hex or base64 and decodes accordingly.

---

## 🧪 Text/Binary Helpers

Use standard Web APIs to manage text/bytes explicitly:

```js
const enc = new TextEncoder();
const dec = new TextDecoder();
const bytes = enc.encode("Hello, World!");
const text = dec.decode(bytes);
```

---

## ⚠️ Common Pitfalls & Fixes

- **Serve over HTTP(S):** `crypto.subtle` and ESM modules fail on `file://`.
  ```bash
  # From project root
  python3 -m http.server 8080
  # Open http://localhost:8080
  ```
- **Import path spaces:**  
  ```js
  // ❌ Wrong
  import { AES } from "./algorithms/AES/AES .js";
  // ✅ Correct
  import { AES } from "./algorithms/AES/AES.js";
  ```
- **`SyntaxError: Cannot use 'import' outside a module`** → Use `<script type="module">`.
- **CBC NoPadding/ECB errors** → Ensure CryptoJS ESM import is available (this module already imports it).
- **CBC/ECB with `padding: 'None'`** → Plaintext (encrypt) or ciphertext (decrypt) length **must be a multiple of 16 bytes**.
- **Key length mismatch** → Ensure your decoded key material is **exactly** 16/24/32 bytes.

---

## 🔁 Migrating from older `keyB64` usage

This version expects `secret` plus `secret_key_format`.  
If you previously passed `{ keyB64 }`, just do:

```js
await engineer.init(AES, {
  secret: keyB64,
  secret_key_format: "base64",
  // other options...
});
```

---

## 📌 Version

**`AES` v2.1.0** — “AES using Web Crypto API with ESM CryptoJS.”