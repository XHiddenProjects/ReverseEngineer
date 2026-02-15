# Scytale Cipher Usage

Use the **Scytale** transposition cipher directly in the browser with native ES Modules.

---

## ✅ Requirements
- A modern browser (ES Modules support).
- Serve files over **HTTP(S)** (not `file://`) so module imports work consistently.
- Your project should include:
  - `./algorithms/Scytale/Scytale.js`
  - `./ReverseEngineer.js`

> **Note:** Ensure there are **no extra spaces** in your import paths (e.g., `Scytale .js` will fail).

---

## 📁 Recommended Project Structure
```
/your-project
  /algorithms
    /Scytale
      Scytale.js
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
    <title>Scytale Cipher Demo (Browser)</title>
  </head>
  <body>
    <h1>Scytale Cipher Demo (Browser)</h1>

    <script type="module">
      import { Scytale } from "./algorithms/Scytale/Scytale.js";
      import { ReverseEngineer } from "./ReverseEngineer.js";

      const engineer = new ReverseEngineer();
      engineer.getInstance();
      engineer.add(Scytale);

      // No initialization parameters required
      engineer.init(Scytale);

      // ✅ Encode with key = number of rows
      const plaintext = "WEAREDISCOVEREDFLEEATONCE";
      const key = 3; // rows
      const cipher = engineer.forward(Scytale, plaintext, key);
      console.log("Cipher (k=3):", cipher);

      // ✅ Decode with the same key
      const decoded = engineer.reverse(Scytale, cipher, key);
      console.log("Decoded:", decoded);

      // ✅ Optional padding during encryption (pads the tail to fill the grid)
      const padded = engineer.forward(Scytale, "HELLOWORLD", 4, { padChar: "X" });
      console.log("Padded cipher:", padded);

      // ✅ Strip padding on decode (tail-only)
      const unpadded = engineer.reverse(Scytale, padded, 4, { stripPad: "X" });
      console.log("Unpadded decode:", unpadded); // HELLOWORLD

      // ✅ Brute-force when key is unknown
      const candidates = engineer.reverse(Scytale, cipher, {
        bruteForce: true,
        minKey: 2,
        maxKey: 10,
        filter: "FLEE" // optional RegExp (string) to filter plausible plaintexts
      });
      console.log("Brute-force candidates:", candidates);
    </script>

    <!-- Alternative: Use the class directly (without the manager) -->
    <!--
    <script type="module">
      import { Scytale } from "./algorithms/Scytale/Scytale.js";

      const scytale = new Scytale();
      scytale.init(); // logs that the algorithm loaded (if implemented)

      const cipher = scytale.addForwardAlgorithm("HELLOWORLD", 4, { padChar: "X" });
      const plain  = scytale.addReverseAlgorithm(cipher, 4, { stripPad: "X" });

      // Brute-force directly
      const bf = scytale.addReverseAlgorithm(cipher, { bruteForce: true, minKey: 2, maxKey: 8, filter: "HELLO" });

      console.log({ cipher, plain, bf });
    </script>
    -->
  </body>
</html>
```

---

## 🔎 About the Algorithm
- **What it is**: A classical **transposition** cipher attributed to ancient Sparta. It rearranges characters without changing them.
- **Key**: `k` = number of **rows** (integer ≥ 2).
- **Encryption**: Write plaintext **row-wise** into a `k × ceil(L/k)` grid, then read out **column-wise** to form the ciphertext.
- **Decryption**: Inverts the above process to reconstruct the original row-wise order.
- **Padding (optional)**: During encryption you may pad the tail with a single character (e.g., `X`) to fill the last row.

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
**Manager-based (recommended)**
- `engineer.add(Scytale)` → registers the algorithm.
- `engineer.init(Scytale)` → no parameters required.
- `engineer.forward(Scytale, plaintext, key, opts?)` → returns ciphertext.
  - `key: number` (**≥ 2**) rows.
  - `opts.padChar?: string` → first char is used to pad tail cells during encryption.
- `engineer.reverse(Scytale, ciphertext, key, opts?)` → returns plaintext.
  - `key: number` (**≥ 2**) rows.
  - `opts.stripPad?: string | true` → if provided, strips that pad character from the **end** of the decoded text (tail-only).
  - `opts.padChar?: string` → used as the pad character when `stripPad` is truthy but not a character.
- `engineer.reverse(Scytale, ciphertext, { bruteForce:true, minKey?:number, maxKey?:number, filter?:RegExp|string })`
  → returns `Array<{ key:number, plaintext:string }>`
  - `minKey` (default: 2), `maxKey` (default: `cipher.length`) are inclusive bounds.
  - `filter` may be a `RegExp` or a string pattern compiled via `new RegExp(filter)`; candidates must match to be included.

**Direct-class usage**
- `new Scytale().addForwardAlgorithm(plaintext, key, { padChar? })`
- `new Scytale().addReverseAlgorithm(ciphertext, keyOrOptions, maybeOptions?)`
  - If `keyOrOptions` is a **number**, performs normal decode with optional `{ stripPad?, padChar? }`.
  - If `keyOrOptions` is an **object** with `{ bruteForce:true }`, tries keys in `[minKey..maxKey]` and returns candidates, optionally filtered.

---

## ⚠️ Common Pitfalls & Fixes
- **Key type/range** → `key` must be an **integer ≥ 2**.
- **Ragged last row** → If you don't use padding, the last row may be shorter; that's expected and handled by the decoder.
- **Padding removal** → Only the **trailing** pad characters are stripped when `stripPad` is used; interior pads (if any) are preserved.
- **Too-large key** → If `key` > `plaintext.length`, upper rows may be empty; the implementation still decodes safely.
- **Brute-force ranges** → Keep `minKey..maxKey` sensible; very large ranges will produce many candidates and more console output.
- **Filter syntax** → When using `filter` as a string, it's treated as a JavaScript `RegExp` pattern (e.g., `"HELLO|WORLD"`). Invalid patterns are ignored.

---

## ✅ Summary
- Pure browser usage with native ES Modules.
- Classical **row-wise write / column-wise read** transposition.
- Supports optional **padding** on encrypt and **tail-only pad stripping** on decrypt.
- Built-in **brute-force** helper with key range and optional regex filter.