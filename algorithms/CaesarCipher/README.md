# CaesarCipher.js

A tiny, dependency‑free **Caesar cipher** class that **extends** your `ReverseEngineer` container. It provides a simple substitution cipher that rotates characters within a configurable alphabet.

- `init()` – optional initialization
- `addForwardAlgorithm(message, shifts?, characters?)` – **encrypt/rotate** (default 1 shift over `A–Z`)
- `addReverseAlgorithm(message, shifts?, characters?)` – **decrypt/rotate back**

**Case is preserved** for characters found in the alphabet. Characters **not** in the alphabet pass through unchanged.

> ⚠️ **Not secure.** Use modern cryptography (e.g., AES‑GCM) for confidentiality.

---

## Table of Contents

- [CaesarCipher.js](#caesarcipherjs)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [API](#api)
    - [Class: `CaesarCipher`](#class-caesarcipher)
      - [Properties](#properties)
      - [Methods](#methods)
  - [Usage Patterns](#usage-patterns)
    - [Basic Shift (A–Z)](#basic-shift-az)
    - [Custom Alphabets](#custom-alphabets)
    - [Decrypting / Negative Shifts](#decrypting--negative-shifts)
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

- 🔁 **Bidirectional** — encode (forward) and decode (reverse)
- 🧩 **Pluggable** — registers into your existing `ReverseEngineer` system
- 🔤 **Custom alphabet** — default is `ABCDEFGHIJKLMNOPQRSTUVWXYZ`, but you can supply any string of unique symbols
- 🧷 **Case‑preserving** — characters matched in the alphabet keep their original case
- 🧼 **Non‑alphabet characters** are passed through unchanged (spaces, punctuation, digits, etc.)
- 🌍 **Works everywhere** — Node.js & browser‑compatible

---

## Prerequisites
- The `ReverseEngineer` class from your project
- Standard JS runtime (no external deps)

---

## Installation

If `CaesarCipher.js` is part of your project:

```js
import { CaesarCipher } from "./CaesarCipher.js";
import { ReverseEngineer } from "./ReverseEngineer.js";
```

No external dependencies are required.

---

## Quick Start

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { CaesarCipher } from "./CaesarCipher.js";

const RE = new ReverseEngineer().getInstance();
RE.add(CaesarCipher);
RE.init("CaesarCipher"); // optional

const enc = RE.forward("CaesarCipher", "Hello, World!", 3);
// enc: "Khoor, Zruog!"

const dec = RE.reverse("CaesarCipher", enc, 3);
// dec: "Hello, World!"
```

---

## API

### Class: `CaesarCipher`

#### Properties
- `version` – Algorithm version (e.g., `"1.0.0"`)
- `description` – Human‑readable description

#### Methods
- **`init(): void`**  
  Optional setup; logs a debug message that the algorithm is loaded.

- **`addForwardAlgorithm(message: string, shifts = 1, characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'): string`**  
  Rotates the letters in `message` by `shifts` positions within `characters`. Case is preserved for matched letters; characters not present in `characters` are emitted unchanged.

- **`addReverseAlgorithm(message: string, shifts = 1, characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'): string`**  
  Inverse operation: rotates letters **back** by `shifts` within `characters`. Same case‑preserving and pass‑through behavior.

> These method names match the `ReverseEngineer` container and are auto‑bound when you call `RE.add(CaesarCipher)`.

---

## Usage Patterns

### Basic Shift (A–Z)

```js
// Shift by 13 (ROT13 behavior using the Caesar implementation)
const out = RE.forward("CaesarCipher", "Attack at Dawn!", 13);
// "Nggnpx ng Qnja!"
const back = RE.reverse("CaesarCipher", out, 13);
// "Attack at Dawn!"
```

### Custom Alphabets

```js
// Only rotate uppercase hex characters; others pass through
const HEX = "ABCDEF";
const out = RE.forward("CaesarCipher", "faCe-0xBAD", 2, HEX);
// rotates A..F; lower/other chars unchanged
```

You can supply any unique‑character alphabet (e.g., include digits, accented letters, or a specific symbol set). Only characters present in the alphabet are rotated; everything else passes through.

### Decrypting / Negative Shifts

- To **decrypt**, call `addReverseAlgorithm` (or `RE.reverse`) with the **same** positive `shifts` value used for encryption.
- If you prefer to use negative shifts for encryption, note that JS’s `%` operator can yield negative results. In this implementation, `addForwardAlgorithm` does **not** normalize negative values before modulo; prefer using **positive** shifts for forward encryption and rely on `reverse` for decryption, which safely normalizes indices with `+ split.length`.

### Using With ReverseEngineer

```js
const RE = new ReverseEngineer().getInstance().add(CaesarCipher);
RE.init("CaesarCipher"); // optional

console.log(RE.list());
// ["CaesarCipher"]

const out = RE.forward("CaesarCipher", "Hello", 5);
const back = RE.reverse("CaesarCipher", out, 5);
```

---

## Examples

### Browser Example

```html
<input id="txt" placeholder="Type text..." />
<input id="shift" type="number" value="3" min="0" max="25" />
<pre id="out"></pre>

<script type="module">
import { ReverseEngineer } from "./ReverseEngineer.js";
import { CaesarCipher } from "./CaesarCipher.js";

const RE = new ReverseEngineer().getInstance().add(CaesarCipher);

const txt = document.getElementById("txt");
const shift = document.getElementById("shift");
const out = document.getElementById("out");

const run = () => {
  const s = Number(shift.value) || 0;
  out.textContent = RE.forward("CaesarCipher", txt.value, s);
};

txt.addEventListener("input", run);
shift.addEventListener("input", run);
</script>
```

### Node Example

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { CaesarCipher } from "./CaesarCipher.js";

const RE = new ReverseEngineer().getInstance().add(CaesarCipher);

const enc = RE.forward("CaesarCipher", "Server Logs 2026!", 7);
const dec = RE.reverse("CaesarCipher", enc, 7);
console.log(enc, dec);
```

---

## Troubleshooting

- **`You must include a message`**  
  Provide a non‑empty string for `message`/`encode`.

- **`Shifts must be a number`**  
  Ensure `shifts` is a numeric value (integer recommended).

- **Unexpected characters unchanged**  
  Only characters present in `characters` are rotated; others are copied as‑is.

---

## FAQ

**Is Caesar Cipher secure?**  
No — it’s a simple historical cipher, easily broken. Use strong, modern cryptography (e.g., AES‑GCM) for actual security.

**Does it preserve case?**  
Yes. Uppercase input is mapped to uppercase output, lowercase to lowercase, for characters found in the alphabet.

**Can I rotate Unicode/emoji?**  
You can include any symbols in `characters`, but ensure each symbol is a single code point and unique. Multi‑code‑unit characters may not behave as expected.

---

## Performance Notes

- Single‑pass string iteration; linear in input length
- Very fast for typical UI and scripting use cases

---

## Security Notes

- **Do not** use Caesar for secrecy. For real encryption, use authenticated encryption like **AES‑GCM** and encode if needed (e.g., Base64/Base32).

---

## Testing

Example Jest tests:

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { CaesarCipher } from "./CaesarCipher.js";

const setup = () => new ReverseEngineer().getInstance().add(CaesarCipher);

test("roundtrip with shift=3", () => {
  const RE = setup();
  const s = "Hello, World!";
  const out = RE.forward("CaesarCipher", s, 3);
  const back = RE.reverse("CaesarCipher", out, 3);
  expect(back).toBe(s);
});

test("rot13 example", () => {
  const RE = setup();
  const s = "Attack at Dawn!";
  const out = RE.forward("CaesarCipher", s, 13);
  const back = RE.reverse("CaesarCipher", out, 13);
  expect(back).toBe(s);
});

// Characters not in the alphabet pass through
 test("digits unchanged", () => {
  const RE = setup();
  const s = "ABC-123";
  const out = RE.forward("CaesarCipher", s, 1);
  expect(out.endsWith("-123")).toBe(true);
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