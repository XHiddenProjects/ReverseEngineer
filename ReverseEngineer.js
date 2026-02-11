/**
 * ReverseEngineer
 * @exports ReverseEngineer
 * @author XHiddenProjects
 * @version 1.1.2
 * @description Reverse Engineer uses existing algorithms to reverse it back
 * @see {@link https://github.com/XHiddenProjects/ReverseEngineer | Documentation}
 */
export const ReverseEngineer = class{
    #instance;
    #algorithms;
    /**
     * Creates the instance of ReverseEngineer class
     */
    constructor(){
        // The instance 
        this.#instance = false;
        this.#algorithms = [];
    }
    /**
     * Get the class Instance before 
     * @returns {ReverseEngineer}
     */
    getInstance(){
        if (this.#instance) return this.#instance;
        this.#instance = this;
        return this.#instance;
    }
    
    /**
     * Outputs a formatted debug/log message to the console.
     *
     * @param {string} [label='INFO'] 
     *        The log level or label (e.g., "INFO", "WARN", "ERROR", "DEBUG").
     *
     * @param {string} [message=''] 
     *        The main message text to output.
     *
     * @param {Object} [meta] 
     *        Optional metadata object that will be logged as a second argument.
     *
     * @returns {void}
     *
     * @example
     * debug("INFO", "Loaded successfully");
     *
     * @example
     * debug("ERROR", "Something failed", { error: err });
     *
     * @example
     * debug("DEBUG", "Algorithm params", { params });
     */
    debug(label = 'INFO', message = '', meta = undefined) {
        const ts = new Date().toISOString();
        const lvl = String(label).trim().toUpperCase();

        // Don't crash the library if instance isn't initialized.
        // Either log anyway, or noop—I'd recommend log anyway.
        const prefix = `[${ts}] [${lvl}]`;

        // Pick console method by level
        const fn =
            lvl === 'ERROR' ? console.error :
            lvl === 'WARN'  ? console.warn  :
            lvl === 'DEBUG' ? console.debug :
                            console.info;

        if (meta !== undefined) fn(`${prefix} - ${message}`, meta);
        else fn(`${prefix} - ${message}`);
    }

    /**
     * Checks if the algorithm exists
     * @param {String} name Algorithm name
     * @returns {Boolean} True if the algorithm exists, else False
     */
    #hasAlgorithm(name){
        let exists=false;
        this.#algorithms.map(obj=>{
            exists = obj.algo_name.toLowerCase()===name.toLowerCase()
        });
        return exists;
    }
    /**
     * Returns the algorithm information
     * @param {String} name Algorithm name
     * @returns {Object} Algorithms object
     */
    #getAlgorithm(name){
        let algorithm;
        this.#algorithms.map(obj=>{
            if(obj.algo_name.toLowerCase()===name.toLowerCase())
                algorithm = obj;
        });
        return algorithm;
    }
    /**
     * Add an algorithm to the object
     * @param {Function} Algo Algorithm class (constructor)
     * @returns {ReverseEngineer}
     */
    add(Algo) {
        if (!this.#instance) throw new Error("You must use the getInstance() before running this");

        const AlgoObj = {};
        const algo = new Algo();
        const ClassName = algo.constructor.name;

        // This check is redundant because `new Algo()` already ensures it's the right type,
        // but keeping it doesn't hurt.
        if (!(algo instanceof Algo)) throw new TypeError(`It must be a ${ClassName} class`);

        if (this.#hasAlgorithm(ClassName)) throw new Error(`${ClassName} already exists`);

        AlgoObj.algo_name = ClassName;
        AlgoObj.algo_version = algo.version || "1.0.0";
        AlgoObj.algo_description = algo.description || "";
        AlgoObj.instance = algo;
        AlgoObj.__loaded = true;
        if (typeof algo.init === "function") 
            AlgoObj.algo_init = algo.init.bind(algo);
        if (typeof algo.addForwardAlgorithm === "function") {
            AlgoObj.algo_forward = algo.addForwardAlgorithm.bind(algo);
        } else 
            throw new ReferenceError(`You are missing "addForwardAlgorithm()" method in ${ClassName}`);
        if (typeof algo.addReverseAlgorithm === "function") {
            AlgoObj.algo_reverse = algo.addReverseAlgorithm.bind(algo);
        } else 
            throw new ReferenceError(`You are missing "addReverseAlgorithm()" method in ${ClassName}`);
        this.#algorithms.push(AlgoObj);
        return this;
    }

    /**
     * Remove an algorithm
     * @param {?Object|String} Algo Algorithm to remove, if null it deletes everything
     * @returns 
     */
    remove(Algo = null) {
        if (!Algo) {
            this.#algorithms = [];
            return this;
        }
        const name = typeof Algo === "string"
            ? Algo
            : Algo.name;

        this.#algorithms = this.#algorithms.filter(i => i.algo_name !== name);
        return this;
    }
    /**
     * Execute the class on init
     * @param {Object} algorithm Algorithm class
     * @param  {...any} params Any configuration parameters for the method
     * @returns {any}
     */
    init(algorithm,...params){
        const name = typeof algorithm === "string" ? algorithm : new algorithm().constructor.name;
        const getAlgo = this.#getAlgorithm(name);
        if(!getAlgo?.instance) throw new Error(`${name} has not been instanced`);
        return getAlgo.algo_init(...params);
    }
    /**
     * Forward the algorithms
     * @param {Object} algorithm Algorithm class
     * @param  {...any} params Any configuration parameters for the method
     * @returns {any}
     */
    forward(algorithm,...params){
        algorithm = typeof algorithm === "string" ? algorithm : new algorithm().constructor.name;
        const name = algorithm,
        getAlgo = this.#getAlgorithm(name);
        if(!getAlgo?.instance) throw new Error(`${name} has not been instanced`);
        return getAlgo.algo_forward(...params);
    }
    /**
     * Reverse the algorithm
     * @param {Object} algorithm Algorithm class
     * @param  {...any} params Any configuration parameters for the method
     * @returns {any}
     */
    reverse(algorithm,...params){
        const name = typeof algorithm === "string" ? algorithm : new algorithm().constructor.name,
        getAlgo = this.#getAlgorithm(name);
        if(!getAlgo?.instance) throw new Error(`${name} has not been instanced`);
        return getAlgo.algo_reverse(...params);
    }
    /**
     * List all the algorithm
     * @returns {String[]} List of loaded algorithms
     */
    list(){
        return this.#algorithms.map(obj=>obj.algo_name);
    }
}
/**
 * ReverseEngineer Crypto Utilities
 * @exports CryptoUtils
 * @author XHiddenProjects
 * @version 1.1.2
 * @description Reverse Engineer uses existing algorithms to reverse it back
 * @see {@link https://github.com/XHiddenProjects/ReverseEngineer | Documentation}
 */
export const CryptoUtils = {
    /**
     * Converts base64 to bytes
     * @param {String} b64 base64 string
     * @returns {Uint8Array} bytes
     */
    b64ToBytes: function(b64) {
        console.log(b64);
        return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    },
    /**
     * Converts bytes to base64
     * @param {Uint8Array} bytes bytes
     * @returns {String} base64 string
     */
    bytesToB64: function(bytes) {   
        return btoa(String.fromCharCode(...bytes));
    },
    /**
     * Generates random bytes
     * @param {Number} length length of the array
     * @returns {Uint8Array} random bytes
     */
    randomBytes: function(length) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return array;
    },
    /**
     * Converts utf8 string to bytes
     * @param {String} str utf8 string
     * @returns {Uint8Array} bytes
     */
    utf8ToBytes: function(str) {
        return new TextEncoder().encode(str);
    },
    /**
     * Converts bytes to utf8 string
     * @param {Uint8Array} bytes bytes
     * @returns {String} utf8 string
     */
    bytesToUtf8: function(bytes) {
        return new TextDecoder().decode(bytes);
    },
    /**
     * Generates a base64 key
     * @param {number} length Length of the key in bytes
     * @returns {string} base64-encoded key
     */
    generateB64Key: function(length = 32) {
        const keyBytes = this.randomBytes(length);
        return this.bytesToB64(keyBytes);
    }
};
