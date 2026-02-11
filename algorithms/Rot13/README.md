# Rot13.js

A tiny, dependency‑free ROT13 algorithm class that **extends** your `ReverseEngineer` container. It provides a symmetric substitution cipher (A↔N, B↔O, …) with a consistent API:

- `init()` – optional initialization  
- `addForwardAlgorithm()` – apply ROT13  
- `addReverseAlgorithm()` – same as forward; ROT13 is its own inverse  

Supports **strings** and **Uint8Array** inputs.  
String mode rotates alphabetic characters A–Z/a–z.  
Byte mode rotates ASCII letters only.

---

## Table of Contents

- [Rot13.js](#rot13js)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [API](#api)
    - [Class: `Rot13`](#class-rot13)
      - [Properties](#properties)
      - [Methods](#methods)
  - [Usage Patterns](#usage-patterns)
    - [Strings](#strings)
    - [Bytes (Uint8Array)](#bytes-uint8array)
    - [Using With ReverseEngineer](#using-with-reverseengineer)
  - [Examples](#examples)
    - [Browser Example](#browser-example)
    - [Node Buffer Example](#node-buffer-example)
  - [Troubleshooting](#troubleshooting)
  - [FAQ](#faq)
  - [Performance Notes](#performance-notes)
  - [Security Notes](#security-notes)
  - [Testing](#testing)
  - [Versioning](#versioning)
  - [License](#license)

---

## Features

- 🔁 **Symmetric** — forward and reverse are identical  
- 🧩 **Pluggable** — registers into your existing `ReverseEngineer` system  
- 🧵 **Type‑preserving** — outputs the same type as the input  
- 🧼 **Safe** — non‑alpha characters preserved  
- 🌍 **Works everywhere** — Node.js & browser‑compatible  

---

## Prerequisites
- The `ReverseEngineer` class from your project (and optionally `CryptoUtils`)

---

## Installation

If Rot13.js is part of your project:

```js
import { Rot13 } from "./Rot13.js";
import { ReverseEngineer, CryptoUtils } from "./ReverseEngineer.js";
```

No external dependencies are required.

---

## Quick Start

```js
import { ReverseEngineer, CryptoUtils } from "./ReverseEngineer.js";
import { Rot13 } from "./Rot13.js";

const RE = new ReverseEngineer().getInstance();
RE.add(Rot13);

RE.init("Rot13"); // optional (Rot13 will self-init on first use)

console.log(RE.forward("Rot13", "Hello, World!"));
// → "Uryyb, Jbeyq!"

console.log(RE.reverse("Rot13", "Uryyb, Jbeyq!"));
// → "Hello, World!"
```

---

## API

### Class: `Rot13`

#### Properties
- `version` – Algorithm version (e.g., `"1.0.0"`)  
- `description` – Human‑readable description  

#### Methods
- **`init(): void`**  
  Prepares the algorithm (idempotent).  

- **`addForwardAlgorithm(input: string | Uint8Array): string | Uint8Array`**  
  Applies ROT13 to strings or `Uint8Array`.  
  Returns the same type as given.

- **`addReverseAlgorithm(input: string | Uint8Array): string | Uint8Array`**  
  Identical to forward — ROT13 is symmetric.  

> These method names match the `ReverseEngineer` container’s expectations and are automatically bound when you call `RE.add(Rot13)`.

---

## Usage Patterns

### Strings

```js
const encoded = RE.forward("Rot13", "Attack at Dawn!");
// "Nggnpx ng Qnja!"

const decoded = RE.reverse("Rot13", encoded);
// "Attack at Dawn!"
```

### Bytes (Uint8Array)

```js
const bytesIn  = CryptoUtils.utf8ToBytes("Attack at Dawn!");
const bytesOut = RE.forward("Rot13", bytesIn);

console.log(CryptoUtils.bytesToUtf8(bytesOut));
// "Nggnpx ng Qnja!"
```

### Using With ReverseEngineer

```js
const RE = new ReverseEngineer().getInstance();

RE.add(Rot13);
RE.init("Rot13"); // optional

console.log(RE.list());  
// ["Rot13"]

// You can reference the algorithm by class or by name:
const out1 = RE.forward(Rot13, "Hello");
const back1 = RE.reverse(Rot13, out1);

const out2 = RE.forward("Rot13", "Hello");
const back2 = RE.reverse("Rot13", out2);
```

---


## Examples

### Browser Example

```html
<input id="txt" placeholder="Type text..." />
<pre id="out"></pre>

<script type="module">
import { ReverseEngineer } from "./ReverseEngineer.js";
import { Rot13 } from "./Rot13.js";

const RE = new ReverseEngineer().getInstance().add(Rot13);

document.getElementById("txt").addEventListener("input", (e) => {
  document.getElementById("out").textContent =
    RE.forward("Rot13", e.target.value);
});
</script>
```

### Node Buffer Example

```js
import { ReverseEngineer, CryptoUtils } from "./ReverseEngineer.js";
import { Rot13 } from "./Rot13.js";

const RE = new ReverseEngineer().getInstance().add(Rot13);

const buf = Buffer.from("Server Logs 2026!", "utf8");
const bytes = new Uint8Array(buf);

const rotated = RE.forward("Rot13", bytes);

console.log(Buffer.from(rotated).toString());
// "Freire Ybtf 2026!"
```

---

## Troubleshooting

- **Error: `X has not been instanced`**  
  → Call `RE.add(Rot13)` before using it (and optionally `RE.init("Rot13")`).

- **Not rotating accented characters**  
  → ROT13 is defined only for ASCII A–Z/a–z.

- **Type errors**  
  → Ensure the input is either a **string** or **Uint8Array**.

---

## FAQ

**Is ROT13 encryption?**  
No — it is a trivial substitution cipher suitable only for lightweight obfuscation.

**Why do forward and reverse do the same thing?**  
ROT13 is an involution: applying it twice returns the original.

---

## Performance Notes

- Single‑pass implementation for both strings and byte arrays  
- Fast enough for real‑time use and large buffers  
- For extremely large inputs, consider chunking to reduce peak memory

---

## Security Notes

- ROT13 is **not secure** and should not be used for confidentiality  
- For real encryption needs, use modern, vetted cryptography (e.g., AES‑GCM via WebCrypto)

---

## Testing

Example Jest test:

```js
test("roundtrip string", () => {
  const RE = new ReverseEngineer().getInstance().add(Rot13);
  const s = "Hello, World!";
  expect(RE.reverse("Rot13", RE.forward("Rot13", s))).toBe(s);
});

test("roundtrip bytes", () => {
  const RE = new ReverseEngineer().getInstance().add(Rot13);
  const input = CryptoUtils.utf8ToBytes("Attack at Dawn!");
  const out = RE.forward("Rot13", input);
  const back = RE.reverse("Rot13", out);
  expect(CryptoUtils.bytesToUtf8(back)).toBe("Attack at Dawn!");
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
