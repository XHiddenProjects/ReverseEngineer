# XOR.js

A tiny, dependency‑free **XOR cipher** class that **extends** your `ReverseEngineer` container. It applies a repeating‑key XOR over JavaScript string code units and can emit output as **text**, **hex**, or **binary**.

- `init()` – optional initialization
- `addForwardAlgorithm(message, key, returnAs?)` – **encrypt** (default `returnAs = 'text'`)
- `addReverseAlgorithm(encoded, key, inputAs?)` – **decrypt** (default `inputAs = 'text'`)

> ⚠️ **Not secure.** XOR with a repeating key is vulnerable to known‑plaintext and statistical attacks. Use modern cryptography (**AES‑GCM** via Web Crypto) for confidentiality.

---

## Table of Contents

- [XOR.js](#xorjs)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [API](#api)
    - [Class: `XOR`](#class-xor)
      - [Properties](#properties)
      - [Methods](#methods)
  - [Usage Patterns](#usage-patterns)
    - [Text ⇄ Text](#text--text)
    - [Text ⇄ Hex](#text--hex)
    - [Text ⇄ Binary](#text--binary)
    - [Using With ReverseEngineer](#using-with-reverseengineer)
  - [Examples](#examples)
    - [Browser Example](#browser-example)
    - [Node Example](#node-example)
  - [Limitations \& Notes](#limitations--notes)
  - [Troubleshooting](#troubleshooting)
  - [FAQ](#faq)
  - [Performance Notes](#performance-notes)
  - [Security Notes](#security-notes)
  - [Testing](#testing)
  - [Versioning](#versioning)
  - [License](#license)

---

## Features

- 🔁 **Bidirectional & symmetric** — same operation for encrypt/decrypt with the same key
- 🧩 **Pluggable** — integrates with your `ReverseEngineer` container
- 🔀 **Flexible I/O** — emit/accept **text**, **hex**, or **binary** (8‑bit string) representations
- 🧵 **Repeating key** — key cycles automatically across the message length
- 🌍 **Works everywhere** — Browser & Node, no external dependencies

---

## Prerequisites
- `ReverseEngineer` class from your project
- Standard JS runtime (no external deps)

---

## Installation

If `XOR.js` is part of your project:

```js
import { XOR } from "./XOR.js";
import { ReverseEngineer } from "./ReverseEngineer.js";
```

No external dependencies are required.

---

## Quick Start

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { XOR } from "./XOR.js";

const RE = new ReverseEngineer().getInstance();
RE.add(XOR);
RE.init("XOR"); // optional

const key = "secret";

// Text → Text
const encText = RE.forward("XOR", "Hello, World!", key, "text");
const decText = RE.reverse("XOR", encText, key, "text");

// Text → Hex → Text
const encHex = RE.forward("XOR", "Hello, World!", key, "hex");
const decFromHex = RE.reverse("XOR", encHex, key, "hex");

// Text → Binary → Text
const encBin = RE.forward("XOR", "Hello, World!", key, "binary");
const decFromBin = RE.reverse("XOR", encBin, key, "binary");
```

---

## API

### Class: `XOR`

#### Properties
- `version` – Algorithm version (e.g., `"1.0.0"`)
- `description` – Human‑readable description

#### Methods
- **`addForwardAlgorithm(message: string, key: string, returnAs: 'text' | 'hex' | 'binary' = 'text'): string`**  
  Encrypts `message` by XORing each character code with the corresponding (repeating) key character code. Output format options:
  - `text`: returns a JS string made from the XORed code units
  - `hex`: returns a lowercase hex string (**two digits per byte**) of the XORed code units
  - `binary`: returns an 8‑bit binary string (**8 chars per byte**) of the XORed code units

- **`addReverseAlgorithm(encoded: string, key: string, inputAs: 'text' | 'hex' | 'binary' = 'text'): string`**  
  Decrypts by converting `encoded` from the specified representation back to raw XORed code units (if needed) and applying XOR with the same repeating `key`. Returns the **plaintext string**.

> These method names match the `ReverseEngineer` container and are auto‑bound when you call `RE.add(XOR)`.

---

## Usage Patterns

### Text ⇄ Text

```js
const out = RE.forward("XOR", "Attack at Dawn!", "key", "text");
const back = RE.reverse("XOR", out, "key", "text");
```

### Text ⇄ Hex

```js
const hexOut = RE.forward("XOR", "Token-123", "k", "hex");
const plain   = RE.reverse("XOR", hexOut, "k", "hex");
```

### Text ⇄ Binary

```js
const binOut = RE.forward("XOR", "ABCD", "K", "binary"); // 8 bits per byte
const plain  = RE.reverse("XOR", binOut, "K", "binary");
```

### Using With ReverseEngineer

```js
const RE = new ReverseEngineer().getInstance().add(XOR);
RE.init("XOR"); // optional

console.log(RE.list());
// ["XOR"]

const out = RE.forward("XOR", "Hello", "secret", "hex");
const back = RE.reverse("XOR", out, "secret", "hex");
```

---

## Examples

### Browser Example

```html
<input id="txt" placeholder="Type text..." />
<input id="key" placeholder="Key" />
<select id="fmt">
  <option value="text">text</option>
  <option value="hex">hex</option>
  <option value="binary">binary</option>
</select>
<pre id="out"></pre>

<script type="module">
import { ReverseEngineer } from "./ReverseEngineer.js";
import { XOR } from "./XOR.js";

const RE = new ReverseEngineer().getInstance().add(XOR);

const txt = document.getElementById("txt");
const key = document.getElementById("key");
const fmt = document.getElementById("fmt");
const out = document.getElementById("out");

const run = () => {
  const k = key.value || "";
  out.textContent = k
    ? RE.forward("XOR", txt.value, k, fmt.value)
    : "(enter a key)";
};

txt.addEventListener("input", run);
key.addEventListener("input", run);
fmt.addEventListener("change", run);
</script>
```

### Node Example

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { XOR } from "./XOR.js";

const RE = new ReverseEngineer().getInstance().add(XOR);

const enc = RE.forward("XOR", "Server Logs 2026!", "secret", "hex");
const dec = RE.reverse("XOR", enc, "secret", "hex");
console.log(enc, dec);
```

---

## Limitations & Notes

- **String code units, not bytes:** The implementation operates on **JavaScript UTF‑16 code units** via `charCodeAt`/`fromCharCode`. For **ASCII/Latin‑1** text this behaves like byte‑wise XOR. For characters with code points **> 255**, results may be surprising.
- **Hex/Binary modes are 8‑bit:** When emitting **hex** or **binary**, each XORed code unit is converted to a single **byte** (the low 8 bits) and padded to 2 hex digits / 8 binary digits. Consequently, non‑ASCII text **won’t round‑trip** through hex/binary modes.
- **Even/Multiple‑of‑8 length required:** For **hex** input, length must be **even**. For **binary** input, length must be a **multiple of 8**.
- **Key management:** The key repeats; short keys leak patterns.

**Need robust, byte‑true XOR?** Convert your text to **UTF‑8 bytes** (e.g., `TextEncoder`), XOR bytes with a byte key, then encode (hex/Base64). That requires a different, byte‑oriented implementation.

---

## Troubleshooting

- **`You must include a message` / `You must include an encoded message`**  
  Provide a non‑empty string.

- **`You must include a key`**  
  Provide a non‑empty key.

- **Hex decode looks wrong**  
  Ensure the hex string length is **even** and characters are valid hex.

- **Binary decode looks wrong**  
  Ensure the binary string length is a **multiple of 8** and only contains `0`/`1`.

---

## FAQ

**Is XOR secure if I keep the key secret?**  
Not with a repeating key. It’s vulnerable to frequency and crib attacks. Use **one‑time pads** only with truly random, single‑use keys equal to message length (and careful handling) — impractical for most applications. Prefer **AES‑GCM** for real security.

**Why does non‑ASCII text not round‑trip with hex/binary?**  
Because the implementation collapses each JS code unit to 8 bits in those modes. Use a byte‑based approach for Unicode correctness.

**Can I XOR binary files?**  
Not directly with this string‑oriented class. Convert the data to a string carefully (or use a byte‑oriented XOR helper) to avoid corruption.

---

## Performance Notes

- Linear time over input length
- Simple arithmetic/bitwise ops — very fast for typical scripting

---

## Security Notes

- This is **not** modern encryption. For confidentiality and integrity, use authenticated encryption like **AES‑GCM** and then encode for transport if needed (Base64/Base32/Hex).

---

## Testing

Example Jest tests:

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { XOR } from "./XOR.js";

const setup = () => new ReverseEngineer().getInstance().add(XOR);

test("text roundtrip", () => {
  const RE = setup();
  const s = "Hello, World!";
  const out = RE.forward("XOR", s, "secret", "text");
  const back = RE.reverse("XOR", out, "secret", "text");
  expect(back).toBe(s);
});

test("hex roundtrip", () => {
  const RE = setup();
  const s = "Attack at Dawn!";
  const out = RE.forward("XOR", s, "k", "hex");
  const back = RE.reverse("XOR", out, "k", "hex");
  expect(back).toBe(s);
});

test("binary roundtrip", () => {
  const RE = setup();
  const s = "ABCD";
  const out = RE.forward("XOR", s, "K", "binary");
  const back = RE.reverse("XOR", out, "K", "binary");
  expect(back).toBe(s);
});

// invalid lengths
 test("bad hex length throws or decodes incorrectly (documented)", () => {
  const RE = setup();
  const badHex = "ABC"; // odd length
  const back = RE.reverse("XOR", badHex, "k", "hex");
  expect(typeof back).toBe("string"); // behavior depends on parsing; ensure your inputs are valid
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