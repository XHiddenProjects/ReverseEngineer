# AES‑GCM Usage

Use the **AESGCM** algorithm directly in the browser with native ES Modules and the Web Crypto API.

---

## ✅ Requirements
- A modern browser with `window.crypto.subtle` (Web Crypto API) support.
- Serve files over **HTTP(S)** (not `file://`). Use a simple local server during development.
- Your project should include:
  - `./algorithms/AESGCM/AESGCM.js`
  - `./ReverseEngineer.js` (exports both `ReverseEngineer` and `CryptoUtils`)

> **Note:** Ensure there are **no extra spaces** in your import paths. For example, `AESGCM .js` (with a space) will fail.

---

## 📁 Recommended Project Structure
```
/your-project
  /algorithms
    /AESGCM
      AESGCM.js
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
    <title>AES-GCM Demo (Browser)</title>
  </head>
  <body>
    <h1>AES-GCM Demo (Browser)</h1>

    <script type="module">
      import { AESGCM } from "./algorithms/AESGCM/AESGCM.js";
      import { ReverseEngineer, CryptoUtils } from "./ReverseEngineer.js";

      // If your target browsers support top-level await, you can keep this as-is.
      // Otherwise, use the IIFE fallback shown below.
      const engineer = new ReverseEngineer();
      engineer.getInstance();
      engineer.add(AESGCM);

      // 32 bytes => AES-256 key; value is Base64-encoded
      const keyB64 = CryptoUtils.generateB64Key(32);

      // Initialize the stored AESGCM instance with the Base64 key
      await engineer.init(AESGCM, { keyB64 });

      // ✅ Encrypt
      const encrypted = await engineer.forward(AESGCM, "Hello, World!", "optional-aad");
      console.log("Encrypted:", encrypted);

      // ✅ Decrypt
      const decrypted = await engineer.reverse(AESGCM, encrypted, "optional-aad");
      console.log("Decrypted:", decrypted);
    </script>

    <!-- Fallback if you need to support browsers without top-level await:
    <script type="module">
      import { AESGCM } from "./algorithms/AESGCM/AESGCM.js";
      import { ReverseEngineer, CryptoUtils } from "./ReverseEngineer.js";

      (async () => {
        const engineer = new ReverseEngineer();
        engineer.getInstance();
        engineer.add(AESGCM);

        const keyB64 = CryptoUtils.generateB64Key(32);
        await engineer.init(AESGCM, { keyB64 });

        const encrypted = await engineer.forward(AESGCM, "Hello, World!", "optional-aad");
        console.log("Encrypted:", encrypted);

        const decrypted = await engineer.reverse(AESGCM, encrypted, "optional-aad");
        console.log("Decrypted:", decrypted);
      })();
    </script>
    -->
  </body>
</html>
```

---

## 🌐 Serve Over HTTP(S)
Running from `file://` will cause module and crypto errors. Use any simple static server, for example with Python:

```bash
# From the project root
python3 -m http.server 8080
# Then open http://localhost:8080 in your browser
```

---

## 🔐 Keys, AAD, and IVs
- **Key size**: `CryptoUtils.generateB64Key(32)` returns a Base64-encoded 32-byte key (AES‑256). Use 16 (AES‑128) or 24 (AES‑192) if needed.
- **AAD** (Additional Authenticated Data) is optional but must match on encrypt/decrypt if provided.
- **IV/Nonce**: `AESGCM` typically uses a random 12‑byte IV. The helper methods (`forward`/`reverse`) handle IV and tag packaging; check implementation details if you need a custom format.

---

## 🧩 API Quick Reference
- `new ReverseEngineer()` → `engineer.getInstance()`
- `engineer.add(AESGCM)` → registers the algorithm
- `CryptoUtils.generateB64Key(lengthBytes)` → Base64 random key
- `engineer.init(AESGCM, { keyB64 })` → imports key into Web Crypto
- `engineer.forward(AESGCM, plaintext, aad?)` → returns encrypted payload
- `engineer.reverse(AESGCM, encrypted, aad?)` → returns decrypted plaintext

---

## 🧪 Text/Binary Encoding Helpers
Use standard Web APIs when you need explicit bytes:
```js
const enc = new TextEncoder();
const dec = new TextDecoder();
const bytes = enc.encode("Hello, World!");
const text = dec.decode(bytes);
```

---

## ⚠️ Common Pitfalls & Fixes
- **Import path spaces**
  ```js
  // ❌ Wrong
  import { AESGCM } from "./algorithms/AESGCM/AESGCM .js";
  // ✅ Correct
  import { AESGCM } from "./algorithms/AESGCM/AESGCM.js";
  ```
- **`crypto.subtle` is undefined** → You’re not in a secure context. Use HTTPS or `http://localhost`.
- **MIME/CORS errors for modules** → Serve via an HTTP server so the browser sets `Content-Type: application/javascript` for `.js` files.
- **`SyntaxError: Cannot use 'import' outside a module`** → Ensure `<script type="module">` is set.

---

## ✅ Summary
- Pure browser usage with native ES Modules and the Web Crypto API.
- Serve files over HTTP(S), fix import paths, and you’re good to go.