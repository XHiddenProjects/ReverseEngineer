import {ReverseEngineer} from '../../ReverseEngineer.js';

export const CaesarCipher = class extends ReverseEngineer {
  // Configuration
  static name = "Caesar Cipher";
  static description = 'This will forward and reverse in Caesar Cipher';
  static version = '1.2.1';

  static UI_POLICY = {
    requiresInit:false,
    directions:{
      init:{
        input:false, args:false, inputPh:'—', argsPh:'—'
      },
      forward:{
        input:true, args:true,
        inputPh:'Plaintext to shift (A‑Z / a‑z, others preserved)',
        argsPh:`[shifts?, characters?]
Defaults: [1, "ABCDEFGHIJKLMNOPQRSTUVWXYZ"]
Examples:
 [13] // ROT13
 [3, "ABCDEFGHIJKLMNOPQRSTUVWXYZ"]
 [5, "abcdefghijklmnopqrstuvwxyz"]`
      },
      reverse:{
        input:true, args:true,
        inputPh:'Ciphertext to unshift',
        argsPh:`Either:
- [shifts?, characters?]  // numeric shift (as before)
- [{ "bruteForce": true, "minShift": 0, "maxShift": 25, "characters": "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "filter": "hello|test" }]
(When bruteForce is true, returns an array of { shift, plaintext }.)`
      }
    }
  }

  static category = "Ciphers";
  static tags = ["Caesar", "ROT13", "Shift", "Substitution", "Classical", "Encrypt", "Decrypt"];

  constructor(){
    super();
    this.getInstance();
  }

  /**
   * Execute on initialize
   */
  init(){
    this.debug('INFO','Caesar Cipher algorithm successfully loaded!');
  }

  /**
   * Forward algorithm (encrypt)
   * @param {string} message Message
   * @param {Number} [shifts=1] How many shifts
   * @param {string} [characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'] Characters
   * @returns {string} Encoded text
   */
  addForwardAlgorithm(message, shifts=1, characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'){
    if(message === undefined || message === null) throw new Error("You must include a message");
    if(typeof shifts !== 'number' || !Number.isFinite(shifts)) throw new TypeError("Shifts must be a finite number");

    const split = characters.split('');
    const alphaLen = split.length;

    const isUpperCase = (char) => /[A-Z]/.test(char);
    const isLowerCase = (char) => /[a-z]/.test(char);

    let encode = '';
    for (let i = 0; i < String(message).length; i++){
      const ch = message[i];
      const index = split.indexOf(ch.toLocaleUpperCase());
      if(index < 0){
        encode += ch;
      } else {
        const newIndex = ((index + shifts) % alphaLen + alphaLen) % alphaLen;
        if (isUpperCase(ch)) encode += split[newIndex].toLocaleUpperCase();
        else if (isLowerCase(ch)) encode += split[newIndex].toLocaleLowerCase();
        else encode += split[newIndex];
      }
    }
    return encode;
  }

  /**
   * Reverse algorithm (decrypt). Supports:
   *  - numeric shift: (encode, shifts=1, characters='...') -> string
   *  - brute force via options object as the second arg:
   *      (encode, { bruteForce:true, minShift:0, maxShift:25, characters:'...', filter:'regex' })
   *    -> Array<{ shift:number, plaintext:string }>
   *
   * @param {String} encode Encoded message
   * @param {number|object} [shiftsOrOptions=1] Number of shifts or options object for brute force
   * @param {string} [characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'] Characters (used when shifts is numeric)
   * @returns {string|Array<{shift:number, plaintext:string}>}
   */
  addReverseAlgorithm(encode, shiftsOrOptions=1, characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'){
    if(encode === undefined || encode === null) throw new Error("You must include a message");

    // If user passed an options object, treat as brute-force mode
    if (shiftsOrOptions && typeof shiftsOrOptions === 'object' && !Array.isArray(shiftsOrOptions)) {
      const {
        bruteForce = false,
        minShift = 0,
        maxShift = (shiftsOrOptions.characters ? String(shiftsOrOptions.characters).length - 1 : characters.length - 1),
        characters: charsOpt,
        filter
      } = shiftsOrOptions;

      const alphabet = (charsOpt ? String(charsOpt) : String(characters)) || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const split = alphabet.split('');
      const alphaLen = split.length;

      if (!bruteForce) {
        // Treat as single-shift decode where options object also supplied a "shift" (optional)
        const s = Number.isFinite(shiftsOrOptions.shift) ? Number(shiftsOrOptions.shift) : 1;
        return this.#decodeSingle(String(encode), s, split);
      }

      // Brute-force path
      const min = Math.max(0, Number.isFinite(minShift) ? Math.trunc(minShift) : 0);
      const max = Math.max(min, Number.isFinite(maxShift) ? Math.trunc(maxShift) : alphaLen - 1);
      const rx = this.#toRegex(filter);

      const results = [];
      for (let s = min; s <= max; s++) {
        const plaintext = this.#decodeSingle(String(encode), s, split);
        if (!rx || rx.test(plaintext)) {
          results.push({ shift: s, plaintext });
        }
      }
      return results;
    }

    // Backward-compatible numeric shift path
    if(typeof shiftsOrOptions !== 'number' || !Number.isFinite(shiftsOrOptions))
      throw new TypeError("Shifts must be a finite number (or pass an options object with bruteForce:true)");

    const split = characters.split('');
    return this.#decodeSingle(String(encode), shiftsOrOptions, split);
  }

  // --------------------- Private helpers ---------------------

  /**
   * Decode a Caesar shift using a given alphabet as split array.
   * @param {string} text
   * @param {number} shifts
   * @param {string[]} split
   * @returns {string}
   */
  #decodeSingle(text, shifts, split){
    const isUpperCase = (char) => /[A-Z]/.test(char);
    const isLowerCase = (char) => /[a-z]/.test(char);

    const alphaLen = split.length;
    const s = ((Number(shifts) % alphaLen) + alphaLen) % alphaLen;

    let decode = '';
    for (let i = 0; i < text.length; i++){
      const ch = text[i];
      const index = split.indexOf(ch.toLocaleUpperCase());
      if(index < 0){
        decode += ch;
      } else {
        const newIndex = (index - s + alphaLen) % alphaLen;
        if (isUpperCase(ch)) decode += split[newIndex].toLocaleUpperCase();
        else if (isLowerCase(ch)) decode += split[newIndex].toLocaleLowerCase();
        else decode += split[newIndex];
      }
    }
    return decode;
  }

  /**
   * Convert string/RegExp-like input to RegExp (or null if not usable)
   * @param {any} v
   * @returns {RegExp|null}
   */
  #toRegex(v){
    if (!v) return null;
    if (v instanceof RegExp) return v;
    if (typeof v === 'string') {
      try { return new RegExp(v); } catch { return null; }
    }
    return null;
  }
};