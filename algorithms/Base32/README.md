# Base32.js

A tiny, dependency‑free Base32 algorithm class that **extends** your `ReverseEngineer` container. It provides RFC 4648 Base32 **encoding/decoding** with a consistent API:

- `init()` – optional initialization
- `addForwardAlgorithm(message, sanitize?, sanitizeOptions?)` – **encode** to Base32
- `addReverseAlgorithm(base32, isSanitized?)` – **decode** from Base32

Supports **string** inputs/outputs with optional sanitization helpers for transport‑safe tokens.

---

## Table of Contents

- [Base32.js](#base32js)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [API](#api)
    - [Class: `Base32`](#class-base32)
      - [Properties](#properties)
      - [Methods](#methods)
  - [Usage Patterns](#usage-patterns)
    - [Basic Encode/Decode](#basic-encodedecode)
    - [Sanitized Output (no padding / lowercase / no spaces)](#sanitized-output-no-padding--lowercase--no-spaces)
    - [Decoding Sanitized or Human‑Entered Variants](#decoding-sanitized-or-humanentered-variants)
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

- 🔁 **Bidirectional** — encode and decode, symmetric by design
- 🧩 **Pluggable** — registers into your existing `ReverseEngineer` system
- 🧼 **Sanitization options** — trim `=`, remove whitespace, lowercase
- 🆎 **Human‑friendly decoding** — optional normalization for common mistakes (`0→O`, `1/L→I`, `-`/`_` removed)
- 🧵 **Type‑preserving** — always returns **string** output
- 🌍 **Works everywhere** — Node.js & browser‑compatible

---

## Prerequisites
- The `ReverseEngineer` class from your project (and optionally `CryptoUtils` if you want UTF‑8 helpers elsewhere)
- Environment with **TextEncoder/TextDecoder** (modern browsers, Node 18+, or polyfill)

---

## Installation

If `Base32.js` is part of your project:

```js
import { Base32 } from "./Base32.js";
import { ReverseEngineer } from "./ReverseEngineer.js";
```

No external dependencies are required.

---

## Quick Start

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { Base32 } from "./Base32.js";

const RE = new ReverseEngineer().getInstance();
RE.add(Base32);
RE.init("Base32"); // optional

const enc = RE.forward("Base32", "Hello, World!");
// enc: "JBSWY3DPEBLW64TMMQQQ===="

const dec = RE.reverse("Base32", enc);
// dec: "Hello, World!"
```

---

## API

### Class: `Base32`

#### Properties
- `version` – Algorithm version (e.g., `"1.0.0"`)
- `description` – Human‑readable description

#### Methods
- **`init(): void`**  
  Optional setup; logs a debug message that the algorithm is loaded.

- **`addForwardAlgorithm(message: string, sanitize = false, sanitizeOptions = { lower: true }): string`**  
  Encodes UTF‑8 input to **RFC 4648 Base32** with `=` padding. If `sanitize` is true, removes padding and whitespace and lowercases the output by default.

- **`addReverseAlgorithm(base32: string, isSanitized = false): string`**  
  Decodes a Base32 string to UTF‑8. If `isSanitized` is true, normalizes common variants (`0→O`, `1/L→I`, strips `-`/`_`, ignores padding & whitespace).

> These method names match the `ReverseEngineer` container and are auto‑bound when you call `RE.add(Base32)`.

---

## Usage Patterns

### Basic Encode/Decode

```js
const s = "Attack at Dawn!";
const b32 = RE.forward("Base32", s);
const back = RE.reverse("Base32", b32);
```

### Sanitized Output (no padding / lowercase / no spaces)

```js
const encSan = RE.forward("Base32", "Token-123", true, { lower: true });
// e.g., "krugs4zanfzsa===" → "krugs4zanfzsa" (sanitized)
```

### Decoding Sanitized or Human‑Entered Variants

```js
// Accepts lowercase, no padding, and fixes common substitutions
const decoded = RE.reverse("Base32", "jbswy3dpeblw64tmmqqq", true);
```

### Using With ReverseEngineer

```js
const RE = new ReverseEngineer().getInstance().add(Base32);
RE.init("Base32"); // optional

console.log(RE.list());
// ["Base32"]

const out = RE.forward("Base32", "Hello");
const back = RE.reverse("Base32", out);
```

---

## Examples

### Browser Example

```html
<input id="txt" placeholder="Type text..." />
<pre id="out"></pre>

<script type="module">
import { ReverseEngineer } from "./ReverseEngineer.js";
import { Base32 } from "./Base32.js";

const RE = new ReverseEngineer().getInstance().add(Base32);

const txt = document.getElementById("txt");
const out = document.getElementById("out");

txt.addEventListener("input", (e) => {
  out.textContent = RE.forward("Base32", e.target.value, true); // sanitized
});
</script>
```

### Node Example

```js
// Node 18+: TextEncoder/TextDecoder are global
import { ReverseEngineer } from "./ReverseEngineer.js";
import { Base32 } from "./Base32.js";

const RE = new ReverseEngineer().getInstance().add(Base32);

const enc = RE.forward("Base32", "Server Logs 2026!", true);
const dec = RE.reverse("Base32", enc, true);
console.log(enc, dec);
```

---

## Troubleshooting

- **`X has not been instanced`**  
  Call `RE.add(Base32)` before using it (and optionally `RE.init("Base32")`).

- **`Invalid Base32 character: "?"`**  
  The decoder encountered a character outside the Base32 alphabet; pass `isSanitized=true` if you expect human‑entered variants.

- **Unexpected output**  
  Ensure you’re passing a **string**. If you’re working with bytes, convert to/from UTF‑8 using your own helpers (`TextEncoder`/`TextDecoder` or `CryptoUtils`).

---

## FAQ

**Is Base32 encryption?**  
No — it’s a binary‑to‑text **encoding**. Use cryptography (e.g., AES‑GCM) for confidentiality.

**Why do I see `=` padding?**  
Per RFC 4648, Base32 uses `=` padding to align output to 40‑bit blocks. You can disable it in transport via the `sanitize` option (decoder does not require padding).

**Can I decode lowercase or URL‑friendly strings?**  
Yes — pass `isSanitized=true` to accept lowercase, strip separators, and fix common character confusions.

---

## Performance Notes

- Single‑pass bit‑buffer implementation; fast for long strings
- Sanitization/normalization runs in linear time over the input
- Output grows by ~60% compared to the original bytes (Base32 overhead)

---

## Security Notes

- Base32 is **not** secure. It provides no confidentiality or integrity
- For secrets, pair with authenticated encryption (e.g., AES‑GCM) and then encode if needed

---

## Testing

Example Jest tests:

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { Base32 } from "./Base32.js";

const setup = () => new ReverseEngineer().getInstance().add(Base32);

test("roundtrip string", () => {
  const RE = setup();
  const s = "Hello, World!";
  const out = RE.forward("Base32", s);
  const back = RE.reverse("Base32", out);
  expect(back).toBe(s);
});

test("sanitized forward + sanitized decode", () => {
  const RE = setup();
  const out = RE.forward("Base32", "Token-123", true, { lower: true });
  const back = RE.reverse("Base32", out, true);
  expect(back).toBe("Token-123");
});

test("invalid char throws", () => {
  const RE = setup();
  expect(() => RE.reverse("Base32", "@@@"))
    .toThrow(/Invalid Base32 character/);
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