# RailFenceCipher.js

A tiny, dependency‑free **Rail Fence cipher** (zig‑zag) class that **extends** your `ReverseEngineer` container. It rearranges characters by writing them across a fixed number of *rails* in a zig‑zag pattern, then reading row‑by‑row.

- `addForwardAlgorithm(text, rails?)` – **encode** (default `rails = 3`)
- `addReverseAlgorithm(cipher, rails?)` – **decode** back to the original order

**Characters are preserved** exactly (letters, spaces, punctuation, emoji). The cipher only changes **order**, not the characters themselves.

> ⚠️ **Not secure.** This is a classical transposition cipher and is trivially broken with modern techniques. Use real cryptography (e.g., AES‑GCM) for confidentiality.

---

## Table of Contents

- [RailFenceCipher.js](#railfencecipherjs)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [API](#api)
    - [Class: `RailFenceCipher`](#class-railfencecipher)
      - [Properties](#properties)
      - [Methods](#methods)
  - [Usage Patterns](#usage-patterns)
    - [Basic 3‑rail Encoding/Decoding](#basic-3rail-encodingdecoding)
    - [Choosing Number of Rails](#choosing-number-of-rails)
    - [Using With ReverseEngineer](#using-with-reverseengineer)
  - [Examples](#examples)
    - [Browser Example](#browser-example)
    - [Node Example](#node-example)
  - [Troubleshooting](#troubleshooting)
  - [FAQ](#faq)
  - [Performance Notes](#performance-notes)
  - [Security Notes](#security-notes)
  - [Testing](#testing)
  - [Versioning](#versioning)
  - [License](#license)

---

## Features

- 🔁 **Bidirectional** — encode and decode
- 🧩 **Pluggable** — integrates with your `ReverseEngineer` system
- 🧷 **Character‑preserving** — letters, whitespace, punctuation, and emoji are preserved; only order changes
- 📏 **Configurable rails** — any integer `>= 2`
- 🌍 **Works everywhere** — Node.js & browser‑compatible

---

## Prerequisites
- The `ReverseEngineer` class from your project
- Standard JS runtime (no external deps)

---

## Installation

If `RailFenceCipher.js` is part of your project:

```js
import { RailFenceCipher } from "./RailFenceCipher.js";
import { ReverseEngineer } from "./ReverseEngineer.js";
```

No external dependencies are required.

---

## Quick Start

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { RailFenceCipher } from "./RailFenceCipher.js";

const RE = new ReverseEngineer().getInstance();
RE.add(RailFenceCipher);

const enc = RE.forward("RailFenceCipher", "WE ARE DISCOVERED. FLEE AT ONCE", 3);
// enc (classic example): "WECRLTEERDSOEEFEAOCAIVDEN"

const dec = RE.reverse("RailFenceCipher", enc, 3);
// dec: "WE ARE DISCOVERED. FLEE AT ONCE"
```

---

## API

### Class: `RailFenceCipher`

#### Properties
- `version` – Algorithm version (e.g., `"1.0.0"`)
- `description` – Human‑readable description

#### Methods
- **`addForwardAlgorithm(text: string = "", rails: number = 3): string`**  
  Encodes `text` by distributing characters across `rails` rows in a zig‑zag: top → bottom → top → …, then concatenates rows.
  - Throws if `rails < 2`.

- **`addReverseAlgorithm(cipher: string = "", rails: number = 3): string`**  
  Reconstructs the original order by first **marking** the zig‑zag positions, **filling** them row‑by‑row from `cipher`, then **reading** them back along the zig‑zag.
  - Throws if `rails < 2`.

> These method names match the `ReverseEngineer` container and are auto‑bound when you call `RE.add(RailFenceCipher)`.

---

## Usage Patterns

### Basic 3‑rail Encoding/Decoding

```js
const msg = "Attack at Dawn!";
const out = RE.forward("RailFenceCipher", msg, 3);
const back = RE.reverse("RailFenceCipher", out, 3);
```

### Choosing Number of Rails

- `rails = 2` creates a simple up/down zig‑zag across two rows.
- Larger `rails` increase the vertical spread of the pattern.
- `rails > text.length` still works; some rows will be empty.

### Using With ReverseEngineer

```js
const RE = new ReverseEngineer().getInstance().add(RailFenceCipher);

console.log(RE.list());
// ["RailFenceCipher"]

const out = RE.forward("RailFenceCipher", "Hello, World!", 4);
const back = RE.reverse("RailFenceCipher", out, 4);
```

---

## Examples

### Browser Example

```html
<input id="txt" placeholder="Type text..." />
<input id="rails" type="number" value="3" min="2" />
<pre id="out"></pre>

<script type="module">
import { ReverseEngineer } from "./ReverseEngineer.js";
import { RailFenceCipher } from "./RailFenceCipher.js";

const RE = new ReverseEngineer().getInstance().add(RailFenceCipher);

const txt = document.getElementById("txt");
const rails = document.getElementById("rails");
const out = document.getElementById("out");

const run = () => {
  const r = Math.max(2, Number(rails.value) || 3);
  out.textContent = RE.forward("RailFenceCipher", txt.value, r);
};

txt.addEventListener("input", run);
rails.addEventListener("input", run);
</script>
```

### Node Example

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { RailFenceCipher } from "./RailFenceCipher.js";

const RE = new ReverseEngineer().getInstance().add(RailFenceCipher);

const enc = RE.forward("RailFenceCipher", "Server Logs 2026!", 4);
const dec = RE.reverse("RailFenceCipher", enc, 4);
console.log(enc, dec);
```

---

## Troubleshooting

- **`rails must be >= 2`**  
  Provide an integer `rails` value of **2 or more**.

- **Output looks like a permutation of the input**  
  Correct—Rail Fence is a **transposition** cipher; it only reorders characters.

- **Spacing/punctuation look odd when comparing**  
  Whitespace and punctuation are preserved but moved; decoding restores the original order.

---

## FAQ

**Does this modify characters?**  
No. It only reorders them.

**Is the cipher case‑sensitive?**  
Yes. Case is preserved (order changes, characters are not altered).

**What if `rails` is larger than the text length?**  
It still works; some rows remain empty and the result equals the input when `rails` ≥ `text.length`.

---

## Performance Notes

- **Time:** `O(n)` for both encode and decode, where `n` is the length of the string.
- **Space:** `O(n)` to hold the rows/marks/grid during processing.

---

## Security Notes

- This is **not** secure encryption. It provides no cryptographic confidentiality or integrity.
- For actual security, use authenticated encryption like **AES‑GCM** and encode for transport if needed (Base64/Base32/Hex).

---

## Testing

Example Jest tests:

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { RailFenceCipher } from "./RailFenceCipher.js";

const setup = () => new ReverseEngineer().getInstance().add(RailFenceCipher);

test("roundtrip rails=3", () => {
  const RE = setup();
  const s = "Hello, World!";
  const out = RE.forward("RailFenceCipher", s, 3);
  const back = RE.reverse("RailFenceCipher", out, 3);
  expect(back).toBe(s);
});

test("rails=2 works", () => {
  const RE = setup();
  const s = "ABCD";
  const out = RE.forward("RailFenceCipher", s, 2); // ACBD
  const back = RE.reverse("RailFenceCipher", out, 2);
  expect(back).toBe(s);
});

test("rails greater than length", () => {
  const RE = setup();
  const s = "Hi";
  const out = RE.forward("RailFenceCipher", s, 10);
  const back = RE.reverse("RailFenceCipher", out, 10);
  expect(back).toBe(s);
});
```

---

## Versioning

Current version: **1.0.0**

---

## License

```
MIT License
```