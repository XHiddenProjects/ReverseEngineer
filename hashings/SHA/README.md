# Secure Hash Algorithms (SHA-1 / SHA-256 / SHA-384 / SHA-512)

> **Modern hashing via Web Crypto (with Node.js fallback).**

**Class:** `SHA`  
**Version:** `1.2.0`  
**Category:** Hashing  
**Algorithms:** `SHA-1`, `SHA-256`, `SHA-384`, `SHA-512`  
**Outputs:** `hex`, `base64`, `bytes`

---

## ⚠️ Security Notice
- **SHA‑1 is deprecated** for collision resistance; do **not** use it for signatures, password storage, or integrity‑critical checks.  
- Prefer **SHA‑256 / SHA‑384 / SHA‑512** for general hashing needs.

---

## What This Module Provides
`SHA` implements SHA‑1/256/384/512 using:

- **Web Crypto API** (`crypto.subtle.digest`) in modern browsers
- **Node.js fallback** using `crypto.createHash` when Web Crypto is not available

It offers:
- A flexible **forward** API for hashing strings/bytes with positional or object arguments
- A **reverse/verify** API that:
  - auto‑detects digest encoding (**hex** vs **base64**)
  - **infers the algorithm** from digest length (when possible)
  - resolves source from **bytes**, **Blob/File**, or **file input** (browser)
  - if text, tries to **recover plaintext adjacent to the digest** on the same line
- Small **UI policy** for use with a `ReverseEngineer` orchestrator/GUI

---

## Install / Include
This is a plain ES module you can include directly in your web project or bundle.

**Recommended structure:**
```
/your-project
  /algorithms
    /SHA
      SHA.js
  ReverseEngineer.js
  index.html
```

> The class imports the orchestrator base via:
> ```js
> import { ReverseEngineer } from "../../ReverseEngineer.js";
> ```
> Adjust the relative path for your layout.

---

## Quick Start (Browser, ES Modules)
Create an `index.html` and open it via a local HTTP server.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>SHA Demo (SHA-1/256/384/512)</title>
  </head>
  <body>
    <h1>SHA Demo</h1>

    <script type="module">
      import { SHA } from "./algorithms/SHA/SHA.js";

      const sha = new SHA();

      // --- Optional: set defaults (used when args omitted) ---
      sha.init('SHA-256', 'hex'); // defaults

      // --- Forward (hash) ---
      const s256_hex = await sha.addForwardAlgorithm("Hello, World!", "SHA-256", "hex");
      console.log("SHA-256 hex:", s256_hex);

      // Encoding-only convenience (algo falls back to default)
      const defaultAlgo_b64 = await sha.addForwardAlgorithm("Hello, World!", "base64");
      console.log("Default algo base64:", defaultAlgo_b64);

      // Object form
      const s512_bytes = await sha.addForwardAlgorithm("Hello, World!", { algo: "SHA-512", encoding: "bytes" });
      console.log("SHA-512 bytes (Uint8Array):", s512_bytes);

      // --- Reverse (verify) ---
      // 1) Compute an expected digest
      const expectedHex = await sha.addForwardAlgorithm("Hello, World!", "SHA-256", "hex");

      // 2) Provide the digest first, then a source (bytes / File / Blob / descriptors)
      const sourceBytes = new TextEncoder().encode("Hello, World!");
      const verify = await sha.addReverseAlgorithm(expectedHex, { bytes: sourceBytes });
      console.log("Verify:", verify); // { ok: true|false, message }
    </script>
  </body>
</html>
```

---

## Using with `ReverseEngineer` Orchestrator
The **forward** method accepts positional or object args. The **reverse** method takes the expected digest first, followed by a source descriptor.

```js
import { SHA } from "./algorithms/SHA/SHA.js";
import { ReverseEngineer } from "./ReverseEngineer.js";

const engineer = new ReverseEngineer();
engineer.getInstance();
engineer.add(SHA);

// Forward (positional)
const hex = await engineer.forward(SHA, "Hash me", "SHA-512", "hex");

// Forward (object form)
const b64 = await engineer.forward(SHA, "Hash me", { algo: "SHA-384", encoding: "base64" });

// Reverse (verify)
const expected = await engineer.forward(SHA, "Hash me", "SHA-256", "hex");
const res = await engineer.reverse(SHA, expected, { bytes: new TextEncoder().encode("Hash me") });
console.log(res); // { ok: true, message: "[binary/text content matched SHA-256]" }
```

> The orchestrator should pass arguments as-is to the algorithm methods.

---

## API Reference

### `init(algo = 'SHA-256', encoding = 'hex')`
Set defaults used when `addForwardAlgorithm` args are omitted.

- **Returns**: `{ ok: true, defaults: { algo, encoding } }`

---

### `addForwardAlgorithm(input, algo?, encoding?)`
Compute a digest.

- **Parameters**
  - `input`: `string | Uint8Array | ArrayBuffer`
  - `algo` (optional): `'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'`  
    You may also pass an **options object**: `{ algo?, encoding? }`
  - `encoding` (optional): `'hex' | 'base64' | 'bytes'`

- **Notes**
  - If only one string arg matches a known encoding (e.g., `'base64'`), it is treated as **encoding** and the algorithm falls back to the current default.

- **Returns**: `string | Uint8Array`

- **Examples**
  ```js
  const sha = new SHA();
  sha.init('SHA-256', 'hex');

  const h1 = await sha.addForwardAlgorithm('abc');                      // default algo+hex
  const h2 = await sha.addForwardAlgorithm('abc', 'SHA-512', 'base64'); // explicit
  const h3 = await sha.addForwardAlgorithm('abc', { algo:'SHA-384', encoding:'bytes' });
  const h4 = await sha.addForwardAlgorithm('abc', 'base64');            // encoding-only
  ```

---

### `addReverseAlgorithm(expectedHash, ...args)`
Verify provided content (bytes/blob/file) against an **expected** digest.

- **Behavior**
  1. Detects digest encoding (`hex` vs `base64`)
  2. **Infers algorithm** by digest length if possible:  
     - Hex: `40 → SHA-1`, `64 → SHA-256`, `96 → SHA-384`, `128 → SHA-512`  
     - Base64 (incl. padding): `28 → SHA-1`, `44 → SHA-256`, `64 → SHA-384`, `88 → SHA-512`
  3. Resolves content from `Uint8Array`, `ArrayBuffer`, `Blob/File`, `{ bytes }`, `{ file }`, or `{ fileInput }`
  4. If the source is textual, attempts to locate a **plaintext token adjacent to the digest** on the same line and verify it
  5. Otherwise, hashes the entire content and compares

- **Parameters**
  - `expectedHash`: `string`
  - `...args`: any of:
    - `Uint8Array` | `ArrayBuffer`
    - `Blob` | `File`
    - `{ bytes: Uint8Array | ArrayBuffer }`
    - `{ file: Blob | File }`
    - `{ fileInput: HTMLInputElement | stringSelector }`

- **Returns**: `{ ok: boolean, message: string }`  
  - On success, `message` is either the recovered **plaintext** (from a text line) or `"[binary/text content matched <ALGO>]"`

- **Example**
  ```js
  const expected = await sha.addForwardAlgorithm('hello', 'SHA-256', 'hex');
  const out = await sha.addReverseAlgorithm(expected, { bytes: new TextEncoder().encode('hello') });
  // -> { ok: true, message: "[binary/text content matched SHA-256]" }
  ```

---

## UI Policy (for GUIs)
The class exposes `static UI_POLICY` for GUI hints:

```js
static UI_POLICY = {
  requiresInit: false,
  directions: {
    init:    { input: false, args: true,  inputPh: '—', argsPh: 'Defaults: ["SHA-256","hex"]', allowFile:false },
    forward: { input: true,  args: true,  inputPh: 'Text to hash', argsPh: '["SHA-256","hex"|"base64"|"bytes"] (optional)', allowFile:false },
    reverse: { input: true,  args: false, inputPh: 'Expected digest (hex/base64)', argsPh: '—', allowFile:true }
  },
};
```

---

## Encoding & Utilities
- **Hex**: lower‑case hex string
- **Base64**: `btoa` in browsers; `Buffer.toString('base64')` in Node
- **Bytes**: `Uint8Array`

The module uses `TextEncoder` / Web Crypto when available, with Node fallbacks.

---

## Common Pitfalls
- **Do not use SHA‑1** for security‑critical applications
- Ensure **expected digest encoding** matches (`hex` vs `base64`)
- When verifying, algorithm is **inferred** by digest length; mismatched digest/encoding will fail
- For text sources, the plaintext recovery depends on the digest appearing on the **same line**

---

## Version
**SHA v1.2.0** — “Secure Hash Algorithms via Web Crypto (SHA‑1/256/384/512).”