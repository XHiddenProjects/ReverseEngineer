import { ReverseEngineer } from "../../ReverseEngineer.js";
export const BijectiveNumeration = class extends ReverseEngineer{
    // Configuration
    description = 'This will forward and reverse in Bijective Numeration'
    version = '1.0.0';
    constructor(){
        super();
        this.getInstance();
    }
    /**
     * Execute on initialize
     */
    init(){
        this.debug('INFO','Bijective Numeration algorithm successfully loaded!');
    }
    /**
     * Encode base-N using the Bijective Numeration
     * @param {Number} message Number to encode
     * @param {String} alphabet Alphabet of base
     * @returns {String} String value
     */
    addForwardAlgorithm(message, alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ'){
        const base = alphabet.length;
        let num = Number(message);
        if(!Number.isInteger(num)||num<0) throw new Error("message must be a number");
        if(num===0) return 'A';
        num+=1;
        let results = '';
        while(num>0){
            num-=1;
            results = alphabet[num%base]+results;
            num = Math.floor(num/base);
        }
        return results;
    }
    /**
     * Decodes base-N using the Bijective Numeration
     * @param {String} encode Encoded base-N string
     * @param {String} alphabet Alphabet string
     * @returns {Number} Numerical value
     */
    addReverseAlgorithm(encode, alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ'){
        if (typeof encode !== "string" || encode.length === 0)
            throw new Error("code must be a non-empty string");
        const base = alphabet.length,
        upper = encode.toUpperCase();
        let n = 0;
        for (const ch of upper) {
            const digit = alphabet.indexOf(ch);
            if (digit === -1) throw new Error(`Invalid character '${ch}' in code`);
            n = n * base + (digit + 1);
        }
        return n - 1;
    }
}