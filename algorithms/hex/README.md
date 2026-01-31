# Adding Hex Algorithm
Importing `hex` from `algorithms/hex/hex.js`

Here is the **example**:

```js
import { Hex } from "./algorithms/hex/hex.js";
import { ReverseEngineer } from "./ReverseEngineer.js";

const engineer = new ReverseEngineer();
engineer.getInstance();
engineer.add(Hex);

engineer.init(Hex);
const encoded = engineer.forward(Hex, "Hello, World!");
console.log("Encoded:", encoded);
const decoded = engineer.reverse(Hex, encoded);
console.log("Decoded:", decoded);
```