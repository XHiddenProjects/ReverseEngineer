import {ReverseEngineer} from '../../ReverseEngineer.js';
export const CaesarCipher = class extends ReverseEngineer{
    // Configuration
    description = 'This will forward and reverse in Caesar Cipher'
    version = '1.0.0';
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
     * This is the forward algorithm
     * @param {string} message Message
     * @param {Number} [shifts=1] How many shifts
     * @param {string} [characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'] Characters
     * @returns {Object} Forward object methods
     */
    addForwardAlgorithm(message, shifts=1, characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'){
        if(!message) throw new Error("You must include a message");
        if(typeof shifts !== 'number') throw new TypeError("Shifts must be a number");
        const split = characters.split('');
        let encode = '';
        const isUpperCase = (char) => /[A-Z]/.test(char);
        const isLowerCase = (char) => /[a-z]/.test(char);
        for(let msg in message){
            const index = split.indexOf(message[msg].toLocaleUpperCase())
            if(index<0) encode+=message[msg];
            else{
                const newIndex = (index + shifts) % split.length
                if(isUpperCase(message[msg]))
                    encode+=split[newIndex].toLocaleUpperCase();
                if(isLowerCase(message[msg]))
                    encode+=split[newIndex].toLocaleLowerCase();
            }
        }
        return encode;
    }
    /**
     * This is the reverse algorithm
     * @param {String} encode Encoded message
     * @param {number} [shifts=1] Number of shifts
     * @param {string} [characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'] Characters
     * @returns {Object} Reverse object methods
     */
    addReverseAlgorithm(encode, shifts=1, characters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'){
        if(!encode) throw new Error("You must include a message");
        if(typeof shifts !== 'number') throw new TypeError("Shifts must be a number");
        const split = characters.split('');
        let decode = '';
        const isUpperCase = (char) => /[A-Z]/.test(char);
        const isLowerCase = (char) => /[a-z]/.test(char);
        for(let msg in encode){
            const index = split.indexOf(encode[msg].toLocaleUpperCase())
            if(index<0) decode+=encode[msg];
            else{
                const newIndex = (index - shifts + split.length) % split.length;
                if(isUpperCase(encode[msg])){
                    decode+=split[newIndex].toLocaleUpperCase();
                }
                if(isLowerCase(encode[msg])){
                    decode+=split[newIndex].toLocaleLowerCase();
                }
            }
        }
        return decode;
    }
}