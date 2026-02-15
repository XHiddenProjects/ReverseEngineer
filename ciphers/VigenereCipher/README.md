# Vigenère Cipher Usage

Use the **VigenereCipher** algorithm directly in the browser with native ES Modules.

---

## ✅ Requirements
- A modern browser (ES Modules support).
- Serve files over **HTTP(S)** (not `file://`) so module imports work consistently.
- Your project should include:
  - `./algorithms/VigenereCipher/VigenereCipher.js`
  - `./ReverseEngineer.js`

> **Note:** Ensure there are **no extra spaces** in your import paths (e.g., `VigenereCipher .js` will fail).

---

## 📁 Recommended Project Structure
```
/your-project
  /algorithms
    /VigenereCipher
      VigenereCipher.js
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
    <title>Vigenère Cipher Demo (Browser)</title>
  </head>
  <body>
    <h1>Vigenère Cipher Demo (Browser)</h1>

    <script type="module">
      import { VigenereCipher } from "./algorithms/VigenereCipher/VigenereCipher.js";
      import { ReverseEngineer } from "./ReverseEngineer.js";

      const engineer = new ReverseEngineer();
      engineer.getInstance();
      engineer.add(VigenereCipher);

      // No initialization parameters required
      engineer.init(VigenereCipher);

      // ✅ Encode with default alphabet (A–Z) and key "LEMON"
      const plaintext = "ATTACKATDAWN";
      const key = "LEMON";
      const encoded = engineer.forward(VigenereCipher, plaintext, key);
      console.log("Encoded:", encoded); // LXFOPVEFRNHR

      // ✅ Decode back with the same key
      const decoded = engineer.reverse(VigenereCipher, encoded, key);
      console.log("Decoded:", decoded); // ATTACKATDAWN

      // ✅ Case and punctuation preserved; key advances only on alphabet letters
      const msg = "Attack at dawn!";
      const enc2 = engineer.forward(VigenereCipher, msg, key);
      const dec2 = engineer.reverse(VigenereCipher, enc2, key);
      console.log({ enc2, dec2 });

      // ✅ Custom alphabet (e.g., include digits)
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; // base-36 alphabet
      const enc3 = engineer.forward(VigenereCipher, "HELLO-2026", "KEY9", alphabet);
      const dec3 = engineer.reverse(VigenereCipher, enc3, "KEY9", alphabet);
      console.log({ enc3, dec3 });
    </script>

    <!-- Alternative: Use the class directly (without the manager) -->
    <!--
    <script type="module">
      import { VigenereCipher } from "./algorithms/VigenereCipher/VigenereCipher.js";

      const vig = new VigenereCipher();
      vig.init(); // logs that the algorithm loaded

      const encoded = vig.addForwardAlgorithm("ATTACKATDAWN", "LEMON");
      const decoded = vig.addReverseAlgorithm(encoded, "LEMON");

      console.log({ encoded, decoded });
    </script>
    -->
  </body>
</html>
```

---

## 🔎 About the Algorithm
- **What it is**: A polyalphabetic substitution cipher that uses a **repeating key** to determine the shift for each character.
- **Default alphabet**: `A–Z`. The implementation preserves **case** and **passes through** characters not found in the alphabet (spaces, punctuation, etc.). The key index advances **only when a plaintext/ciphertext character is in the alphabet**.
- **Key handling**: Key characters are uppercased internally. Each key character **must exist in the chosen alphabet**; otherwise an error is thrown.
- **Classic example**: `ATTACKATDAWN` with key `LEMON` → `LXFOPVEFRNHR`.

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
- `engineer.add(VigenereCipher)` → registers the algorithm.
- `engineer.init(VigenereCipher)` → no parameters required.
- `engineer.forward(VigenereCipher, message, key, characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ')` → returns encoded string.
- `engineer.reverse(VigenereCipher, encoded, key, characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ')` → returns decoded string.

---

## ⚠️ Common Pitfalls & Fixes
- **Missing inputs** → Both `message` and `key` are required.
- **Invalid key characters** → Every character of `key` must be present in `characters`. The implementation will throw if not.
- **Mixed alphabets** → `characters` defines the set rotated for both message and key. If you need digits or symbols to participate, include them in `characters`.
- **Key advancement** → The key index increments **only** for characters that are present in `characters`. Non‑alphabet characters in the message are copied as‑is and do **not** advance the key.

---

## ✅ Summary
- Pure browser usage with native ES Modules.
- Preserves case; non‑alphabet characters pass through.
- Key repeats over alphabet characters; supports custom alphabets.