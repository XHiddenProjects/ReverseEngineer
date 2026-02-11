# VigenereCipher.js

A tiny, dependency‑free **Vigenère cipher** class that **extends** your `ReverseEngineer` container. It performs a polyalphabetic substitution using a repeating key over a configurable alphabet.

- `init()` – optional initialization
- `addForwardAlgorithm(message, key, characters?)` – **encrypt** using the key (default alphabet `A–Z`)
- `addReverseAlgorithm(cipher, key, characters?)` – **decrypt** back to the original

**Case is preserved** for characters found in the alphabet. Characters **not** in the alphabet pass through unchanged.

> ⚠️ **Not secure.** Vigenère is a classical cipher and can be broken using standard cryptanalysis (e.g., Kasiski/Friedman). Use modern cryptography (e.g., **AES‑GCM**) for confidentiality.

---

## Table of Contents

- [VigenereCipher.js](#vigenerecipherjs)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [API](#api)
    - [Class: `VigenereCipher`](#class-vigenerecipher)
      - [Properties](#properties)
      - [Methods](#methods)
  - [Usage Patterns](#usage-patterns)
    - [Basic Encryption/Decryption](#basic-encryptiondecryption)
    - [Key Handling \& Validation](#key-handling--validation)
    - [Custom Alphabets](#custom-alphabets)
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

- 🔁 **Bidirectional** — encrypt (forward) and decrypt (reverse)
- 🧩 **Pluggable** — registers into your existing `ReverseEngineer` system
- 🔤 **Custom alphabet** — default is `ABCDEFGHIJKLMNOPQRSTUVWXYZ`; supply your own unique‑character alphabet
- 🧷 **Case‑preserving** — matched letters keep their original case
- 🧼 **Non‑alphabet characters** pass through unchanged (spaces, punctuation, digits, emoji)
- 🌍 **Works everywhere** — Node.js & browser‑compatible

---

## Prerequisites
- The `ReverseEngineer` class from your project
- Standard JS runtime (no external deps)

---

## Installation

If `VigenereCipher.js` is part of your project:

```js
import { VigenereCipher } from "./VigenereCipher.js";
import { ReverseEngineer } from "./ReverseEngineer.js";
```

No external dependencies are required.

---

## Quick Start

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { VigenereCipher } from "./VigenereCipher.js";

const RE = new ReverseEngineer().getInstance();
RE.add(VigenereCipher);
RE.init("VigenereCipher"); // optional

const key = "LEMON";
const enc = RE.forward("VigenereCipher", "ATTACK AT DAWN", key);
// enc: "LXFOPV EF RNHR" (spacing preserved, case preserved for letters)

const dec = RE.reverse("VigenereCipher", enc, key);
// dec: "ATTACK AT DAWN"
```

---

## API

### Class: `VigenereCipher`

#### Properties
- `version` – Algorithm version (e.g., `"1.0.0"`)
- `description` – Human‑readable description

#### Methods
- **`addForwardAlgorithm(message: string, key: string, characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'): string`**  
  Encrypts `message` with the repeating `key`. Each message character that exists in `characters` is shifted by the index of the corresponding key character (also looked up in `characters`). Case of the original message character is preserved. Characters not present in `characters` are copied as‑is.

- **`addReverseAlgorithm(cipher: string, key: string, characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'): string`**  
  Decrypts with the same `key` by subtracting the key character’s index. Same case‑preserving and pass‑through behavior.

> These method names match the `ReverseEngineer` container and are auto‑bound when you call `RE.add(VigenereCipher)`.

---

## Usage Patterns

### Basic Encryption/Decryption

```js
const key = "LEMON";
const out = RE.forward("VigenereCipher", "Attack at Dawn!", key);
const back = RE.reverse("VigenereCipher", out, key);
```

### Key Handling & Validation

- The key is **required**; empty or missing key throws: `You must include a key`.
- Each key character must exist in `characters`. Otherwise, you’ll get: `Invalid character 'X' in key`.
- Key characters are uppercased internally for indexing; message case is preserved.

### Custom Alphabets

You can supply any **unique‑character** alphabet (e.g., include accented letters or a limited subset):

```js
const ALPH = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"; // mixed‑case alphabet
const key = "Key";
const out = RE.forward("VigenereCipher", "HelloWorld", key, ALPH);
```

> **Case sensitivity note:** The implementation uppercases **key characters** for indexing against `characters`, but does not transform `characters`. If you use a mixed‑case or non‑uppercase alphabet, ensure your key characters also exist in that alphabet (or adapt the class to normalize accordingly).

### Using With ReverseEngineer

```js
const RE = new ReverseEngineer().getInstance().add(VigenereCipher);
RE.init("VigenereCipher"); // optional

console.log(RE.list());
// ["VigenereCipher"]

const out = RE.forward("VigenereCipher", "Hello, World!", "KEY");
const back = RE.reverse("VigenereCipher", out, "KEY");
```

---

## Examples

### Browser Example

```html
<input id="txt" placeholder="Type text..." />
<input id="key" placeholder="Key (e.g., LEMON)" />
<pre id="out"></pre>

<script type="module">
import { ReverseEngineer } from "./ReverseEngineer.js";
import { VigenereCipher } from "./VigenereCipher.js";

const RE = new ReverseEngineer().getInstance().add(VigenereCipher);

const txt = document.getElementById("txt");
const key = document.getElementById("key");
const out = document.getElementById("out");

const run = () => {
  const k = key.value || "";
  out.textContent = k
    ? RE.forward("VigenereCipher", txt.value, k)
    : "(enter a key)";
};

txt.addEventListener("input", run);
key.addEventListener("input", run);
</script>
```

### Node Example

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { VigenereCipher } from "./VigenereCipher.js";

const RE = new ReverseEngineer().getInstance().add(VigenereCipher);

const enc = RE.forward("VigenereCipher", "Server Logs 2026!", "KEY");
const dec = RE.reverse("VigenereCipher", enc, "KEY");
console.log(enc, dec);
```

---

## Troubleshooting

- **`You must include a message`**  
  Provide a non‑empty message to encrypt/decrypt.

- **`You must include a key`**  
  Provide a non‑empty key.

- **`Invalid character 'X' in key`**  
  Ensure every key character exists in your chosen `characters` alphabet.

- **Unexpected characters unchanged**  
  Only characters present in `characters` are transformed; others pass through as‑is.

---

## FAQ

**Is Vigenère secure?**  
No. It is easily broken with classical techniques. Use strong, modern cryptography for any real secrecy.

**Does it preserve case?**  
Yes, message case is preserved. Key case is normalized (uppercased) for indexing.

**How does spacing/punctuation behave?**  
They are preserved but do not consume key characters (in this implementation, non‑alphabet chars are copied and **do not** advance the key index).

---

## Performance Notes

- Linear time over the string (one pass), with constant‑time lookups per character
- Very fast for typical UI and scripting scenarios

---

## Security Notes

- Vigenère provides **no modern security**. For confidentiality, use authenticated encryption like **AES‑GCM** and encode for transport if needed (Base64/Base32/Hex).

---

## Testing

Example Jest tests:

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { VigenereCipher } from "./VigenereCipher.js";

const setup = () => new ReverseEngineer().getInstance().add(VigenereCipher);

test("classic example with key LEMON", () => {
  const RE = setup();
  const s = "ATTACK AT DAWN";
  const out = RE.forward("VigenereCipher", s, "LEMON");
  const back = RE.reverse("VigenereCipher", out, "LEMON");
  expect(back).toBe(s);
});

test("non-letters pass through and do not advance key", () => {
  const RE = setup();
  const s = "A-B C";
  const out = RE.forward("VigenereCipher", s, "KEY");
  const back = RE.reverse("VigenereCipher", out, "KEY");
  expect(back).toBe(s);
});

// invalid key character
 test("invalid key char throws", () => {
  const RE = setup();
  expect(() => RE.forward("VigenereCipher", "Hello", "k3y", "ABCDEFGHIJKLMNOPQRSTUVWXYZ")).toThrow(/Invalid character/);
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