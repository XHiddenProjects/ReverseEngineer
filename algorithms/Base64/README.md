# Base64.js

A tiny, dependency‑free Base64 algorithm class that **extends** your `ReverseEngineer` container. It provides RFC 4648 Base64 **encoding/decoding** with a consistent API:

- `init()` – optional initialization
- `addForwardAlgorithm(message, sanitize?, sanitizeOptions?)` – **encode** to Base64 (standard or URL‑safe)
- `addReverseAlgorithm(base64, isSanitized?, decodeOptions?)` – **decode** from Base64 (handles URL‑safe + missing padding)

Supports **string** inputs/outputs with optional sanitization for transport‑safe tokens.

---

## Table of Contents

- [Base64.js](#base64js)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [API](#api)
    - [Class: `Base64`](#class-base64)
      - [Properties](#properties)
      - [Methods](#methods)
  - [Usage Patterns](#usage-patterns)
    - [Basic Encode/Decode](#basic-encodedecode)
    - [URL‑Safe (Base64URL) Encoding](#urlsafe-base64url-encoding)
    - [Sanitized Output (no padding / lowercase / no spaces)](#sanitized-output-no-padding--lowercase--no-spaces)
    - [Decoding Sanitized or URL‑Safe Variants](#decoding-sanitized-or-urlsafe-variants)
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
- 🧩 **Pluggable** — registers into your existing `ReverseEngineer` system
- 🔀 **URL‑safe option** — `+`/`/` → `-`/`_` (Base64URL)
- 🧼 **Sanitization options** — trim `=`, remove whitespace, optional lowercase
- 🧵 **Type‑preserving** — always returns **string** output
- 🌍 **Works everywhere** — Browser & Node (polyfill `atob`/`btoa` if needed)

---

## Prerequisites
- The `ReverseEngineer` class from your project
- Environment with **TextEncoder/TextDecoder** (modern browsers, Node 18+, or polyfill)
- Browser or polyfilled **`atob`/`btoa`** (see Node example below)

---

## Installation

If `Base64.js` is part of your project:

```js
import { Base64 } from "./Base64.js";
import { ReverseEngineer } from "./ReverseEngineer.js";
```

No external dependencies are required.

---

## Quick Start

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { Base64 } from "./Base64.js";

const RE = new ReverseEngineer().getInstance();
RE.add(Base64);
RE.init("Base64"); // optional

const enc = RE.forward("Base64", "Hello, World!");
// enc: "SGVsbG8sIFdvcmxkIQ=="

const dec = RE.reverse("Base64", enc);
// dec: "Hello, World!"
```

---

## API

### Class: `Base64`

#### Properties
- `version` – Algorithm version (e.g., `"1.0.0"`)
- `description` – Human‑readable description

#### Methods
- **`init(): void`**  
  Optional setup; logs a debug message that the algorithm is loaded.

- **`addForwardAlgorithm(message: string, sanitize = false, sanitizeOptions = { lower: false, urlSafe: false }): string`**  
  Encodes UTF‑8 input to **standard Base64** using `btoa`. If `sanitize` is true, removes whitespace and padding, optionally converts to **URL‑safe Base64** (`-`/`_`) and can lowercase (non‑standard, but supported by this API).

- **`addReverseAlgorithm(base64: string, isSanitized = false, decodeOptions = { urlSafe: true }): string`**  
  Decodes a Base64 string to UTF‑8. If `isSanitized` is true, normalizes URL‑safe characters to standard `+`/`/`, removes whitespace, and restores missing padding to a multiple of 4.

> These method names match the `ReverseEngineer` container and are auto‑bound when you call `RE.add(Base64)`.

---

## Usage Patterns

### Basic Encode/Decode

```js
const s = "Attack at Dawn!";
const b64 = RE.forward("Base64", s);
const back = RE.reverse("Base64", b64);
```

### URL‑Safe (Base64URL) Encoding

```js
const token = RE.forward(
  "Base64",
  JSON.stringify({ sub: "123", iat: 1736539200 }),
  true,
  { urlSafe: true }
);
// e.g., "eyJzdWIiOiIxMjMiLCJpYXQiOjE3MzY1MzkyMDB9" (no padding, URL‑safe)
```

### Sanitized Output (no padding / lowercase / no spaces)

```js
const encSan = RE.forward("Base64", "Token-123", true, { lower: true, urlSafe: true });
// "VG9rZW4tMTIz" -> sanitized (no padding, url‑safe, lowercase if requested)
```

### Decoding Sanitized or URL‑Safe Variants

```js
// Accepts URL‑safe, missing padding, no spaces
const decoded = RE.reverse("Base64", "U2VydmVyIExvZ3MgMjAyNiE", true);
// "Server Logs 2026!"
```

### Using With ReverseEngineer

```js
const RE = new ReverseEngineer().getInstance().add(Base64);
RE.init("Base64"); // optional

console.log(RE.list());
// ["Base64"]

const out = RE.forward("Base64", "Hello");
const back = RE.reverse("Base64", out);
```

---

## Examples

### Browser Example

```html
<input id="txt" placeholder="Type text..." />
<pre id="out"></pre>

<script type="module">
import { ReverseEngineer } from "./ReverseEngineer.js";
import { Base64 } from "./Base64.js";

const RE = new ReverseEngineer().getInstance().add(Base64);

document.getElementById("txt").addEventListener("input", (e) => {
  // URL‑safe, unpadded output for transport
  const b64 = RE.forward("Base64", e.target.value, true, { urlSafe: true });
  document.getElementById("out").textContent = b64;
});
</script>
```

### Node Example

```js
// Node: Provide atob/btoa if not present (Buffer bridge)
if (typeof globalThis.atob !== 'function') {
  globalThis.atob = (str) => Buffer.from(str, 'base64').toString('binary');
}
if (typeof globalThis.btoa !== 'function') {
  globalThis.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}

import { ReverseEngineer } from "./ReverseEngineer.js";
import { Base64 } from "./Base64.js";

const RE = new ReverseEngineer().getInstance().add(Base64);

const enc = RE.forward("Base64", "Server Logs 2026!", true, { urlSafe: true });
const dec = RE.reverse("Base64", enc, true);
console.log(enc, dec);
```

---

## Troubleshooting

- **`X has not been instanced`**  
  Call `RE.add(Base64)` before using it (and optionally `RE.init("Base64")`).

- **`Invalid Base64 input (after normalization).`**  
  The decoder rejected the string. Ensure the input is valid Base64 (standard or URL‑safe), and use `isSanitized=true` if padding is removed or URL‑safe characters are used.

- **Lowercased strings don’t decode**  
  Base64 is **case‑sensitive**. If the source was lowercased, the data is corrupted; there is no reliable automatic fix.

---

## FAQ

**Is Base64 encryption?**  
No — it’s a binary‑to‑text **encoding**. Use cryptography (e.g., AES‑GCM) for confidentiality.

**Why do I see `=` padding?**  
Standard Base64 pads to a multiple of 4 chars with `=`. You can omit it for transport via the **sanitize** option; the decoder restores padding automatically.

**What’s the difference between Base64 and Base64URL?**  
Base64URL replaces `+` and `/` with `-` and `_` and typically drops padding, making it safe for URLs/cookies. This class can emit and accept both forms.

---

## Performance Notes

- Single‑pass conversion using `TextEncoder`/`TextDecoder` and `atob`/`btoa`
- Sanitization/normalization are linear in input size
- Base64 inflates data size by ~33%

---

## Security Notes

- Base64 is **not** secure. It provides no confidentiality or integrity
- For secrets, pair with authenticated encryption (e.g., AES‑GCM) and then encode if needed

---

## Testing

Example Jest tests:

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { Base64 } from "./Base64.js";

const setup = () => new ReverseEngineer().getInstance().add(Base64);

test("roundtrip string", () => {
  const RE = setup();
  const s = "Hello, World!";
  const out = RE.forward("Base64", s);
  const back = RE.reverse("Base64", out);
  expect(back).toBe(s);
});

test("url‑safe sanitized roundtrip", () => {
  const RE = setup();
  const out = RE.forward("Base64", "Token-123", true, { urlSafe: true });
  const back = RE.reverse("Base64", out, true);
  expect(back).toBe("Token-123");
});

test("invalid input throws", () => {
  const RE = setup();
  expect(() => RE.reverse("Base64", "@@@"))
    .toThrow(/Invalid Base64 input/);
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