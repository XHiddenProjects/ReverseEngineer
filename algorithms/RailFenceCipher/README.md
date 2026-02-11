# Rail Fence Cipher Usage

Use the **RailFenceCipher** algorithm directly in the browser with native ES Modules.

---

## ✅ Requirements
- A modern browser (ES Modules support).
- Serve files over **HTTP(S)** (not `file://`) so module imports work consistently.
- Your project should include:
  - `./algorithms/RailFenceCipher/RailFenceCipher.js`
  - `./ReverseEngineer.js`

> **Note:** Ensure there are **no extra spaces** in your import paths (e.g., `RailFenceCipher .js` will fail).

---

## 📁 Recommended Project Structure
```
/your-project
  /algorithms
    /RailFenceCipher
      RailFenceCipher.js
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
    <title>Rail Fence Cipher Demo (Browser)</title>
  </head>
  <body>
    <h1>Rail Fence Cipher Demo (Browser)</h1>

    <script type="module">
      import { RailFenceCipher } from "./algorithms/RailFenceCipher/RailFenceCipher.js";
      import { ReverseEngineer } from "./ReverseEngineer.js";

      const engineer = new ReverseEngineer();
      engineer.getInstance();
      engineer.add(RailFenceCipher);

      // No initialization parameters required
      engineer.init(RailFenceCipher);

      // ✅ Encode (rails=3)
      const plaintext = "WE ARE DISCOVERED RUN AT ONCE";
      const encoded = engineer.forward(RailFenceCipher, plaintext, 3);
      console.log("Encoded (rails=3):", encoded);

      // ✅ Decode
      const decoded = engineer.reverse(RailFenceCipher, encoded, 3);
      console.log("Decoded:", decoded);

      // ✅ Compare with letters-only input (spaces preserved by this implementation)
      const lettersOnly = "WEAREDISCOVEREDRUNATONCE";
      console.log("Letters-only ->", engineer.forward(RailFenceCipher, lettersOnly, 3));

      // ✅ Different rail counts
      console.log("rails=2:", engineer.forward(RailFenceCipher, "HELLO WORLD", 2));
      console.log("rails=4:", engineer.forward(RailFenceCipher, "HELLO WORLD", 4));
    </script>

    <!-- Alternative: Use the class directly (without the manager) -->
    <!--
    <script type="module">
      import { RailFenceCipher } from "./algorithms/RailFenceCipher/RailFenceCipher.js";

      const rail = new RailFenceCipher();
      rail.init(); // logs that the algorithm loaded

      const cipher = rail.addForwardAlgorithm("WE ARE DISCOVERED RUN AT ONCE", 3);
      const plain  = rail.addReverseAlgorithm(cipher, 3);

      console.log({ cipher, plain });
    </script>
    -->
  </body>
</html>
```

---

## 🔎 About the Algorithm
- **What it is**: The Rail Fence cipher writes characters in a zig‑zag across a fixed number of **rails** (rows), then reads row by row to produce the ciphertext.
- **Encoding (forward)**: Characters are distributed down and up the rails (changing direction at the top and bottom). The output is the concatenation of each rail.
- **Decoding (reverse)**: Reconstructs the zig‑zag positions, fills them row by row with the ciphertext, then reads the path to recover the original text.
- **Characters**: This implementation preserves **spaces and punctuation** and maintains the **original case**.

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
- `engineer.add(RailFenceCipher)` → registers the algorithm.
- `engineer.init(RailFenceCipher)` → no parameters required.
- `engineer.forward(RailFenceCipher, text, rails=3)` → returns encoded string.
- `engineer.reverse(RailFenceCipher, cipher, rails=3)` → returns decoded string.

---

## ⚠️ Common Pitfalls & Fixes
- **Rails value** → `rails` must be an integer **≥ 2**. Values < 2 will throw an error.
- **Short text with many rails** → If `rails` ≥ `text.length`, the zig‑zag collapses to (effectively) the original string.
- **Whitespace & punctuation** → Preserved as input; if you want a letters‑only variant, pre‑filter your text.
- **Performance** → Both directions are `O(n)` with additional memory proportional to `rails × text.length` for decoding.

---

## ✅ Summary
- Pure browser usage with native ES Modules.
- Zig‑zag (rail fence) transposition with configurable rail count.
- Preserves spaces and punctuation; case‑sensitive.