# Adding XORCipher Algorithm
Importing `XORCipher` from `algorithms/xorCipher/xorCipher.js`

Here is the **example**:

```js
import { XOR } from "./algorithms/xorCipher/xorCipher.js";
import { ReverseEngineer } from "./ReverseEngineer.js";

const engineer = new ReverseEngineer();
engineer.getInstance();
engineer.add(XOR);

engineer.init(XOR);

const encoded = engineer.forward(XOR, "Hello, World!", "key123", "hex");
console.log("Encoded:", encoded);
const decoded = engineer.reverse(XOR, "3f0c1d070a1d051b0c", "key123", "hex");
console.log("Decoded:", decoded);
```