# Base64 Usage

Use the **Base64** algorithm directly in the browser with native ES Modules.

---

## ✅ Requirements
- A modern browser (ES Modules support).
- Serve files over **HTTP(S)** (not `file://`) so module imports work consistently.
- Your project should include:
  - `./algorithms/Base64/Base64.js`
  - `./ReverseEngineer.js`

> **Note:** Ensure there are **no extra spaces** in your import paths. For example, `Base64 .js` (with a space) will fail.

---

## 📁 Recommended Project Structure
```
/your-project
  /algorithms
    /Base64
      Base64.js
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
    <title>Base64 Demo (Browser)</title>
  </head>
  <body>
    <h1>Base64 Demo (Browser)</h1>

    <script type="module">
      import { Base64 } from "./algorithms/Base64/Base64.js";
      import { ReverseEngineer } from "./ReverseEngineer.js";

      const engineer = new ReverseEngineer();
      engineer.getInstance();
      engineer.add(Base64);

      // Base64 does not require initialization parameters
      engineer.init(Base64);

      // ✅ Encode (standard Base64)
      const encoded = engineer.forward(Base64, "Hello, World!", /* sanitize */ false);
      console.log("Base64 Encoded:", encoded);

      // ✅ Encode (URL-safe, sanitized: no padding, no whitespace, optional lowercase)
      const encodedUrlSafe = engineer.forward(
        Base64,
        "Hello, World!",
        /* sanitize */ true,
        { lower: false, urlSafe: true }
      );
      console.log("Base64URL Encoded (sanitized):", encodedUrlSafe);

      // ✅ Decode (standard Base64)
      const decoded = engineer.reverse(Base64, encoded);
      console.log("Base64 Decoded:", decoded);

      // ✅ Decode (sanitized Base64URL)
      const decodedUrlSafe = engineer.reverse(
        Base64,
        encodedUrlSafe,
        /* isSanitized */ true,
        { urlSafe: true }
      );
      console.log("Base64URL Decoded:", decodedUrlSafe);
    </script>

    <!-- Alternative: Use the class directly (without the manager) -->
    <!--
    <script type="module">
      import { Base64 } from "./algorithms/Base64/Base64.js";

      const base64 = new Base64();
      base64.init(); // logs that Base64 loaded

      // Standard Base64
      const encoded = base64.addForwardAlgorithm("Hello, World!");

      // URL-safe & sanitized
      const encodedUrlSafe = base64.addForwardAlgorithm("Hello, World!", true, {
        lower: false,
        urlSafe: true,
      });

      const decoded = base64.addReverseAlgorithm(encoded);
      const decodedUrlSafe = base64.addReverseAlgorithm(encodedUrlSafe, true, { urlSafe: true });

      console.log({ encoded, encodedUrlSafe, decoded, decodedUrlSafe });
    </script>
    -->
  </body>
</html>
```

---

## 🔎 About the Algorithm
- **Standard vs. URL-safe**: URL-safe Base64 replaces `+` with `-` and `/` with `_`, and often omits padding `=`.
- **Sanitize option (encode)**: `sanitize=true` removes whitespace, strips `=`, optionally lowercases (`lower`), and optionally converts to URL-safe (`urlSafe`).
- **Sanitized decode**: With `isSanitized=true`, common URL-safe characters are normalized back to `+` and `/`, and missing padding is restored before decoding.
- **Unicode handling**: The implementation encodes the message to UTF‑8 bytes before Base64 and decodes bytes back to a string, avoiding issues with `btoa/atob` on non‑ASCII characters.

---

## 🌐 Serve Over HTTP(S)
Use any simple static server, for example with Python:

```bash
# From the project root
python3 -m http.server 8080
# Then open http://localhost:8080 in your browser
```

---

## 🧪 Text/Binary Helpers
If you need to work with bytes yourself:
```js
const enc = new TextEncoder();
const dec = new TextDecoder();
const bytes = enc.encode("Hello, 世界");
const text = dec.decode(bytes);
```

---

## 🧩 API Quick Reference
- `engineer.add(Base64)` → registers the algorithm.
- `engineer.init(Base64)` → optional for Base64 (no params required).
- `engineer.forward(Base64, message, sanitize?, sanitizeOptions?)` → returns Base64 string.
  - `sanitizeOptions`: `{ lower: false, urlSafe: false }` by default.
- `engineer.reverse(Base64, base64, isSanitized?, decodeOptions?)` → returns decoded string.
  - `decodeOptions`: `{ urlSafe: true }` by default.

---

## ⚠️ Common Pitfalls & Fixes
- **Import path spaces**
  ```js
  // ❌ Wrong
  import { Base64 } from "./algorithms/Base64/Base64 .js";
  // ✅ Correct
  import { Base64 } from "./algorithms/Base64/Base64.js";
  ```
- **Missing padding** → Enable `isSanitized=true` during decode; the implementation reapplies padding automatically.
- **URL-safe vs. standard** → Use `sanitizeOptions.urlSafe` when encoding and `decodeOptions.urlSafe` when decoding sanitized input.
- **Unicode errors with raw `btoa/atob`** → This implementation uses `TextEncoder/Decoder` to properly handle Unicode.

---

## ✅ Summary
- Pure browser usage with native ES Modules.
- Supports both standard Base64 and Base64URL variants.
- Use the manager or instantiate the class directly.