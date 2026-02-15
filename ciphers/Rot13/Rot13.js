import { ReverseEngineer } from "../../ReverseEngineer.js";
import {CaesarCipher} from '../CaesarCipher/CaesarCipher.js';
export const Rot13 = class extends ReverseEngineer {
    static name = "Rot13"
    static version = "1.1.1";
    static description = "ROT13 substitution cipher (A↔N, B↔O, …). Symmetric for forward/reverse.";
    #CaesarCipher;
    static UI_POLICY = {
        requiresInit:false,
        directions:{
          init:{ input:false, args:false, inputPh:'—', argsPh:'—' },
          forward:{ input:true, args:false, inputPh:'Text to transform with ROT13', argsPh:'—' },
          reverse:{ input:true, args:false, inputPh:'Text to transform with ROT13', argsPh:'—' }
        }
    }
    static category = "Ciphers";
    static tags = ["ROT13", "Caesar", "Shift", "Substitution", "Symmetric", "Encode", "Decode"];
    constructor() {
        super();
        this.#CaesarCipher = new CaesarCipher();
    }
    /**
     * Initialize the algorithm (no params needed for ROT13, but included for API consistency)
     * @returns {void}
     */
    init() {
        // Use the base class debug helper if you like:
        if (typeof this.debug === "function") 
            this.debug("INFO", "Rot13 initialized");
    }

    /**
     * Forward algorithm (ROT13)
     * @param {string} input - Text to transform
     * @returns {string} - ROT13-transformed output (type matches input)
     */
    addForwardAlgorithm(input) {
        return this.#CaesarCipher.addForwardAlgorithm(input,13);
    }

    /**
     * Reverse algorithm (ROT13 is its own inverse)
     * @param {string} input - Text to transform
     * @returns {string} - ROT13-transformed output (type matches input)
     */
    addReverseAlgorithm(input) {
        return this.#CaesarCipher.addReverseAlgorithm(input,13);
    }
}