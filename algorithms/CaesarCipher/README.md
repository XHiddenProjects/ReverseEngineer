# Caesar Cipher Usage

Use the **CaesarCipher** algorithm directly in the browser with native ES Modules.

---

## ✅ Requirements
- A modern browser (ES Modules support).
- Serve files over **HTTP(S)** (not `file://`) so module imports work consistently.
- Your project should include:
  - `./algorithms/CaesarCipher/CaesarCipher.js`
  - `./ReverseEngineer.js`

> **Note:** Ensure there are **no extra spaces** in your import paths (e.g., `CaesarCipher .js` will fail).

---

## 📁 Recommended Project Structure
```
/your-project
  /algorithms
    /CaesarCipher
      CaesarCipher.js
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
    <title>Caesar Cipher Demo (Browser)</title>
  </head>
  <body>
    <h1>Caesar Cipher Demo (Browser)</h1>

    <script type="module">
      import { CaesarCipher } from "./algorithms/CaesarCipher/CaesarCipher.js";
      import { ReverseEngineer } from "./ReverseEngineer.js";

      const engineer = new ReverseEngineer();
      engineer.getInstance();
      engineer.add(CaesarCipher);

      // No initialization parameters required
      engineer.init(CaesarCipher);

      // ✅ Encode with default alphabet (A–Z) and shift of 3
      const encoded = engineer.forward(CaesarCipher, "Hello, World!", 3);
      console.log("Encoded (shift=3):", encoded); // Khoor, Zruog!

      // ✅ Decode with the same shift
      const decoded = engineer.reverse(CaesarCipher, encoded, 3);
      console.log("Decoded:", decoded); // Hello, World!

      // ✅ Custom alphabet (includes space and punctuation if you want to rotate them too)
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // default
      const encoded13 = engineer.forward(CaesarCipher, "Attack at Dawn", 13, alphabet);
      console.log("ROT13:", encoded13);
      console.log("ROT13 back:", engineer.reverse(CaesarCipher, encoded13, 13, alphabet));

      // ✅ Lowercase preserved; non-alphabet characters pass through unchanged
      console.log(engineer.forward(CaesarCipher, "abc-XYZ", 2)); // cde-ZAB
    </script>

    <!-- Alternative: Use the class directly (without the manager) -->
    <!--
    <script type="module">
      import { CaesarCipher } from "./algorithms/CaesarCipher/CaesarCipher.js";

      const caesar = new CaesarCipher();
      caesar.init(); // logs that the algorithm loaded

      const encoded = caesar.addForwardAlgorithm("Hello, World!", 3);
      const decoded = caesar.addReverseAlgorithm(encoded, 3);

      console.log({ encoded, decoded });
    </script>
    -->
  </body>
</html>
```

---

## 🔎 About the Algorithm
- **What it is**: A classic substitution cipher that shifts letters by a fixed number of positions within a defined `characters` set.
- **Default alphabet**: `A–Z`. The implementation preserves the **case** of letters and **passes through** characters not found in the alphabet (e.g., spaces, punctuation).
- **Custom alphabets**: You can supply a custom `characters` string to define the rotation set (e.g., include digits or symbols if you want them rotated).

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
- `engineer.add(CaesarCipher)` → registers the algorithm.
- `engineer.init(CaesarCipher)` → no parameters required.
- `engineer.forward(CaesarCipher, message, shifts=1, characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ')` → returns encoded string.
- `engineer.reverse(CaesarCipher, encoded, shifts=1, characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ')` → returns decoded string.

---

## ⚠️ Common Pitfalls & Fixes
- **Missing message** → A message is required for both encode/decode.
- **Shift type** → `shifts` must be a number (integer recommended).
- **Shift range** → Use **non‑negative** shifts and keep them within `0..characters.length-1`. If you need negative shifts, normalize them before passing: `((shifts % n) + n) % n` where `n = characters.length`.
- **Custom characters** → Ensure `characters` contains every symbol you intend to rotate. Symbols not in `characters` are left unchanged.

---

## ✅ Summary
- Pure browser usage with native ES Modules.
- Preserves letter case; leaves non‑alphabet characters unchanged by default.
- Supports custom alphabets and arbitrary shift values.