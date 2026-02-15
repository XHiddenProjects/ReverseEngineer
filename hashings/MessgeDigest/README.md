# Message Digest (MD2 / MD4 / MD5)

> **Legacy hashing for testing & compatibility — _not_ for security‑critical use.**

**Class:** `MessageDigest`  
**Version:** `1.1.1`  
**Category:** Hashing  
**Algorithms:** `MD2`, `MD4`, `MD5`  
**Outputs:** `hex`, `base64`, `bytes`

---

## ⚠️ Security Notice
MD2/MD4/MD5 are **broken and deprecated** for real‑world cryptographic security (they are vulnerable to collisions and should not be used for signatures, password storage, or integrity‑critical tasks). Use them only for **testing, legacy interoperability, or non‑security checksums**. For new designs, prefer SHA‑256/512 or modern KDFs (e.g., Argon2, scrypt, PBKDF2).

---

## What This Module Provides
`MessageDigest` implements **MD5**, **MD4**, and **MD2** hashing with zero external dependencies and works in both **modern browsers** (ES Modules) and **Node.js**. It offers:

- A simple **forward** API for hashing strings or bytes
- A **reverse/verify** API tailored for GUI/file workflows (compare an expected digest to a provided file/bytes)
- Encoding utilities (`hex`, `base64`, `bytes`)
- UTF‑8 encoding fallback where `TextEncoder` is unavailable

It also surfaces a small **UI policy** for orchestrators like `ReverseEngineer`.

---

## Install / Include
This module is a plain ES module you can include directly in your web project or bundle.

**Recommended structure:**
```
/your-project
  /algorithms
    /MessageDigest
      MessageDigest.js
  ReverseEngineer.js
  index.html
```

> The class imports the orchestrator base via:
> ```js
> import { ReverseEngineer } from "../../ReverseEngineer.js";
> ```
> Adapt the relative path to match your project layout.

---

## Quick Start (Browser, ES Modules)
Create an `index.html` and open it via a local HTTP server.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>MessageDigest Demo (MD2/MD4/MD5)</title>
  </head>
  <body>
    <h1>MessageDigest Demo</h1>

    <script type="module">
      import { MessageDigest } from "./algorithms/MessageDigest/MessageDigest.js";

      const md = new MessageDigest();

      // ---- Forward (hash) ----
      const md5Hex = md.addForwardAlgorithm("Hello, World!", "MD5", "hex");
      console.log("MD5 hex:", md5Hex);

      const md4B64 = md.addForwardAlgorithm("Hello, World!", "MD4", "base64");
      console.log("MD4 base64:", md4B64);

      const md2Bytes = md.addForwardAlgorithm("Hello, World!", "MD2", "bytes");
      console.log("MD2 bytes (Uint8Array):", md2Bytes);

      // ---- Reverse (verify) ----
      // The reverse path expects the *expected digest first*, then a source (file/bytes).
      const expected = md5Hex; // usually provided externally
      const textBytes = new TextEncoder().encode("Hello, World!");
      const verify = await md.addReverseAlgorithm(expected, { bytes: textBytes });
      console.log("Verify content against expected:", verify); // { ok: true|false, message }
    </script>
  </body>
</html>
```

---

## Using with `ReverseEngineer` Orchestrator
This class is designed to plug into a `ReverseEngineer` orchestrator. The **forward** method is positional: `(input, algo?, encoding?)`. The **reverse** method is: `(expectedHash, ...args)` where `args` can include a `Blob`/`File`, raw bytes, or helper objects.

```js
import { MessageDigest } from "./algorithms/MessageDigest/MessageDigest.js";
import { ReverseEngineer } from "./ReverseEngineer.js";

const engineer = new ReverseEngineer();
engineer.getInstance();
engineer.add(MessageDigest);

// Forward (hash)
const hex = await engineer.forward(MessageDigest, "Legacy hash me", "MD5", "hex");
const b64 = await engineer.forward(MessageDigest, "Legacy hash me", "MD4", "base64");
const raw = await engineer.forward(MessageDigest, new Uint8Array([1,2,3]), "MD2", "bytes");

// Reverse (verify)
// Provide expected digest and source (bytes / Blob / File / {bytes} / {file})
const expected = hex;
const verify = await engineer.reverse(
  MessageDigest,
  expected,
  { bytes: new TextEncoder().encode("Legacy hash me") }
);
console.log(verify); // { ok: true|false, message }
```

> **Note:** The orchestrator is expected to pass positional arguments directly to the algorithm methods, matching the signatures below.

---

## API Reference

### `addForwardAlgorithm(input, algo?, encoding?)`
Hash the input with the selected Message Digest algorithm.

- **Parameters**
  - `input`: `string | Uint8Array` — UTF‑8 strings are converted to bytes
  - `algo` (optional): `'MD5' | 'MD4' | 'MD2'` (default: `'MD5'`)
  - `encoding` (optional): `'hex' | 'base64' | 'b64' | 'bytes'` (default: `'hex'`)

- **Returns**: `string | Uint8Array` — based on `encoding`

- **Convenience**: You may pass only the output encoding as the second argument:  
  `addForwardAlgorithm(input, 'base64')  // uses default algo MD5`

- **Examples**
  ```js
  const md = new MessageDigest();

  // Hex (default)
  const md5Hex = md.addForwardAlgorithm("abc"); // MD5 + hex

  // Base64
  const md4B64 = md.addForwardAlgorithm("abc", "MD4", "base64");

  // Raw bytes
  const md2Raw = md.addForwardAlgorithm(new Uint8Array([1,2,3]), "MD2", "bytes");
  ```

---

### `addReverseAlgorithm(expectedHash, ...args)`
Verify content (file/bytes) against an expected digest. The method:

1. **Detects the expected digest encoding** (`hex` or `base64`)
2. **Resolves source bytes** from the variadic `args`
3. **If the source is textual**, it tries to find a **plaintext token adjacent to the digest** on the same line (useful for wordlists/logs) and returns the matching plaintext if found
4. **Otherwise**, it hashes the entire content with **MD5/MD4/MD2** (all produce 16‑byte digests) and checks for a match

- **Parameters**
  - `expectedHash`: `string` — digest in **hex** or **base64**
  - `...args`: one of the following to provide the source content:
    - `Uint8Array` or `ArrayBuffer`
    - `Blob`/`File`
    - `{ bytes: Uint8Array | ArrayBuffer }`
    - `{ file: Blob | File }`
    - `{ fileInput: HTMLInputElement | stringSelector }` (browser only)

- **Returns**: `{ ok: boolean, message: string }`  
  - On success (`ok: true`): `message` contains either the **paired plaintext** (if discovered in a text file) _or_ a generic match note like `"[binary/text content matched MD5]"`  
  - On failure: `message` explains why (e.g., no match or no source provided)

- **Examples**
  ```js
  const md = new MessageDigest();

  // Compare known bytes to an expected hex digest
  const expected = md.addForwardAlgorithm("hello", "MD5", "hex");
  const result = await md.addReverseAlgorithm(expected, { bytes: new TextEncoder().encode("hello") });
  // -> { ok: true, message: "[binary/text content matched MD5]" }

  // Verify a File/Blob in the browser
  // const file = input.files[0];
  // const verify = await md.addReverseAlgorithm("<expected>", { file });
  // console.log(verify);
  ```

---

## UI Policy (for GUIs)
`MessageDigest` exposes `static UI_POLICY` used by GUIs like `ReverseEngineerGUI` to provide hints:

```js
static UI_POLICY = {
  requiresInit: false,
  directions: {
    init:    { input: false, args: true,  inputPh: '—', argsPh: 'No init options required', allowFile:false },
    forward: { input: true,  args: true,  inputPh: 'Plaintext to hash (UTF‑8)', argsPh: 'algo, encoding  (e.g.  MD5, hex  |  MD4, base64  |  MD2, bytes)', allowFile:false },
    reverse: { input: true,  args: false, inputPh: 'Expected digest (hex/base64)', argsPh: '—', allowFile:true }
  }
};
```

> For **forward**, enter plaintext and optional `algo, encoding`.
> For **reverse**, enter the expected digest and supply a file/bytes via the GUI.

---

## Encoding & Utilities
- **Hex**: lower‑case hex string for the 16‑byte digest (32 hex chars)
- **Base64**: `btoa` in browsers, `Buffer.from(...).toString('base64')` in Node
- **Bytes**: `Uint8Array(16)`

The module includes a small UTF‑8 encoder fallback if `TextEncoder` is not available.

---

## Common Pitfalls
- **Not secure**: These digests are collision‑prone; avoid for integrity‑critical uses
- **Encoding mismatch**: Ensure the expected digest encoding (**hex** vs **base64**) matches your comparison
- **Algo autodetect on verify**: MD2/MD4/MD5 all output 16 bytes; when verifying, the implementation tries **all three**
- **Case**: Hex comparisons are case‑insensitive; base64 is case‑sensitive

---

## Version
**MessageDigest v1.1.1** — “Message Digest (MD2/MD4/MD5) — legacy hashing for testing/compatibility.”

---

## License
This module may be used under the terms of your project's license. If none is specified, consider adding an OSS license (e.g., MIT) to clarify usage.