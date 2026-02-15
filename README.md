# ReverseEngineer
ReverseEngineer is a ES6 JS library algorithm that developers can create their own custom algorithm or use existing algorithms to reverse and forward strings

## Table of contents
- [Requirements](#requirements)
- [Installation](#installation)
- [Executing the methods](#executing-the-methods)
- [Developers](#developers)
- [CryptoUtils](#cryptoUtils)
- [GUI](#gui)

## Requirements
1. ReverseEngineer.js
2. `ciphers`/`encoders`/`encryptions`/`hashing` folder - This contains predefined scripts.
3. `themes` folder - Themes for the editor

## Installation
> **Notice:** Each algorithm will have a **README.md** in the folders to show what will the algorithms will return
1. In a HTML file include a module script
```html
<!DOCTYPE html>
<html>
<head>
...
</head>
<body>
...
<script src=".../path/to/main_script.js" type="module"></script>
</body>
</html>
```
2. In the _main.js_ or whatever you called it, time to import
```js
// Import algorithm(s) and replace Algorithm_class with the actuall Algorithm namew and the Algorithm_path with actual path
import {Algorithm_class} from Algorithm_path
//CryptoUtils is optional, UNLESS analgorithm requries it
import { ReverseEngineer, CryptoUtils } from "./ReverseEngineer.js";
// Create Reverse Engineer object
const engineer = new ReverseEngineer();
```
3. Create an instance **(this is required)**
```js
//Create Instance
engineer.getInstance();
```
4. Now add the algorithms to the object
```js
// Replace Algorithm_class_name with Algorithm Class 
engineer.add(Algorithm_class_name);
// You can add more
```

## Executing the methods
There are 3 methods that **ReverseEngineer** uses
| Method Name | Description | Return Value |
| ----------- | ----------- | ------------ |
| init        | Executes code on load | `any` |
| forward     | Forwards the algorithm | `any` |
| revese      | Reverses the algorithm | `any` |

> Definations:
> 
> **Forward** means to go from plain text to encoded string base on the algorithm
> 
> **Reverse** means to go from encoded algorithm to plain text


To execute, use the `.init|forward|reverse` method
```js
engineer.init(Algorithm_Class_Object,...params); //Lunches the init function of the algorithm class object
engineer.forward(Algorithm_Class_Object,...params); //Lunchs the forward function of the algorithm class object
engineer.reverse(Algorithm_Class_Object,...params); //Lunches the reverse function of the algorithm class object
```

## Developers
To create your own algortihm you have to extend on the **ReverseEngineer**
1. import `ReverseEngineer`
```js
import { ReverseEngineer } from '.../path/to/ReverseEngineer.js';
```
2. Create a _constant_ class for you algorithm
```js
export const AlgorithmName = class extends ReverseEngineer{
  //Configuration
  static name = 'Metadata name for the class';
  static description = 'Metadata description for the class';
  static version = 'Metadata version of the class';
  static category = 'Metadata category for the algorithm';
  static tags = ['Metadata tags for the algorithm'];
  static UI_POLICY: { // Creates a policy for the GUI
    requiresInit: boolean,
    directions: {
        init: {
            input: boolean,
            args: boolean,
            inputPh: string,
            argsPh: string,
            allowFile: boolean
        };
        forward: {
            input: boolean,
            args: boolean,
            inputPh: string,
            argsPh: string,
            allowFile: boolean
        };
        reverse: {
            input: boolean,
            args: boolean,
            inputPh: string,
            argsPh: string,
            allowFile: boolean
        };
    }
  }
  constructor(){
    super();
    this.getInstance();
  }
}
```
3. Triggering _Initialization_ function
```js
init(...?params){
  // Enter code here
}
```
4. Triggering _forward_ algorithm
```js
addForwardAlgorithm(...params){
  // Enter code here
}
```
5. Trigger _reverse_ algorithm
```js
addReverseAlgorithm(...?params){
  // Enter code here
}
```

## CryptoUtils
These are some utilites with cryptography

**b642Bytes** Converts Base64 to Bytes
```js
CryptoUtils.b64ToBytes(base64);
```

**bytesToB64** Converts Bytes to Base64
```js
CryptoUtils.bytesToB64(bytes);
```

**randomBytes** Generates a random bytes
```js
CryptoUtils.randomBytes(length);
```

**utf8ToBytes** Converts UTF-8 to Bytes
```js
CryptoUtils.utf8ToBytes(str);
```

**bytesToUtf8** Converts Bytes to UTF-8
```js
CryptoUtils.bytesToUtf8(str);
```

**generateB64Key** Generates a Base64 key
```js
CryptoUtils.generateB64Key(length);
```

## GUI
To enter the the GUI mode, use this code below
```js
import { ReverseEngineerGUI } from './ReverseEngineer.js';
// Import any algorithms you wish to add
const gui = new ReverseEngineerGUI();
gui.setTheme(theme='default');
gui.build({
    title: string||'Reverse Engineer';
    mount: HTMLElement||document.body;
    algos: Object[];
});
```
