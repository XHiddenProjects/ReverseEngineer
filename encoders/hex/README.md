# Hex (Hexadecimal) Usage

Use the **Hex** algorithm directly in the browser with native ES Modules.

---

## ✅ Requirements
- A modern browser (ES Modules support).
- Serve files over **HTTP(S)** (not `file://`) so module imports work consistently.
- Your project should include:
  - `./algorithms/Hex/Hex.js`
  - `./ReverseEngineer.js`

> **Note:** Ensure there are **no extra spaces** in your import paths (e.g., `Hex .js` will fail).

---

## 📁 Recommended Project Structure
```
/your-project
  /algorithms
    /Hex
      Hex.js
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
    <title>Hex Demo (Browser)</title>
  </head>
  <body>
    <h1>Hex Demo (Browser)</h1>

    <script type="module">
      import { Hex } from "./algorithms/Hex/Hex.js";
      import { ReverseEngineer } from "./ReverseEngineer.js";

      const engineer = new ReverseEngineer();
      engineer.getInstance();
      engineer.add(Hex);

      // No initialization parameters required
      engineer.init(Hex);

      // ✅ Encode to lowercase hexadecimal (2 hex chars per code unit)
      const encoded = engineer.forward(Hex, "Hello, World!");
      console.log("Hex Encoded:", encoded); // 48656c6c6f2c20576f726c6421

      // ✅ Decode back to a string
      const decoded = engineer.reverse(Hex, encoded);
      console.log("Hex Decoded:", decoded); // Hello, World!
    </script>

    <!-- Alternative: Use the class directly (without the manager) -->
    <!--
    <script type="module">
      import { Hex } from "./algorithms/Hex/Hex.js";

      const hex = new Hex();
      hex.init(); // logs that the algorithm loaded

      const encoded = hex.addForwardAlgorithm("Hello, World!");
      const decoded = hex.addReverseAlgorithm(encoded);

      console.log({ encoded, decoded });
    </script>
    -->
  </body>
</html>
```

---

## 🔎 About the Algorithm
- **Encoding**: For each JavaScript string **code unit** (`charCodeAt`), produce a 2‑digit lowercase hexadecimal byte via `toString(16)` and left‑pad to 2 chars.
- **Decoding**: Read the input two hex characters at a time, parse as a byte, and convert back with `String.fromCharCode`.
- **Character model**: JavaScript strings are UTF‑16. Characters outside the Basic Multilingual Plane (BMP) are represented as **surrogate pairs** (two code units). This encoder/decoder operates on **code units**, so surrogate pairs are preserved round‑trip but appear as two bytes per code unit (4 bytes per astral character).

---

## 🌐 Serve Over HTTP(S)
Use any simple static server, for example with Python:

```bash
# From the project root
python3 -m http.server 8080
# Then open http://localhost:8080 in your browser
```

---

## 🧩 API Quick Reference
- `engineer.add(Hex)` → registers the algorithm.
- `engineer.init(Hex)` → no parameters required.
- `engineer.forward(Hex, message)` → returns lowercase hex string.
- `engineer.reverse(Hex, hexString)` → returns decoded string.

---

## ⚠️ Common Pitfalls & Fixes
- **Odd length input** → Hex strings should have an even length. The decoder reads two characters per byte; if your input length is odd, validate or pad accordingly before decoding.
- **Non‑hex characters** → Input must only contain `[0-9a-fA-F]`. The current implementation does not validate characters; invalid hex will throw or produce unexpected results.
- **Case** → Encoding outputs **lowercase** hex; decoding is case‑insensitive.
- **Binary data vs. text** → This implementation converts to/from JavaScript **strings**. For arbitrary binary data, consider using `Uint8Array` and your own conversion layer (outside the scope of this class).

---

## ✅ Summary
- Pure browser usage with native ES Modules.
- Simple hex encode/decode operating on UTF‑16 code units.
- Use the manager or instantiate the class directly.