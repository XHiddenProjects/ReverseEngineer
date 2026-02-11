# BijectiveNumeration.js

A tiny, dependency‑free **bijective numeration** algorithm class that **extends** your `ReverseEngineer` container. It provides base‑N **encode/decode** using a **bijective** alphabet (no zero digit). The default alphabet is `A–Z`, which matches Excel‑style column labels (`A, B, …, Z, AA, AB, …`).

- `init()` – optional initialization
- `addForwardAlgorithm(number, alphabet?)` – **encode** non‑negative integers → string
- `addReverseAlgorithm(code, alphabet?)` – **decode** string → non‑negative integer

> In bijective numeration: `A` represents **1** internally. This implementation maps the external **integer 0** → `"A"`, **1** → `"B"`, etc., so round‑trips are consistent (0 ⇄ "A").

---

## Table of Contents

- [BijectiveNumeration.js](#bijectivenumerationjs)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Quick Start](#quick-start)
  - [API](#api)
    - [Class: `BijectiveNumeration`](#class-bijectivenumeration)
      - [Properties](#properties)
      - [Methods](#methods)
  - [Usage Patterns](#usage-patterns)
    - [Excel‑style A–Z Labels](#excelstyle-az-labels)
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

- 🔁 **Bidirectional** — encode non‑negative integers and decode codes back
- 🧩 **Pluggable** — registers into your existing `ReverseEngineer` system
- 🔤 **Custom alphabet** — use any unique character set (no zero digit, e.g., `ABCDEFGHIJKLMNOPQRSTUVWXYZ`)
- 🧮 **Excel‑style mapping** — defaults to A–Z and yields familiar sequences (`A, B, …, Z, AA, AB, …`)
- 🌍 **Works everywhere** — Node.js & browser‑compatible

---

## Prerequisites
- The `ReverseEngineer` class from your project
- Environment with standard JS runtime (no external deps)

---

## Installation

If `BijectiveNumeration.js` is part of your project:

```js
import { BijectiveNumeration } from "./BijectiveNumeration.js";
import { ReverseEngineer } from "./ReverseEngineer.js";
```

No external dependencies are required.

---

## Quick Start

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { BijectiveNumeration } from "./BijectiveNumeration.js";

const RE = new ReverseEngineer().getInstance();
RE.add(BijectiveNumeration);
RE.init("BijectiveNumeration"); // optional

console.log(RE.forward("BijectiveNumeration", 0));   // "A"
console.log(RE.forward("BijectiveNumeration", 25));  // "Z"
console.log(RE.forward("BijectiveNumeration", 26));  // "AA"
console.log(RE.reverse("BijectiveNumeration", "ZZ")); // 701
```

---

## API

### Class: `BijectiveNumeration`

#### Properties
- `version` – Algorithm version (e.g., `"1.0.0"`)
- `description` – Human‑readable description

#### Methods
- **`init(): void`**  
  Optional setup; logs a debug message that the algorithm is loaded.

- **`addForwardAlgorithm(message: number, alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'): string`**  
  Encodes a **non‑negative integer** using bijective numeration with the given `alphabet`. `message` must be an **integer ≥ 0**. Returns the encoded string.  
  *Edge case:* When `message === 0`, this implementation returns `"A"` (first symbol), keeping round‑trip symmetry with the decoder.

- **`addReverseAlgorithm(code: string, alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'): number`**  
  Decodes a bijective‑encoded string back to a **non‑negative integer**. Throws if the string contains a character not present in `alphabet`.

> These method names match the `ReverseEngineer` container and are auto‑bound when you call `RE.add(BijectiveNumeration)`.

---

## Usage Patterns

### Excel‑style A–Z Labels

```js
// Default alphabet = 'A'..'Z'
RE.forward("BijectiveNumeration", 0);   // "A"
RE.forward("BijectiveNumeration", 25);  // "Z"
RE.forward("BijectiveNumeration", 26);  // "AA"
RE.forward("BijectiveNumeration", 27);  // "AB"
RE.reverse("BijectiveNumeration", "AAA"); // 702
```

### Custom Alphabets

You can use any **unique‑character** alphabet, e.g., digits without zero, or a mixed set:

```js
// Base‑9 (digits 1..9); note there is **no zero** in bijective systems
const ALPH9 = "123456789";

RE.forward("BijectiveNumeration", 0, ALPH9);   // "1"
RE.forward("BijectiveNumeration", 8, ALPH9);   // "9"
RE.forward("BijectiveNumeration", 9, ALPH9);   // "11"
RE.reverse("BijectiveNumeration", "99", ALPH9); // 80

// Mixed case custom alphabet (ensure your decode alphabet matches input case)
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I or O, for example
RE.forward("BijectiveNumeration", 31, ALPHA);  // "AF" (example)
```

> **Case sensitivity note:** `addReverseAlgorithm` uppercases the **input** but does **not** alter the `alphabet`. If you pass a custom alphabet, ensure it contains the **uppercase** symbols you expect (or adapt the class to uppercase the alphabet internally).

### Using With ReverseEngineer

```js
const RE = new ReverseEngineer().getInstance().add(BijectiveNumeration);
RE.init("BijectiveNumeration"); // optional

console.log(RE.list());
// ["BijectiveNumeration"]

const out = RE.forward("BijectiveNumeration", 12345);
const back = RE.reverse("BijectiveNumeration", out);
```

---

## Examples

### Browser Example

```html
<input id=\"num\" type=\"number\" min=\"0\" placeholder=\"Enter a number...\" />
<pre id=\"out\"></pre>

<script type=\"module\">
import { ReverseEngineer } from "./ReverseEngineer.js";
import { BijectiveNumeration } from "./BijectiveNumeration.js";

const RE = new ReverseEngineer().getInstance().add(BijectiveNumeration);

const num = document.getElementById("num");
const out = document.getElementById("out");

num.addEventListener("input", (e) => {
  const n = Number(e.target.value);
  if (Number.isInteger(n) && n >= 0) {
    out.textContent = RE.forward("BijectiveNumeration", n);
  } else {
    out.textContent = "";
  }
});
</script>
```

### Node Example

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { BijectiveNumeration } from "./BijectiveNumeration.js";

const RE = new ReverseEngineer().getInstance().add(BijectiveNumeration);

const code = RE.forward("BijectiveNumeration", 701); // "ZZ"
const n = RE.reverse("BijectiveNumeration", code);   // 701
console.log(code, n);
```

---

## Troubleshooting

- **`message must be a number`**  
  Ensure you pass an **integer ≥ 0** to the encoder.

- **`Invalid character 'X' in code`**  
  The decoder saw a char not present in your `alphabet`. Make sure the input uses the same alphabet that was intended for encoding.

- **Custom alphabet + lowercase input doesn’t decode**  
  The decoder uppercases the input but doesn’t change the alphabet. Provide an **uppercase alphabet** or modify the class to normalize the alphabet.

---

## FAQ

**Why is 0 encoded as `"A"`?**  
In bijective numeration, the first symbol represents 1. This library maps external integer **0** to the first symbol to keep round‑trip behavior simple (0 ⇄ "A").

**Can I include digits or symbols in the alphabet?**  
Yes—any unique characters are fine. Avoid a zero‑like symbol if you expect human entry confusion.

**Is this the same as base‑N with zero?**  
No. Bijective numeration has no zero digit; digit values are 1..N.

---

## Performance Notes

- Encoding and decoding are **O(log_base(n))** with small constant factors
- Uses JS `Number`; maximum safe input/output is up to **2^53 − 1** (≈ 9e15). For larger integers, consider `BigInt` and adapt the implementation.

---

## Security Notes

- This is **not** encryption. Do not use to protect secrets.

---

## Testing

Example Jest tests:

```js
import { ReverseEngineer } from "./ReverseEngineer.js";
import { BijectiveNumeration } from "./BijectiveNumeration.js";

const setup = () => new ReverseEngineer().getInstance().add(BijectiveNumeration);

test("excel-style roundtrip", () => {
  const RE = setup();
  const cases = [0, 1, 25, 26, 27, 701, 702, 703];
  for (const n of cases) {
    const code = RE.forward("BijectiveNumeration", n);
    const back = RE.reverse("BijectiveNumeration", code);
    expect(back).toBe(n);
  }
});

test("custom alphabet roundtrip", () => {
  const RE = setup();
  const ALPH9 = "123456789";
  const n = 80; // "99" in ALPH9
  const code = RE.forward("BijectiveNumeration", n, ALPH9);
  const back = RE.reverse("BijectiveNumeration", code, ALPH9);
  expect(back).toBe(n);
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