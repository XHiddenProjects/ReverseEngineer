# Adding AESGCM Algorithm
Importing `AESGCM` from `./algorithms/AESGCM/AESGCM.js` this will also require `CryptoUtils` from `ReverseEngineer`

Here is the **example**:

```js
import { AESGCM } from "./algorithms/AESGCM/AESGCM .js";
import { ReverseEngineer, CryptoUtils } from "./ReverseEngineer.js";

const engineer = new ReverseEngineer();
engineer.getInstance();
engineer.add(AESGCM);

const key = CryptoUtils.generateB64Key(32);     // 32 bytes => AES-256 key
await engineer.init(AESGCM, { keyB64: key });   // initializes the stored instance

// ✅ Encrypt
const encrypted = await engineer.forward(AESGCM, "Hello, World!", "optional-aad");
console.log("Encrypted:", encrypted);

// ✅ Decrypt
const decrypted = await engineer.reverse(AESGCM, encrypted, "optional-aad");
console.log("Decrypted:", decrypted);
```