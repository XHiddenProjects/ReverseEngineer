# Adding CaesarCipher Algorithm
Importing `CaesarCipher` from `algorithms/CaesarCipher/CaesarCipher.js`

Here is the **example**:

```js
import { CaesarCipher } from "./algorithms/CaesarCipher/CaesarCipher.js";
import { ReverseEngineer } from "./ReverseEngineer.js";

const engineer = new ReverseEngineer();
engineer.getInstance();
engineer.add(CaesarCipher);

engineer.init(CaesarCipher);
const encoded = engineer.forward(CaesarCipher, "Hello, World!", 3);
console.log("Encoded:", encoded);
const decoded = engineer.reverse(CaesarCipher, encoded, 3);
console.log("Decoded:", decoded);
```