# Adding base64 Algorithm
Importing `Base64` from `algorithms/Base64/Base64.js`

Here is the **example**:

```js
import { Base64 } from "./algorithms/Base64/base64.js";
import { ReverseEngineer } from "./ReverseEngineer.js";

const engineer = new ReverseEngineer();
engineer.getInstance();
engineer.add(Base64);

engineer.init(Base64);
const message = "Hello, World!";
const encoded = engineer.forward(Base64, message, true, { lower: false });
console.log(`Encoded: ${encoded}`);
const decoded = engineer.reverse(Base64, encoded);
console.log(`Decoded: ${decoded}`);
```