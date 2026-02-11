# Hex.js

A tiny, dependency‑free **hexadecimal** encoder/decoder that **extends** your `ReverseEngineer` container. It provides string ⇄ hex conversion with a consistent API:

- `init()` – optional initialization
- `addForwardAlgorithm(message)` – **encode** a string to lowercase hex (2 chars per code unit)
- `addReverseAlgorithm(hex)` – **decode** a hex string back to a JS string

> **Important:** This implementation operates on **JavaScript UTF‑16 code units**, but only encodes the **low 8 bits** of each unit. It is best suited for **ASCII/Latin‑1** text. Non‑ASCII characters (code points > 255) will **not round‑trip**.

---

## Table of Contents

- [Hex.js](#hexjs)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [API](#api)
    - [Class: `Hex`](#class-hex)
      - [Properties](#properties)
      - [Methods](#methods)
  - [Usage Patterns](#usage-patterns)
    - [Basic Encode/Decode](#basic-encodedecode)
    - [Displaying with `0x` Prefix or Grouping](#displaying-with-0x-prefix-or-grouping)
    - [Working with Binary Data](#working-with-binary-data)
    - [Using With ReverseEngineer](#using-with-reverseengineer)
  - [Examples](#examples)
    - [Browser Example](#browser-example)
    - [Node Example](#node-example)
  - [Limitations \& Gotchas](#limitations--gotchas)
  - [Troubleshooting](#troubleshooting)
  - [FAQ](#faq)
  - [Performance Notes](#performance-notes)
  - [Security Notes](#security-notes)
  - [Testing](#testing)
  - [Versioning](#versioning)
  - [License](#license)

---

## Features

- 🔁 **Bidirectional** — encode strings to hex and decode hex back to strings
- 🧩 **Pluggable** — registers into your existing `ReverseEngineer` system
- 🔡 **Lowercase hex** output (`0–9a–f`)
- 🧼 **No separators/prefixes** — raw compact form; formatting is up to you
- 🌍 **Works everywhere** — Node.js & browser‑compatible

---

## Prerequisites
- The `ReverseEngineer` class from your project
- Standard JS runtime (no external deps)

---

## Installation

If `Hex.js` is part of your project:

```js
import { Hex } from "./Hex.js";
import { ReverseEngineer } from "./ReverseEngineer.js";
```

No external dependencies are required.

---

## Quick Start

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { Hex } from "./Hex.js";

const RE = new ReverseEngineer().getInstance();
RE.add(Hex);
RE.init("Hex"); // optional

const enc = RE.forward("Hex", "Hello!");
// enc: "48656c6c6f21"

const dec = RE.reverse("Hex", enc);
// dec: "Hello!"
```

---

## API

### Class: `Hex`

#### Properties
- `version` – Algorithm version (e.g., `"1.0.0"`)
- `description` – Human‑readable description

#### Methods
- **`addForwardAlgorithm(message: string): string`**  
  Encodes each character’s **code unit** with `charCodeAt(i)`, takes the **low 8 bits**, and emits a **two‑digit lowercase hex** pair. Non‑ASCII characters will be **truncated** to a single byte (data loss).

- **`addReverseAlgorithm(hex: string): string`**  
  Parses the input in **2‑character chunks** using `parseInt(.., 16)` and converts each byte with `String.fromCharCode`. If the input length is **odd**, the last lone nibble is parsed as a full byte (not recommended).

> These method names match the `ReverseEngineer` container and are auto‑bound when you call `RE.add(Hex)`.

---

## Usage Patterns

### Basic Encode/Decode

```js
const s = "Attack at Dawn!";
const hex = RE.forward("Hex", s);      // "41747461636b206174204461776e21"
const back = RE.reverse("Hex", hex);    // "Attack at Dawn!"
```

### Displaying with `0x` Prefix or Grouping

```js
const hex = RE.forward("Hex", "Hi"); // "4869"
const pretty = hex.match(/.{1,2}/g).map(b => "0x" + b).join(" ");
// "0x48 0x69"
```

### Working with Binary Data

This class expects **strings**. To work with binary data (`Uint8Array`), convert bytes to a string (e.g., using `String.fromCharCode` per byte) or create a dedicated byte‑aware hex utility. For full **Unicode** fidelity, consider a UTF‑8 path (see **Limitations**).

### Using With ReverseEngineer

```js
const RE = new ReverseEngineer().getInstance().add(Hex);
RE.init("Hex"); // optional

console.log(RE.list());
// ["Hex"]

const out = RE.forward("Hex", "Hello");
const back = RE.reverse("Hex", out);
```

---

## Examples

### Browser Example

```html
<input id="txt" placeholder="Type text..." />
<pre id="out"></pre>

<script type="module">
import { ReverseEngineer } from "./ReverseEngineer.js";
import { Hex } from "./Hex.js";

const RE = new ReverseEngineer().getInstance().add(Hex);

document.getElementById("txt").addEventListener("input", (e) => {
  const h = RE.forward("Hex", e.target.value);
  document.getElementById("out").textContent = h;
});
</script>
```

### Node Example

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { Hex } from "./Hex.js";

const RE = new ReverseEngineer().getInstance().add(Hex);

const enc = RE.forward("Hex", "Server Logs 2026!");
const dec = RE.reverse("Hex", enc);
console.log(enc, dec);
```

---

## Limitations & Gotchas

- **ASCII/Latin‑1 only (by design):** The encoder uses `charCodeAt(i)` and keeps only the **last 2 hex digits**, i.e., the **low 8 bits**. Characters with code points **> 255** (e.g., `é`, `€`, `漢`) will **lose information** and **won’t decode back** to the original.
- **Odd‑length hex input:** The decoder processes hex in 2‑character chunks. If the length is odd, the trailing 1‑nibble chunk becomes a single byte via `parseInt`, usually **not what you want**. Always provide **even‑length** hex strings.

**Need Unicode‑safe hex?** Encode the string to **UTF‑8 bytes** first (e.g., via `TextEncoder`) and then hex‑encode those bytes. That requires a byte‑aware implementation (not included here).

---

## Troubleshooting

- **`You must include a message`**  
  Provide a non‑empty string to encode/decode.

- **Garbled non‑ASCII characters**  
  This implementation is 8‑bit oriented. Convert to bytes via UTF‑8 before hexing if you need full Unicode fidelity.

- **Decoder output looks wrong**  
  Check that your hex input length is **even** and characters are valid hex (`0‑9 a‑f A‑F`).

---

## FAQ

**Does the decoder accept uppercase hex?**  
Yes. `parseInt(.., 16)` accepts both uppercase and lowercase.

**Can I add spaces or `0x` prefixes?**  
Not in the raw output. You can format the string externally for display; remove formatting before decoding.

**Is this the same as encoding bytes?**  
Not exactly. It converts **string code units** (and truncates to 1 byte). For true byte arrays, use a byte‑based hex encoder.

---

## Performance Notes

- Linear time over the string (one pass for encode/decode)
- Very fast for typical UI and tooling scenarios

---

## Security Notes

- Hex is **not** encryption. It offers no confidentiality or integrity. For secrecy, use authenticated encryption (e.g., **AES‑GCM**) and encode if needed.

---

## Testing

Example Jest tests:

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { Hex } from "./Hex.js";

const setup = () => new ReverseEngineer().getInstance().add(Hex);

test("roundtrip ascii", () => {
  const RE = setup();
  const s = "Hello, World!";
  const out = RE.forward("Hex", s);
  const back = RE.reverse("Hex", out);
  expect(back).toBe(s);
});

test("non-ascii does not roundtrip (documented limitation)", () => {
  const RE = setup();
  const s = "€"; // U+20AC (8364)
  const out = RE.forward("Hex", s);   // only low 8 bits retained
  const back = RE.reverse("Hex", out);
  expect(back).not.toBe(s);
});

// even-length requirement for reliable decode
 test("odd-length input leads to unexpected char", () => {
  const RE = setup();
  const back = RE.reverse("Hex", "F");
  expect(typeof back).toBe("string"); // not an error, but likely not intended
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