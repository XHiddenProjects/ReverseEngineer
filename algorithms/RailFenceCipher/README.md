# Adding RailFenceCipher Algorithm
Importing `RailFenceCipher` from `algorithms/RailFenceCipher/RailFenceCipher.js`

Here is the **example**:

```js
import { RailFenceCipher } from "./algorithms/RailFenceCipher/RailFenceCipher.js";
import { ReverseEngineer } from "./ReverseEngineer.js";

const engineer = new ReverseEngineer();
engineer.getInstance();
engineer.add(RailFenceCipher);

engineer.init(RailFenceCipher);

const message = "HELLO RAIL FENCE CIPHER";
const key = 3;
const encoded = engineer.forward("RailFenceCipher", message, key);
console.log("Encoded Message:", encoded);
const decoded = engineer.reverse("RailFenceCipher", encoded, key);
console.log("Decoded Message:", decoded);

```