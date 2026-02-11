import { ReverseEngineer } from "../../ReverseEngineer.js";
import {CaesarCipher} from '../../algorithms/CaesarCipher/CaesarCipher.js';
/**
 * Rot13 Algorithm
 * @description Applies ROT13 substitution cipher in both directions (symmetric).
 * @version 1.0.0
 */
export const Rot13 = class extends ReverseEngineer {
    version = "1.0.0";
    description = "ROT13 substitution cipher (A↔N, B↔O, …). Symmetric for forward/reverse.";
    #CaesarCipher;
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