# Blowfish Usage

**Modes:** `ECB`, `CBC`, `ECBCBC`, `PCBC`, `CFB`, `OFB`, `CTR`  
**Padding (block modes only):** `PKCS5`/`PKCS7`, `ONE_AND_ZEROS` (ISO/IEC 7816‑4), `LAST_BYTE`, `NULL`, `SPACES`  
**Key sizes:** 4–56 bytes (32–448 bits). Any string/bytes accepted; out‑of‑range keys are repeated to 72 bytes for the key schedule (compat).

**Key formats:** `utf8`, `latin1` (aka `string`/`binary`), `base64`, `hex`  
**IV/Counter:** 8 bytes for `CBC`/`PCBC`/`CFB`/`OFB`/`CTR` (**defaults to 00×8 if omitted** for Dojo‑compat). `ECB`/`ECBCBC` do not use IV (ECBCBC ignores IV by design).  
**Output:**
- **encrypt →** `base64` | `hex` | `bytes` | `utf8` | `latin1` (recommend `base64`/`hex` for ciphertext)
- **decrypt →** `utf8` | `latin1` | `bytes` | `base64` | `hex`

> **ECBCBC note:** implemented as **first block ECB**, then **CBC** chaining using the **previous ciphertext** (no IV).

---

## ✅ Requirements

- Browser or Node with ES Modules enabled.
- Your project should include:
  - `./algorithms/Blowfish/blowfish_plugin.js` (this file)
  - `./ReverseEngineer.js`

> This module is **self‑contained** (no external crypto libs). It supports block and stream modes directly in pure JS.

---

## 📁 Recommended Project Structure

```
/your-project
  /algorithms
    /Blowfish
      blowfish_plugin.js
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
    <title>Blowfish Demo (Browser)</title>
  </head>
  <body>
    <h1>Blowfish Demo (Browser)</h1>

    <script type="module">
      import { blowfish } from "./algorithms/Blowfish/blowfish_plugin.js";

      // Instantiate the algorithm class
      const bf = new blowfish();

      // Encrypt (CBC by default). You can change mode/encodings per call.
      const ct = bf.addForwardAlgorithm(
        "Hello, World!",                           // plaintext
        "my-secret",                               // key (string)
        {
          mode: "cbc",                              // 'ecb'|'cbc'|'ecbcbc'|'pcbc'|'cfb'|'ofb'|'ctr'
          padding: "pkcs7",                         // block modes only
          input: "utf8",                            // plaintext encoding
          output: "base64",                         // ciphertext encoding
          // iv: "hex:0001020304050607",            // optional (8 bytes). Defaults to 00×8 for CBC/stream modes.
          keyEncoding: "utf8",                      // 'utf8'|'latin1'|'hex'|'base64'
        }
      );
      console.log("Encrypted:", ct);

      // Decrypt (supply same mode/IV/keyEncoding used during encrypt)
      const pt = bf.addReverseAlgorithm(
        ct,
        "my-secret",
        {
          mode: "cbc",
          input: "base64",                          // ciphertext encoding used above
          output: "utf8",                           // plaintext encoding you want back
          // iv: "hex:0001020304050607",
          keyEncoding: "utf8",
        }
      );
      console.log("Decrypted:", pt); // "Hello, World!"
    </script>
  </body>
</html>
```

> **No top‑level await needed** — the API is synchronous.

---

## 🔧 Direct API (Node or Browser)

```js
import { blowfish } from "./algorithms/Blowfish/blowfish_plugin.js";

const bf = new blowfish();

// CTR example (stream mode; no padding)
const ctCTR = bf.addForwardAlgorithm("stream-like mode", "key", {
  mode: "ctr",
  input: "utf8",
  output: "hex",
  iv: "hex:0011223344556677",
});

const ptCTR = bf.addReverseAlgorithm(ctCTR, "key", {
  mode: "ctr",
  input: "hex",
  output: "utf8",
  iv: "hex:0011223344556677",
});
```

---

## 🧩 Options Reference

- `mode`: `'ecb'|'cbc'|'ecbcbc'|'pcbc'|'cfb'|'ofb'|'ctr'` (default: `'cbc'`)
- `padding`: `'pkcs7'|'pkcs5'|'one_and_zeros'|'last_byte'|'null'|'spaces'`  
  *(Only used for block modes — `ecb`, `cbc`, `pcbc`, `ecbcbc`)*
- `input`: `'utf8'|'latin1'|'string'|'binary'|'base64'|'hex'|'bytes'`
- `output`: `'utf8'|'latin1'|'string'|'binary'|'base64'|'hex'|'bytes'`
- `iv`: IV/counter as `Uint8Array`, `'hex:...'`, `'base64:...'`, or **raw 8‑char string** (latin1).  
  Required for `cbc`/`pcbc`/`cfb`/`ofb`/`ctr`. Defaults to **00×8** if omitted (Dojo‑compat). Not used by `ecb`/`ecbcbc`.
- `keyEncoding`: how to convert string keys → bytes: `'utf8'|'latin1'|'hex'|'base64'` (default: `'utf8'`)

---

## 📦 What the API Returns

The API returns **exactly the encoded bytes you requested** — it does **not pack** the IV or counter into the ciphertext. 
- Encrypt returns the ciphertext encoded as `output` (e.g., Base64 or hex). 
- Decrypt returns plaintext encoded as `output` (e.g., `utf8` by default).

> If you need a self‑contained message, prepend your IV/counter yourself (e.g., `packed = iv || ciphertext`).

---

## ✳️ Examples by Mode

### 1) CBC (PKCS5/PKCS7)
```js
const bf = new blowfish();
const ct = bf.addForwardAlgorithm("PKCS7 padding", "k", {
  mode: "cbc",
  input: "utf8",
  output: "base64",
  iv: "hex:0001020304050607",
  padding: "pkcs7",
});
const pt = bf.addReverseAlgorithm(ct, "k", {
  mode: "cbc",
  input: "base64",
  output: "utf8",
  iv: "hex:0001020304050607",
});
```

### 2) CTR (no padding)
```js
const ct = bf.addForwardAlgorithm("CTR demo", "k", {
  mode: "ctr",
  input: "utf8",
  output: "hex",
  iv: "hex:0011223344556677", // initial 64-bit counter (big-endian increment)
});
const pt = bf.addReverseAlgorithm(ct, "k", {
  mode: "ctr",
  input: "hex",
  output: "utf8",
  iv: "hex:0011223344556677",
});
```

### 3) CFB (no padding; 64-bit feedback)
```js
const ct = bf.addForwardAlgorithm("CFB demo", "k", {
  mode: "cfb",
  input: "utf8",
  output: "hex",
  iv: "hex:0102030405060708",
});
const pt = bf.addReverseAlgorithm(ct, "k", {
  mode: "cfb",
  input: "hex",
  output: "utf8",
  iv: "hex:0102030405060708",
});
```

### 4) OFB (no padding)
```js
const ct = bf.addForwardAlgorithm("OFB demo", "k", {
  mode: "ofb",
  input: "utf8",
  output: "hex",
  iv: "hex:0f0e0d0c0b0a0908",
});
const pt = bf.addReverseAlgorithm(ct, "k", {
  mode: "ofb",
  input: "hex",
  output: "utf8",
  iv: "hex:0f0e0d0c0b0a0908",
});
```

### 5) PCBC (propagating CBC)
```js
const ct = bf.addForwardAlgorithm("PCBC demo", "k", {
  mode: "pcbc",
  input: "utf8",
  output: "hex",
  iv: "hex:0000000000000000",
});
const pt = bf.addReverseAlgorithm(ct, "k", {
  mode: "pcbc",
  input: "hex",
  output: "utf8",
  iv: "hex:0000000000000000",
});
```

### 6) ECBCBC (first block ECB, then CBC)
```js
const ct = bf.addForwardAlgorithm("ABCDEFGH12345678", "k", {
  mode: "ecbcbc",
  input: "utf8",
  output: "hex",
});
const pt = bf.addReverseAlgorithm(ct, "k", {
  mode: "ecbcbc",
  input: "hex",
  output: "utf8",
});
```

### 7) ECB (not recommended)
```js
const ct = bf.addForwardAlgorithm("avoid ECB in production", "k", {
  mode: "ecb",
  input: "utf8",
  output: "hex",
  padding: "pkcs7",
});
const pt = bf.addReverseAlgorithm(ct, "k", {
  mode: "ecb",
  input: "hex",
  output: "utf8",
});
```


---

## 🧪 Text/Binary Helpers

- **UTF‑8:** `TextEncoder` / `TextDecoder` for text ↔ bytes.
- **Latin‑1 (binary string):** this plug‑in provides `latin1` encodings for both input/output and keys.

```js
const bytes = new TextEncoder().encode("Hello");
const text  = new TextDecoder().decode(bytes);
```

---

## ⚠️ Common Pitfalls & Fixes

- **IV length:** Blowfish uses **8‑byte** IV/counter. Ensure `iv.length === 8`.
- **Padding:** Only used by **block modes**. Stream modes (`cfb`/`ofb`/`ctr`) **do not pad** and accept any length.
- **ECB/ECBCBC caution:** ECB leaks patterns; ECBCBC is legacy. Prefer CBC (with random IV) or CTR/OFB/CFB as appropriate.
- **CTR nonce reuse:** Never reuse the **same key + counter (IV)** pair.
- **Key encoding:** For Dojo parity, use `keyEncoding: 'latin1'`. For modern apps, prefer `utf8` and explicit `hex`/`base64` for binary keys.
- **Environment Base64:** In Node, Base64 is handled via `Buffer`; in browsers via `btoa/atob`.

---

## 📌 Version

**`blowfish` v4.0.0** — "Single‑file Blowfish with ECB/CBC/ECBCBC/PCBC/CFB/OFB/CTR and Dojo compatibility."