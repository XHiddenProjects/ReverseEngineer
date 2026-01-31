# Adding BijectiveNumeration Algorithm
Importing `BijectiveNumeration` from `algorithms/BijectiveNumeration/BijectiveNumeration.js`

Here is the **example**:

```js
import { BijectiveNumeration } from "./algorithms/BijectiveNumeration/BijectiveNumeration.js";
import { ReverseEngineer } from "./ReverseEngineer.js";

const engineer = new ReverseEngineer();
engineer.getInstance();
engineer.add(BijectiveNumeration);

engineer.init(BijectiveNumeration);
const encoded = engineer.forward(BijectiveNumeration, 123456789);
console.log("Encoded:", encoded);
const decoded = engineer.reverse(BijectiveNumeration, encoded);
console.log("Decoded:", decoded);
```