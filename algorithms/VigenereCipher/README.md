# Adding VigenereCipher Algorithm
Importing `VigenereCipher` from `algorithms/VigenereCipher/VigenereCipher.js`

Here is the **example**:

```js
import { VigenereCipher } from "./algorithms/VigenereCipher/VigenereCipher.js";
import { ReverseEngineer } from "./ReverseEngineer.js";

const engineer = new ReverseEngineer();
engineer.getInstance();
engineer.add(VigenereCipher);

engineer.init(VigenereCipher);
const encoded = engineer.forward(VigenereCipher, "Hello, World!", "key");
console.log("Encoded:", encoded);
const decoded = engineer.reverse(VigenereCipher, encoded, "key");
console.log("Decoded:", decoded);
```