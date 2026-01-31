# Adding Base32 Algorithm
Importing `Base32` from `algorithms/Base32/base32.js`

Here is the **example**:

```js
import { Base32 } from "./algorithms/Base32/base32.js";
import { ReverseEngineer } from "./ReverseEngineer.js";

const engineer = new ReverseEngineer();
engineer.getInstance();
engineer.add(Base32);

engineer.init(Base32);
const message = "Hello, World!";
const encoded = engineer.forward(Base32, message, true, { lower: false });
console.log(`Encoded: ${encoded}`);
const decoded = engineer.reverse(Base32, encoded);
console.log(`Decoded: ${decoded}`);
```