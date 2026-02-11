# Base32 Usage

Use the **Base32** algorithm directly in the browser with native ES Modules.

---

## ✅ Requirements
- A modern browser (ES Modules support).
- Serve files over **HTTP(S)** (not `file://`) so module imports work consistently.
- Your project should include:
  - `./algorithms/Base32/Base32.js`
  - `./ReverseEngineer.js`

> **Note:** Ensure there are **no extra spaces** in your import paths. For example, `Base32 .js` (with a space) will fail.

---

## 📁 Recommended Project Structure
```
/your-project
  /algorithms
    /Base32
      Base32.js
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
    <title>Base32 Demo (Browser)</title>
  </head>
  <body>
    <h1>Base32 Demo (Browser)</h1>

    <script type="module">
      import { Base32 } from "./algorithms/Base32/Base32.js";
      import { ReverseEngineer } from "./ReverseEngineer.js";

      const engineer = new ReverseEngineer();
      engineer.getInstance();
      engineer.add(Base32);

      // Base32 does not require initialization parameters
      engineer.init(Base32);

      // ✅ Encode
      // sanitize=true  → removes padding "=", strips whitespace, lowercases by default
      const encoded = engineer.forward(Base32, "Hello, World!", true, { lower: true });
      console.log("Base32 Encoded:", encoded);

      // ✅ Decode
      // isSanitized=true → normalizes common substitutions (0->O, 1/L->I) and removes -/_ if present
      const decoded = engineer.reverse(Base32, encoded, true);
      console.log("Base32 Decoded:", decoded);
    </script>

    <!-- Alternative: Use the class directly (without the manager) -->
    <!--
    <script type="module">
      import { Base32 } from "./algorithms/Base32/Base32.js";

      const base32 = new Base32();
      base32.init(); // logs that Base32 loaded

      const encoded = base32.addForwardAlgorithm("Hello, World!", true, { lower: true });
      const decoded = base32.addReverseAlgorithm(encoded, true);

      console.log("Base32 Encoded:", encoded);
      console.log("Base32 Decoded:", decoded);
    </script>
    -->
  </body>
</html>
```

---

## 🔎 About the Algorithm
- **Alphabet**: RFC 4648 Base32 alphabet `A–Z` + `2–7`.
- **Padding**: Encoded output is padded with `=` to a multiple of 8 characters (if not sanitized).
- **Sanitize option (encode)**: `sanitize=true` removes `=`, removes whitespace, and lowercases by default (configurable via `{ lower: true/false }`).
- **Sanitized decode**: With `isSanitized=true`, common substitutions are normalized: `0→O`, `1/L→I`, and separators `-`/`_` are removed.
- **Errors**: Decoding throws an error if an invalid character is encountered.

---

## 🌐 Serve Over HTTP(S)
Use any simple static server, for example with Python:

```bash
# From the project root
python3 -m http.server 8080
# Then open http://localhost:8080 in your browser
```

> Unlike algorithms that use Web Crypto, Base32 does **not** require a secure context, but serving over HTTP(S) avoids module import issues.

---

## 🧪 Text/Binary Encoding Helpers
The implementation uses `TextEncoder`/`TextDecoder` internally. If you need them elsewhere:
```js
const enc = new TextEncoder();
const dec = new TextDecoder();
const bytes = enc.encode("Hello, World!");
const text = dec.decode(bytes);
```

---

## 🧩 API Quick Reference
- `engineer.add(Base32)` → registers the algorithm.
- `engineer.init(Base32)` → optional for Base32 (no params required).
- `engineer.forward(Base32, message, sanitize?, sanitizeOptions?)` → returns Base32 string.
  - `sanitizeOptions`: `{ lower: true }` by default.
- `engineer.reverse(Base32, base32, isSanitized?)` → returns decoded string.

---

## ⚠️ Common Pitfalls & Fixes
- **Import path spaces**
  ```js
  // ❌ Wrong
  import { Base32 } from "./algorithms/Base32/Base32 .js";
  // ✅ Correct
  import { Base32 } from "./algorithms/Base32/Base32.js";
  ```
- **Module import errors** → Serve via an HTTP server so the browser sets proper MIME types for `.js` files.
- **Decode errors** → Ensure your input uses the RFC 4648 alphabet (`A–Z`, `2–7`) or enable `isSanitized=true` for normalized inputs.

---

## ✅ Summary
- Pure browser usage with native ES Modules.
- No initialization parameters required for Base32.
- Use the manager or instantiate the class directly.