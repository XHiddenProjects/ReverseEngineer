
# Twofish Usage

**Modes:** `ECB`, `CBC`  
**Padding:** `ZERO` (zero‑padding to 16‑byte blocks; optional trimming on decrypt via `trimNulls`)  
**Block size:** 16 bytes (128 bits)

**Key sizes:** 8–32 bytes (64–256 bits). Any length is accepted; keys are **padded or truncated to a multiple of 8 bytes up to 32 bytes** internally (effective sizes: 64/128/192/256‑bit).

**Key formats:** `utf8`, `hex`, `base64`, `bytes`  
**IV (CBC):** 16 bytes. **Encrypt:** random IV is generated if omitted. **Decrypt:** you **must supply the original IV**.  
**Output:**
- **encrypt →** `base64` | `hex` | `bytes` | `utf8` *(recommend `base64`/`hex` for ciphertext)*
- **decrypt →** `utf8` | `hex` | `base64` | `bytes`

> **Important:** The API does **not** pack the IV into the ciphertext. For CBC encryption, set `returnMeta: true` to get the IV (hex) back, or prepend/store it yourself.

---

## ✅ Requirements

- Browser or Node with ES Modules enabled.
- Your project should include:
  - `./algorithms/Twofish/twofish-plugin.js` (this file)
  - `./ReverseEngineer.js`

> This module is **self‑contained** (no external crypto libs). Twofish core is implemented in pure JS.

---

## 📁 Recommended Project Structure

```
/your-project
  /algorithms
    /Twofish
      twofish-plugin.js
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
    <title>Twofish Demo (Browser)</title>
  </head>
  <body>
    <h1>Twofish Demo (Browser)</h1>

    <script type="module">
      import { Twofish } from "./algorithms/Twofish/twofish-plugin.js";

      // Instantiate the algorithm class
      const tf = new Twofish();

      // Encrypt (CBC by default). Use a SINGLE options object as the 2nd argument.
      const enc = tf.addForwardAlgorithm(
        "Hello, World!",                    // plaintext (string or bytes)
        {
          key: "my-secret",                  // required
          keyEncoding: "utf8",               // 'utf8'|'hex'|'base64'|'bytes'
          mode: "CBC",                       // 'CBC'|'ECB' (case-insensitive)
          inputEncoding: "utf8",             // plaintext encoding
          outputEncoding: "base64",          // ciphertext encoding
          returnMeta: true                    // get back IV (hex) & other info
          // iv: "00112233445566778899aabbccddeeff", // optional (hex; 16 bytes)
          // ivEncoding: "hex",
        }
      );
      console.log("Ciphertext:", enc.data);
      console.log("Meta:", enc.meta);        // { mode, iv (hex), outputEncoding }

      // Decrypt (supply the SAME IV used during encrypt)
      const dec = tf.addReverseAlgorithm(
        enc.data,
        {
          key: "my-secret",
          keyEncoding: "utf8",
          mode: "CBC",
          iv: enc.meta.iv,                  // hex string captured above
          ivEncoding: "hex",
          inputEncoding: "base64",          // the ciphertext encoding used above
          outputEncoding: "utf8",           // plaintext encoding you want back
          trimNulls: true                    // remove trailing zero padding (default true)
        }
      );
      console.log("Plaintext:", dec);       // "Hello, World!"
    </script>
  </body>
</html>
```

> **No top‑level await needed** — the API is synchronous.

---

## 🔧 Direct API (Node or Browser)

```js
import { Twofish } from "./algorithms/Twofish/twofish-plugin.js";

const tf = new Twofish();

// ECB example (zero padding)
const ct = tf.addForwardAlgorithm("avoid ECB in production", {
  key: "k",
  keyEncoding: "utf8",
  mode: "ECB",
  inputEncoding: "utf8",
  outputEncoding: "hex",
});

const pt = tf.addReverseAlgorithm(ct, {
  key: "k",
  keyEncoding: "utf8",
  mode: "ECB",
  inputEncoding: "hex",
  outputEncoding: "utf8",
  // trimNulls applies to ECB/CBC decrypt; default true
});
```

---

## 🧩 Options Reference

> **Pass a single options object** as the second parameter to both `addForwardAlgorithm` and `addReverseAlgorithm`.

- `key` **(required):** string/bytes key.
- `keyEncoding`: how to convert string keys → bytes: `'utf8'|'hex'|'base64'|'bytes'` (default: auto‑guess; explicit is recommended).
- `mode`: `'CBC'|'ECB'` (default: `'CBC'`). Case‑insensitive.
- `iv` (CBC only): 16‑byte IV as `Uint8Array`, hex/base64 string, or raw bytes (when using `'bytes'`).
- `ivEncoding`: `'hex'|'base64'|'bytes'` — how to parse `iv` when it’s a string.
- `inputEncoding` (forward): `'utf8'|'hex'|'base64'|'bytes'` (default `'utf8'`).
- `inputEncoding` (reverse): `'base64'|'hex'|'bytes'` (default `'base64'`).
- `outputEncoding` (forward): `'base64'|'hex'|'utf8'|'bytes'` (default `'base64'`).
- `outputEncoding` (reverse): `'utf8'|'hex'|'base64'|'bytes'` (default `'utf8'`).
- `trimNulls` (reverse only): boolean (default `true`). When `true`, removes trailing zero bytes after CBC/ECB decryption.
- `returnMeta` (forward/reverse): boolean. If `true`, returns `{ data, meta: { mode, iv, outputEncoding, trimNulls? } }`.

---

## 📦 What the API Returns

- **Encrypt (forward)** returns **ciphertext** encoded as you requested (`outputEncoding`). If `returnMeta: true`, you also get:
  ```json
  {
    "data": "...encoded ciphertext...",
    "meta": {
      "mode": "CBC|ECB",
      "iv": "...hex IV or null...",
      "outputEncoding": "base64|hex|utf8|bytes"
    }
  }
  ```
- **Decrypt (reverse)** returns **plaintext** encoded as you requested (`outputEncoding`). With `returnMeta: true`, `trimNulls` is included in `meta`.

> The IV is **not embedded** into the ciphertext. Persist it yourself (e.g., prepend IV bytes or store separately). When decrypting, set `iv` + `ivEncoding` accordingly.

---

## ✳️ Examples

### 1) CBC with **random IV** (recommended)
```js
const tf = new Twofish();

// Encrypt — no IV provided, a random 16‑byte IV will be generated
const { data: c1, meta } = tf.addForwardAlgorithm("Zero‑padded CBC", {
  key: "my-key",
  keyEncoding: "utf8",
  mode: "CBC",
  inputEncoding: "utf8",
  outputEncoding: "base64",
  returnMeta: true,
});

// Decrypt — reuse the captured IV (hex)
const p1 = tf.addReverseAlgorithm(c1, {
  key: "my-key",
  keyEncoding: "utf8",
  mode: "CBC",
  iv: meta.iv,
  ivEncoding: "hex",
  inputEncoding: "base64",
  outputEncoding: "utf8",
});
```

### 2) CBC with **explicit IV**
```js
const ivHex = "000102030405060708090a0b0c0d0e0f"; // 16 bytes
const c2 = tf.addForwardAlgorithm("CBC with explicit IV", {
  key: "my-key",
  keyEncoding: "utf8",
  mode: "CBC",
  iv: ivHex,
  ivEncoding: "hex",
  inputEncoding: "utf8",
  outputEncoding: "hex",
});

const p2 = tf.addReverseAlgorithm(c2, {
  key: "my-key",
  keyEncoding: "utf8",
  mode: "CBC",
  iv: ivHex,
  ivEncoding: "hex",
  inputEncoding: "hex",
  outputEncoding: "utf8",
});
```

### 3) ECB (not recommended for real data)
```js
const c3 = tf.addForwardAlgorithm("avoid ECB in production", {
  key: "k",
  keyEncoding: "utf8",
  mode: "ECB",
  inputEncoding: "utf8",
  outputEncoding: "hex",
});

const p3 = tf.addReverseAlgorithm(c3, {
  key: "k",
  keyEncoding: "utf8",
  mode: "ECB",
  inputEncoding: "hex",
  outputEncoding: "utf8",
});
```

---

## 🧪 Text/Binary Helpers

You can freely pass `Uint8Array`, `ArrayBuffer`, or strings with `inputEncoding`/`outputEncoding`. For browser text handling:

```js
const bytes = new TextEncoder().encode("Hello");
const text  = new TextDecoder().decode(bytes);
```

The plug‑in will also accept file payloads from a GUI that pre‑reads content as bytes/text/data URLs.

---

## ⚠️ Common Pitfalls & Fixes

- **IV length (CBC):** Twofish uses a **16‑byte IV**. Ensure `iv` is exactly 16 bytes when provided.
- **Random IV on decrypt:** If you forget the IV on **decryption**, the plug‑in will generate a random IV, producing incorrect plaintext. Always persist and reuse the original IV.
- **Zero padding ambiguity:** Zero‑padding can’t distinguish real trailing zeros from padding. `trimNulls` (default `true`) removes trailing zeros; set it to `false` if your plaintext may legitimately end with `\x00` bytes.
- **Ciphertext length:** For decryption, ciphertext must be a **multiple of 16 bytes** (`ECB`/`CBC`).
- **Mode mismatch:** Use the **same mode and IV** for decrypt as used for encrypt.
- **Key encoding:** The plug‑in guesses key encoding, but for reliability provide `keyEncoding` explicitly.
- **ECB caution:** ECB leaks patterns. Prefer CBC with a **random IV**.

---

## 📌 Version

**`Twofish` v1.0.0** — "Single‑file Twofish with ECB/CBC (128‑bit block) and zero‑padding in pure JS."