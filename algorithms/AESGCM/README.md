# AESGCM.js

A compact AES‑GCM implementation that **extends** your `ReverseEngineer` container and uses the browser’s **Web Crypto API** for authenticated encryption. It exposes a consistent API:

- `init({ keyB64 })` – import a Base64 key (16/24/32 bytes)
- `addForwardAlgorithm(plaintext, aad?)` – encrypt → Base64(`iv | ciphertext+tag`)
- `addReverseAlgorithm(packedB64, aad?)` – decrypt Base64 back to UTF‑8 string

> **Note:** This class targets browsers (and Node with Web Crypto available). It depends on your project’s `CryptoUtils` for encoding helpers.

---

## Table of Contents

- [AESGCM.js](#aesgcmjs)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [API](#api)
    - [Class: `AESGCM`](#class-aesgcm)
      - [Properties](#properties)
      - [Methods](#methods)
  - [Usage Patterns](#usage-patterns)
    - [Strings](#strings)
    - [Additional Authenticated Data (AAD)](#additional-authenticated-data-aad)
    - [Interoperability / Payload Format](#interoperability--payload-format)
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

- 🔒 **Authenticated encryption (AEAD)** with **AES‑GCM**
- 🧩 **Pluggable** — registers into your existing `ReverseEngineer` system
- 🧾 **AAD support** — bind extra metadata to each message
- 🧊 **12‑byte IV** per encryption (GCM‑recommended) auto‑generated
- 🗝️ **AES‑128/192/256** (16/24/32‑byte keys; Base64 input)
- 📦 Output is **Base64** of `iv | (ciphertext + 16‑byte tag)`
- 🌍 Works in modern **browsers** and **Node** (with `crypto.subtle` available)

---

## Prerequisites

- `ReverseEngineer` and `CryptoUtils` from your project
- **Secure context** (HTTPS / `localhost`) so the browser exposes `crypto.subtle`
- For **Node.js**, ensure `globalThis.crypto.subtle` is available (Node 18+)

---

## Installation

Place `AESGCM.js` with your sources and import:

```js
import { AESGCM } from "./AESGCM.js";
import { ReverseEngineer, CryptoUtils } from "./ReverseEngineer.js";
```

No external NPM dependencies are required.

---

## Quick Start

```js
import { ReverseEngineer, CryptoUtils } from "./ReverseEngineer.js";
import { AESGCM } from "./AESGCM.js";

const RE = new ReverseEngineer().getInstance();
RE.add(AESGCM);

// Create a 32‑byte random key and Base64‑encode it (AES‑256)
const keyB64 = CryptoUtils.bytesToB64(CryptoUtils.randomBytes(32));

await RE.init("AESGCM", { keyB64 });

const sealed = await RE.forward("AESGCM", "Hello, World!", "aad:demo");
// sealed is Base64(iv|ciphertext+tag)

const plain = await RE.reverse("AESGCM", sealed, "aad:demo");
// plain === "Hello, World!"
```

---

## API

### Class: `AESGCM`

#### Properties
- `version` – Algorithm version (e.g., `"1.1.0"`)
- `description` – Human‑readable description

#### Methods
- **`async init({ keyB64: string }): Promise<this>`**  
  Imports a Base64 raw AES key of 16/24/32 bytes and prepares a non‑extractable `CryptoKey` with usages `encrypt`/`decrypt`.

- **`async addForwardAlgorithm(plaintext: string, aad: string = ""): Promise<string>`**  
  Encrypts UTF‑8 `plaintext` with a random 12‑byte IV and optional AAD. Returns Base64 of `iv | (ciphertext + tag)`.

- **`async addReverseAlgorithm(packedB64: string, aad: string = ""): Promise<string>`**  
  Decrypts a previously produced Base64 payload back to UTF‑8 string. AAD must match.

> These method names match the `ReverseEngineer` container and are auto‑bound when you call `RE.add(AESGCM)`.

---

## Usage Patterns

### Strings

```js
const msg = "Attack at Dawn!";
const sealed = await RE.forward("AESGCM", msg);
const back   = await RE.reverse("AESGCM", sealed);
```

### Additional Authenticated Data (AAD)

```js
const aad = "context:v1:user:123";
const sealed = await RE.forward("AESGCM", "sensitive", aad);
// Must pass the SAME AAD to decrypt successfully
const back = await RE.reverse("AESGCM", sealed, aad);
```

### Interoperability / Payload Format

The output is **standard Base64** of the bytes:

```
[ 12‑byte IV ] [ ciphertext || 16‑byte GCM tag ]
```

To decrypt in another language:
1. Base64‑decode the string.
2. Split first 12 bytes as `iv`.
3. The remainder is `ciphertext+tag` (some libraries want the tag passed separately).
4. Use AES‑GCM (128‑bit tag), same `iv` and `aad`.

### Using With ReverseEngineer

```js
const RE = new ReverseEngineer().getInstance().add(AESGCM);

await RE.init("AESGCM", { keyB64 });

console.log(RE.list());
// ["AESGCM"]

const out = await RE.forward("AESGCM", "Hello");
const back = await RE.reverse("AESGCM", out);
```

---

## Examples

### Browser Example

```html
<input id="txt" placeholder="Type text..." />
<pre id="out"></pre>

<script type="module">
import { ReverseEngineer, CryptoUtils } from "./ReverseEngineer.js";
import { AESGCM } from "./AESGCM.js";

const RE = new ReverseEngineer().getInstance().add(AESGCM);
const keyB64 = CryptoUtils.generateB64Key(32);
await RE.init("AESGCM", { keyB64 });

document.getElementById("txt").addEventListener("input", async (e) => {
  const sealed = await RE.forward("AESGCM", e.target.value);
  document.getElementById("out").textContent = sealed;
});
</script>
```

### Node Example

```js
// Node 18+: make sure crypto.subtle is available
import crypto from 'node:crypto';
if (!globalThis.crypto?.subtle) globalThis.crypto = crypto.webcrypto;

import { ReverseEngineer, CryptoUtils } from "./ReverseEngineer.js";
import { AESGCM } from "./AESGCM.js";

const RE = new ReverseEngineer().getInstance().add(AESGCM);
const keyB64 = CryptoUtils.bytesToB64(CryptoUtils.randomBytes(32));
await RE.init("AESGCM", { keyB64 });

const sealed = await RE.forward("AESGCM", "Server Logs 2026!");
const back   = await RE.reverse("AESGCM", sealed);
console.log(back); // "Server Logs 2026!"
```

---

## Troubleshooting

- **`AESGCM.init requires { keyB64 }`**  
  Provide a Base64 key when calling `init`.

- **`AESGCM key must be 16/24/32 bytes (base64-encoded).`**  
  The decoded key length must match AES‑128/192/256.

- **`Call init({keyB64}) first`**  
  Run `RE.init("AESGCM", { keyB64 })` before encrypt/decrypt.

- **`Invalid AESGCM payload`**  
  The Base64 input was too short or malformed.

- **Web Crypto `OperationError` on decrypt**  
  Wrong key, wrong AAD, or tampered data.

---

## FAQ

**Why include the IV with the ciphertext?**  
The IV isn’t secret, but it must be **unique** per encryption with the same key. Packing it with the ciphertext simplifies storage.

**Can I use URL‑safe Base64?**  
This implementation uses standard Base64. You can adapt `CryptoUtils` to use URL‑safe Base64 if your transport requires it.

**Does this support Uint8Array plaintexts?**  
The current class takes **strings** and returns **strings**. To handle bytes, wrap your data with `CryptoUtils.bytesToUtf8/utf8ToBytes` or extend the class to accept raw buffers.

**Can I choose a custom tag length?**  
Web Crypto’s default is 128 bits for GCM. If you need another tag length, you can pass `tagLength` in the algorithm params when calling `subtle.encrypt/decrypt` (requires modifying the class).

---

## Performance Notes

- 12‑byte IV and 128‑bit tag are standard for efficient GCM usage.
- Encryption is streaming internally within the Web Crypto implementation; large strings are supported, but consider chunking if you hit memory limits.
- Base64 inflates output size by ~33%.

---

## Security Notes

- **Never reuse an IV with the same key.** This class auto‑generates a fresh 12‑byte IV per call.
- Use **AAD** to bind messages to context (user, version, path) and prevent cross‑context replay.
- Protect keys at rest and in transit; rotate keys periodically.
- Only run in a **secure context** so the Web Crypto API is available and trustworthy.

---

## Testing

Example Jest tests:

```js
import crypto from 'node:crypto';
if (!globalThis.crypto?.subtle) globalThis.crypto = crypto.webcrypto;

import { ReverseEngineer, CryptoUtils } from "./ReverseEngineer.js";
import { AESGCM } from "./AESGCM.js";

const setup = async () => {
  const RE = new ReverseEngineer().getInstance().add(AESGCM);
  const keyB64 = CryptoUtils.bytesToB64(CryptoUtils.randomBytes(32));
  await RE.init("AESGCM", { keyB64 });
  return RE;
};

test("roundtrip string", async () => {
  const RE = await setup();
  const s = "Hello, World!";
  const out = await RE.forward("AESGCM", s, "aad:test");
  const back = await RE.reverse("AESGCM", out, "aad:test");
  expect(back).toBe(s);
});

// AAD must match
 test("aad mismatch fails", async () => {
  const RE = await setup();
  const out = await RE.forward("AESGCM", "data", "A");
  await expect(RE.reverse("AESGCM", out, "B")).rejects.toBeTruthy();
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