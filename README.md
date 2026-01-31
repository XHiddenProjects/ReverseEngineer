# ReverseEngineer
ReverseEngineer is a ES6 JS library algorithm that developers can create their own custom algorithm or use existing algorithms to reverse and forward strings

## What needs to be downloaded
1. ReverseEngineer.js
2. `algorithms` folder - This contains predefined.

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

