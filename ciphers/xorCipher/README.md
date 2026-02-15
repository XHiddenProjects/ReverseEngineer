# XOR Cipher Usage

Use the **XOR** algorithm directly in the browser with native ES Modules.

---

## ✅ Requirements
- A modern browser (ES Modules support).
- Serve files over **HTTP(S)** (not `file://`) so module imports work consistently.
- Your project should include:
  - `./algorithms/XOR/XOR.js`
  - `./ReverseEngineer.js`

> **Note:** Ensure there are **no extra spaces** in your import paths (e.g., `XOR .js` will fail).

---

## 📁 Recommended Project Structure
```
/your-project
  /algorithms
    /XOR
      XOR.js
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
    <title>XOR Cipher Demo (Browser)</title>
  </head>
  <body>
    <h1>XOR Cipher Demo (Browser)</h1>

    <script type="module">
      import { XOR } from "./algorithms/XOR/XOR.js";
      import { ReverseEngineer } from "./ReverseEngineer.js";

      const engineer = new ReverseEngineer();
      engineer.getInstance();
      engineer.add(XOR);

      // No initialization parameters required
      engineer.init(XOR);

      const message = "Hello, World!";
      const key = "KEY";

      // ✅ Encode → text (default)
      const encText = engineer.forward(XOR, message, key, /* returnAs */ 'text');
      console.log("XOR Encoded (text):", encText);

      // ✅ Encode → hex
      const encHex = engineer.forward(XOR, message, key, 'hex');
      console.log("XOR Encoded (hex):", encHex);

      // ✅ Encode → binary (8 bits per char)
      const encBin = engineer.forward(XOR, message, key, 'binary');
      console.log("XOR Encoded (binary):", encBin);

      // ✅ Decode from text
      const decFromText = engineer.reverse(XOR, encText, key, /* inputAs */ 'text');
      console.log("Decoded from text:", decFromText);

      // ✅ Decode from hex
      const decFromHex = engineer.reverse(XOR, encHex, key, 'hex');
      console.log("Decoded from hex:", decFromHex);

      // ✅ Decode from binary
      const decFromBin = engineer.reverse(XOR, encBin, key, 'binary');
      console.log("Decoded from binary:", decFromBin);
    </script>

    <!-- Alternative: Use the class directly (without the manager) -->
    <!--
    <script type="module">
      import { XOR } from "./algorithms/XOR/XOR.js";

      const xor = new XOR();
      xor.init(); // logs that the algorithm loaded

      const msg = "Hello, World!";
      const key = "KEY";

      const hex = xor.addForwardAlgorithm(msg, key, 'hex');
      const back = xor.addReverseAlgorithm(hex, key, 'hex');
      console.log({ hex, back });
    </script>
    -->
  </body>
</html>
```

---

## 🔎 About the Algorithm
- **Operation**: Performs a character‑wise XOR between the message and a repeating key.
- **Outputs**: `returnAs` can be `'text'` (default), `'hex'`, or `'binary'`.
  - `'text'` returns a JavaScript string containing the raw XOR result (may include non‑printable characters).
  - `'hex'` returns lowercase hexadecimal (`00`–`ff`) for each resulting byte.
  - `'binary'` returns an 8‑bit binary string (`00000000`–`11111111`) per byte.
- **Decoding**: Use `inputAs` to tell the decoder how to interpret the input: `'text'`, `'hex'`, or `'binary'`.
- **Character model**: Uses `String.charCodeAt`/`fromCharCode`, so it XORs **UTF‑16 code units** (not Unicode code points). Astral symbols (outside BMP) take **two code units**.

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
- `engineer.add(XOR)` → registers the algorithm.
- `engineer.init(XOR)` → no parameters required.
- `engineer.forward(XOR, message, key, returnAs='text')` → returns XOR output as text/hex/binary.
- `engineer.reverse(XOR, encode, key, inputAs='text')` → decodes from text/hex/binary back to the original message.

---

## ⚠️ Common Pitfalls & Fixes
- **Missing inputs** → Both `message` (or `encode`) and `key` are required.
- **Hex input length** → Must be **even**; the decoder reads two hex chars per byte.
- **Binary input length** → Must be a multiple of **8**; the decoder reads 8 bits per byte.
- **Invisible characters in `'text'` mode** → The XOR result may include non‑printable characters; prefer `'hex'` or `'binary'` for transport/storage.
- **Unicode considerations** → Because it operates on UTF‑16 code units, different representations (e.g., emoji) can yield multi‑byte effects. For byte‑level control, convert to `Uint8Array` yourself before XORing (outside this class).

---

## ✅ Summary
- Pure browser usage with native ES Modules.
- Supports text, hex, and binary encodings for output/input.
- Use the manager or instantiate the class directly.