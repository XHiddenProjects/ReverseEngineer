# ROT13 Usage

Use the **Rot13** algorithm directly in the browser with native ES Modules.

---

## ✅ Requirements
- A modern browser (ES Modules support).
- Serve files over **HTTP(S)** (not `file://`) so module imports work consistently.
- Your project should include:
  - `./algorithms/Rot13/Rot13.js`
  - `./algorithms/CaesarCipher/CaesarCipher.js` (Rot13 depends on this)
  - `./ReverseEngineer.js`

> **Note:** Ensure there are **no extra spaces** in your import paths (e.g., `Rot13 .js` will fail). Also verify the **CaesarCipher** path matches what `Rot13.js` imports.

---

## 📁 Recommended Project Structure
```
/your-project
  /algorithms
    /CaesarCipher
      CaesarCipher.js
    /Rot13
      Rot13.js
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
    <title>ROT13 Demo (Browser)</title>
  </head>
  <body>
    <h1>ROT13 Demo (Browser)</h1>

    <script type="module">
      import { Rot13 } from "./algorithms/Rot13/Rot13.js";
      import { ReverseEngineer } from "./ReverseEngineer.js";

      const engineer = new ReverseEngineer();
      engineer.getInstance();
      engineer.add(Rot13);

      // No initialization parameters required
      engineer.init(Rot13);

      // ✅ Encode
      const encoded = engineer.forward(Rot13, "Hello, World!");
      console.log("ROT13 Encoded:", encoded); // Uryyb, Jbeyq!

      // ✅ Decode (ROT13 is its own inverse)
      const decoded = engineer.reverse(Rot13, encoded);
      console.log("ROT13 Decoded:", decoded); // Hello, World!

      // Another example
      console.log(engineer.forward(Rot13, "Attack at dawn")); // Nggnpx ng qnja
      console.log(engineer.reverse(Rot13, "Nggnpx ng qnja")); // Attack at dawn
    </script>

    <!-- Alternative: Use the class directly (without the manager) -->
    <!--
    <script type="module">
      import { Rot13 } from "./algorithms/Rot13/Rot13.js";

      const rot = new Rot13();
      rot.init(); // logs that Rot13 initialized

      const encoded = rot.addForwardAlgorithm("Hello, World!");
      const decoded = rot.addReverseAlgorithm(encoded);

      console.log({ encoded, decoded });
    </script>
    -->
  </body>
</html>
```

---

## 🔎 About the Algorithm
- **What it is**: ROT13 is a Caesar cipher with a fixed shift of **13** over the English alphabet. Applying ROT13 **twice** returns the original text.
- **Behavior**: Letters `A–Z`/`a–z` are rotated by 13 positions; **non‑letters are preserved**; **case is preserved**.
- **Dependency**: This implementation delegates to the `CaesarCipher` class with a shift of `13`.

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
- `engineer.add(Rot13)` → registers the algorithm.
- `engineer.init(Rot13)` → no parameters required.
- `engineer.forward(Rot13, text)` → returns ROT13‑encoded string.
- `engineer.reverse(Rot13, text)` → returns decoded string (same as encoding again).

---

## ⚠️ Common Pitfalls & Fixes
- **Missing dependency** → Ensure `./algorithms/CaesarCipher/CaesarCipher.js` exists and the import path in `Rot13.js` is correct.
- **Input type** → Pass a **string**. If you have bytes (`Uint8Array`), convert to/from string explicitly using `TextEncoder`/`TextDecoder` before/after calling ROT13.
- **Non‑English alphabets** → Only `A–Z`/`a–z` are rotated. Characters with diacritics or from other scripts are left unchanged.

---

## 🧪 String/Bytes Helpers
```js
const enc = new TextEncoder();
const dec = new TextDecoder();
const bytes = enc.encode("Hello, World!");
const text  = dec.decode(bytes);
```

---

## ✅ Summary
- Pure browser usage with native ES Modules.
- Symmetric transform: encode = decode.
- Depends on `CaesarCipher` internally; keep both files available with correct paths.