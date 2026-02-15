# Playfair Cipher Usage

Use the **Playfair** digraph substitution cipher directly in the browser with native ES Modules.

> **Version:** 1.1.0 — adds **smart unpadding** on decrypt and improved **spacing/punctuation reinsertion**.

---

## ✅ Requirements
- A modern browser with **ES Modules** support.
- Serve files over **HTTP(S)** (not `file://`) so module imports work consistently.
- Your project should include:
  - `./algorithms/Playfair/PlayfairCipher.js`
  - `./ReverseEngineer.js`

> **Note:** Ensure there are **no extra spaces** in your import paths (e.g., `PlayfairCipher .js` will fail).

---

## 📁 Recommended Project Structure
```
/your-project
  /algorithms
    /Playfair
      PlayfairCipher.js
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
    <title>Playfair Cipher Demo (Browser)</title>
  </head>
  <body>
    <h1>Playfair Cipher Demo (Browser)</h1>

    <script type="module">
      import { PlayfairCipher } from "./algorithms/Playfair/PlayfairCipher.js";
      import { ReverseEngineer } from "./ReverseEngineer.js";

      const engineer = new ReverseEngineer().getInstance().use(PlayfairCipher);

      // Initialize once with a keyword (and optional options)
      // v1.1.0 defaults: { padOdd: true, autoUnpad: true }
      engineer.init(PlayfairCipher, "MONARCHY", { mergeIJ: true, filler: "X", keepSpaces: true, keepCase: true });

      // ✅ Encrypt
      const plaintext = "HIDETHEGOLDINTHETREESTUMP";
      const cipher = engineer.forward(PlayfairCipher, plaintext);
      console.log("Cipher:", cipher);

      // ✅ Decrypt (smart unpadding removes artificial fillers)
      const decoded = engineer.reverse(PlayfairCipher, cipher);
      console.log("Decoded:", decoded);

      // ✅ One-shot usage (no prior init): pass [keyword, options] after input
      const c2 = engineer.forward(PlayfairCipher, "HELLOWORLD", "MONARCHY", { filler: "X" });
      const p2 = engineer.reverse(PlayfairCipher, c2, "MONARCHY", { filler: "X" });
      console.log({ c2, p2 });
    </script>

    <!-- Alternative: Use the class directly (without the manager) -->
    <!--
    <script type="module">
      import { PlayfairCipher } from "./algorithms/Playfair/PlayfairCipher.js";

      const playfair = new PlayfairCipher();
      playfair.init("MONARCHY", { mergeIJ: true, filler: "X", keepSpaces: true, keepCase: true });

      const cipher = playfair.addForwardAlgorithm("INSTRUMENTS");
      const plain  = playfair.addReverseAlgorithm(cipher);

      // Or, without init(): pass keyword/options as extra arguments
      const c3 = playfair.addForwardAlgorithm("BALLOON", "MONARCHY", { filler: "X" });
      const p3 = playfair.addReverseAlgorithm(c3, "MONARCHY", { filler: "X" });

      console.log({ cipher, plain, c3, p3 });
    </script>
    -->
  </body>
</html>
```

---

## 🔎 About the Algorithm
- **What it is**: A classical **digraph substitution** cipher using a 5×5 key square derived from a keyword.
- **Alphabet**: By default `A–Z` with **I/J merged** (`J → I`) to fit 25 cells.
- **Key square**: Write the de-duplicated keyword (letters only), then the remaining letters of the alphabet.
- **Pairing**: Plaintext is prepared in **letter pairs** (digraphs). If a pair has repeated letters (e.g., `LL`), insert a **filler** (default `X`) between them; if the final letter has no partner, optionally pad with the filler.
- **Encryption rules** (per pair):
  1. **Same row** → each letter shifts **right** (wrap around).
  2. **Same column** → each letter shifts **down** (wrap around).
  3. **Rectangle** → letters swap **columns** (take the corners in the same rows).
- **Decryption** uses the inverse operations: left shift for rows, up shift for columns, same rectangle rule.

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
- `engineer.use(PlayfairCipher)` → registers the algorithm.
- `engineer.init(PlayfairCipher, keyword, options?)` → builds the 5×5 key square.
  - `keyword: string`
  - `options?: PlayfairOptions` (see below)
- `engineer.forward(PlayfairCipher, plaintext)` → returns ciphertext.
  - If you **did not call `init`**, you may pass extra args: `engineer.forward(PlayfairCipher, plaintext, keyword, options?)`.
- `engineer.reverse(PlayfairCipher, ciphertext)` → returns plaintext.
  - Likewise supports the one-shot form: `engineer.reverse(PlayfairCipher, ciphertext, keyword, options?)`.

**Direct-class usage**
- `new PlayfairCipher().init(keyword, options?)`
- `new PlayfairCipher().addForwardAlgorithm(plaintext)`
- `new PlayfairCipher().addReverseAlgorithm(ciphertext)`
- One-shot without `init()`:
  - `.addForwardAlgorithm(plaintext, keyword, options?)`
  - `.addReverseAlgorithm(ciphertext, keyword, options?)`

**`PlayfairOptions`**
```ts
{
  mergeIJ?: boolean;   // default: true  — map J→I to fit 25-letter square
  filler?: string;     // default: 'X'   — inserted between repeated letters and for padding
  fillerAlt?: string;  // default: 'Q'   — alternate when the letter itself equals the filler
  padOdd?: boolean;    // default: true  — pad a dangling last letter on encrypt
  stripNonLetters?: boolean; // default: true  — process letters only (classic)
  keepSpaces?: boolean;      // default: false — re-insert spaces back into output
  keepPunct?: boolean;       // default: false — re-insert punctuation back into output
  keepCase?: boolean;        // default: false — attempt to mirror original casing pattern
  alphabet?: string;         // default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  autoUnpad?: boolean;       // default: true  — smart removal of fillers on decrypt
}
```

---

## ✨ v1.1.0 Improvements
- **Smart Unpadding (`autoUnpad`)** on **decrypt**:
  - Removes a single **trailing filler** appended for odd-length inputs.
  - Removes a **between-doubles** filler pattern (`A f A → AA`), using `fillerAlt` automatically if the repeated letter equals the filler.
- **Spacing/Punctuation Reinsertion** now works even when `stripNonLetters: true` — set `keepSpaces`/`keepPunct` to rebuild the output with your original spacing/punct.

> The unpadding logic is conservative: it *only* removes padding that is highly likely to be artificial, preserving genuine letters.

---

## 🧪 Example: "Good Morning"
```js
import { PlayfairCipher } from "./algorithms/Playfair/PlayfairCipher.js";

const playfair = new PlayfairCipher();
playfair.init("KEYWORD", { keepSpaces: true, keepCase: true });

const ct = playfair.addForwardAlgorithm("Good Morning");
const pt = playfair.addReverseAlgorithm(ct);

console.log({ ct, pt });
// pt === "Good Morning" (no trailing X; spaces & case preserved)
```

- If you prefer **no padding at all**, use `padOdd: false` on init.
- If you want **classical padding** on encrypt but a clean plaintext on decrypt, keep `padOdd: true` and rely on `autoUnpad: true` (default).

---

## ⚠️ Common Pitfalls & Fixes
- **Keyword normalization** → Non-letters are removed; duplicates are de-duplicated in order of appearance.
- **I/J handling** → With `mergeIJ: true`, any `J` is treated as `I` in the square and during processing.
- **Filler collisions** → When the repeated letter equals the chosen filler (e.g., `X`), an alternate (`fillerAlt`, default `Q`) is used to avoid ambiguous pairs.
- **Odd length plaintext** → If `padOdd` is `true`, a trailing filler is appended; `autoUnpad` will remove it on decrypt. Otherwise, the final single letter is carried through.
- **Non-letters, spaces, punctuation** → With `stripNonLetters: true`, only letters participate; set `keepSpaces`/`keepPunct` to reinsert them in the output (works in v1.1.0 even when stripping).
- **Case** → With `keepCase: true`, the output attempts to mirror the original letter casing.
- **Imports** → Verify exact import paths and file names (no stray spaces or different casing).

---

## ✅ Summary
- Pure browser usage with native ES Modules.
- Classical **Playfair** digraph substitution with a configurable 5×5 key square.
- Flexible preprocessing: letter-only mode by default, with options to preserve spacing, punctuation, and case.
- One-shot usage (no `init`) or explicit initialization for GUI-friendly workflows.