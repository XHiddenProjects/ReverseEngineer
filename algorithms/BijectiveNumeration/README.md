# Bijective Numeration Usage

Use the **BijectiveNumeration** algorithm directly in the browser with native ES Modules.

---

## ✅ Requirements
- A modern browser (ES Modules support).
- Serve files over **HTTP(S)** (not `file://`) so module imports work consistently.
- Your project should include:
  - `./algorithms/BijectiveNumeration/BijectiveNumeration.js`
  - `./ReverseEngineer.js`

> **Note:** Ensure there are **no extra spaces** in your import paths (e.g., `BijectiveNumeration .js` will fail).

---

## 📁 Recommended Project Structure
```
/your-project
  /algorithms
    /BijectiveNumeration
      BijectiveNumeration.js
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
    <title>Bijective Numeration Demo (Browser)</title>
  </head>
  <body>
    <h1>Bijective Numeration Demo (Browser)</h1>

    <script type="module">
      import { BijectiveNumeration } from "./algorithms/BijectiveNumeration/BijectiveNumeration.js";
      import { ReverseEngineer } from "./ReverseEngineer.js";

      const engineer = new ReverseEngineer();
      engineer.getInstance();
      engineer.add(BijectiveNumeration);

      // No initialization parameters required
      engineer.init(BijectiveNumeration);

      // ✅ Encode numbers using default alphabet (A–Z)
      console.log("0  ->", engineer.forward(BijectiveNumeration, 0));   // A
      console.log("25 ->", engineer.forward(BijectiveNumeration, 25));  // Z
      console.log("26 ->", engineer.forward(BijectiveNumeration, 26));  // AA
      console.log("701->", engineer.forward(BijectiveNumeration, 701)); // ZZ
      console.log("702->", engineer.forward(BijectiveNumeration, 702)); // AAA

      // ✅ Decode back to numbers (string -> number)
      console.log("A   ->", engineer.reverse(BijectiveNumeration, "A"));     // 0
      console.log("Z   ->", engineer.reverse(BijectiveNumeration, "Z"));     // 25
      console.log("AA  ->", engineer.reverse(BijectiveNumeration, "AA"));    // 26
      console.log("ZZ  ->", engineer.reverse(BijectiveNumeration, "ZZ"));    // 701
      console.log("AAA ->", engineer.reverse(BijectiveNumeration, "AAA"));   // 702

      // ✅ Custom base via custom alphabet (must be uppercase if you pass uppercase input)
      const alphabet36 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // base-36 uppercase
      console.log("35 ->", engineer.forward(BijectiveNumeration, 35, alphabet36)); // Z
      console.log("36 ->", engineer.forward(BijectiveNumeration, 36, alphabet36)); // 10
      console.log("'10' ->", engineer.reverse(BijectiveNumeration, "10", alphabet36)); // 36
    </script>

    <!-- Alternative: Use the class directly (without the manager) -->
    <!--
    <script type="module">
      import { BijectiveNumeration } from "./algorithms/BijectiveNumeration/BijectiveNumeration.js";

      const bij = new BijectiveNumeration();
      bij.init(); // logs that the algorithm loaded

      const code = bij.addForwardAlgorithm(26);  // "AA"
      const num  = bij.addReverseAlgorithm("AA"); // 26

      console.log({ code, num });
    </script>
    -->
  </body>
</html>
```

---

## 🔎 About the Algorithm
- **What it is**: Bijective numeration is a positional numeral system **without a zero digit**. Each position uses values 1..base instead of 0..(base-1). A common example is spreadsheet columns (A, B, ..., Z, AA, AB, ...).
- **Default alphabet**: `A–Z` (base 26). Example mappings:
  - `0 → A`, `25 → Z`, `26 → AA`, `701 → ZZ`, `702 → AAA`.
- **Custom bases**: Supply a custom `alphabet` string; the base is `alphabet.length`.
- **No Web Crypto needed**: This algorithm is pure string/number logic; secure context is not required, but serving over HTTP(S) avoids module import issues.

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
- `engineer.add(BijectiveNumeration)` → registers the algorithm.
- `engineer.init(BijectiveNumeration)` → no parameters required.
- `engineer.forward(BijectiveNumeration, message, alphabet?)` → encodes a **non‑negative integer** using the (optional) alphabet.
- `engineer.reverse(BijectiveNumeration, code, alphabet?)` → decodes a **non‑empty string** to a number.

---

## ⚠️ Common Pitfalls & Fixes
- **Non‑integer or negative inputs** → `message` must be an integer ≥ 0; otherwise an error is thrown.
- **Case and custom alphabets** → Decoding uppercases the input (`encode.toUpperCase()`), then searches each character in `alphabet`. Ensure your **alphabet contains matching uppercase** characters (e.g., pass `"ABCDEFGHIJKLMNOPQRSTUVWXYZ"` or an uppercase custom string). If you need lowercase, adjust the alphabet and input handling accordingly.
- **Invalid characters** → Decoding throws an error if a character is not found in the `alphabet`.

---

## ✅ Summary
- Pure browser usage with native ES Modules.
- Default base‑26 alphabet (`A–Z`) with Excel‑style mappings.
- Supports custom bases via user‑supplied alphabets.